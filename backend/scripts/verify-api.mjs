import assert from "node:assert/strict";

const base = "http://127.0.0.1:4176";
let checks = 0;

async function call(path, { method = "GET", token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json();
  if (!res.ok || !payload.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${payload?.error?.code}: ${payload?.error?.message}`);
  }
  return payload.data;
}

async function login(role) {
  return call("/api/auth/demo", { method: "POST", body: { role } });
}

function pass(label) {
  checks += 1;
  console.log(`PASS ${label}`);
}

const roles = ["student", "mentor", "interviewer", "lab_manager", "college_admin", "college_leader", "sys_admin"];
const sessions = {};

const health = await call("/api/health");
assert.equal(health.status, "ok");
assert.equal(health.database, "sqlite");
pass("health + sqlite");

for (const role of roles) {
  const session = await login(role);
  assert.ok(session.token, `${role} token`);
  assert.equal(session.user.role, role);
  assert.equal(session.state.role, role);
  assert.ok(Array.isArray(session.state.permissions));
  const boot = await call("/api/bootstrap", { token: session.token });
  assert.equal(boot.state.currentUser.role, role);
  sessions[role] = session;
  pass(`role login ${role}`);
}

const sys = sessions.sys_admin.token;
let state = (await call("/api/admin/reset", { method: "POST", token: sys })).state;
assert.equal(state.stage, "offer");
assert.equal(state.published, false);
assert.equal(state.frozenAt, null);
pass("reset clean baseline");

state = (await call("/api/demo/stage", { method: "POST", token: sys, body: { stage: "interview" } })).state;
assert.equal(state.stage, "interview");
const interviewer = sessions.interviewer.token;
state = (await call("/api/candidates/cand-6/score", { method: "PATCH", token: interviewer, body: { score: 85, comment: "E2E 写入测试评分。" } })).state;
assert.equal(state.candidates.find((c) => c.id === "cand-6").score, 85);
const afterReload = (await call("/api/bootstrap", { token: interviewer })).state;
assert.equal(afterReload.candidates.find((c) => c.id === "cand-6").score, 85);
pass("interview score persists after reload");

const mentor = sessions.mentor.token;
state = (await call("/api/candidates/cand-6/decision", { method: "PATCH", token: mentor, body: { decision: "waitlist" } })).state;
assert.equal(state.candidates.find((c) => c.id === "cand-6").decision, "waitlist");
state = (await call("/api/candidates/submit", { method: "POST", token: mentor })).state;
assert.equal(state.candidateListSubmitted, true);
pass("mentor decision + candidate list submit");

const guard = await call("/api/bootstrap", { token: mentor });
assert.equal(guard.state.candidateListSubmitted, true);

state = (await call("/api/demo/stage", { method: "POST", token: sys, body: { stage: "offer" } })).state;
const student = sessions.student.token;
const beforeOffer = (await call("/api/bootstrap", { token: student })).state;
const beforeUnit = beforeOffer.units.find((u) => u.id === "u1").stats;
state = (await call("/api/offers/offer-1/confirm", { method: "POST", token: student })).state;
assert.equal(state.confirmedOfferId, "offer-1");
assert.equal(state.offers.find((o) => o.id === "offer-2").status, "superseded");
const afterOffer = (await call("/api/bootstrap", { token: student })).state;
const afterUnit = afterOffer.units.find((u) => u.id === "u1").stats;
assert.equal(afterUnit.confirmed, beforeUnit.confirmed + 1);
assert.equal(afterUnit.pending, beforeUnit.pending - 1);
pass("student confirms offer, quota counters update");

const college = sessions.college_admin.token;
const u6Before = (await call("/api/bootstrap", { token: college })).state.units.find((u) => u.id === "u6");
state = (await call("/api/units/u6/quota", { method: "PATCH", token: college, body: { quota: u6Before.quota + 1 } })).state;
assert.equal(state.units.find((u) => u.id === "u6").quota, u6Before.quota + 1);
const quotaReload = (await call("/api/bootstrap", { token: college })).state;
assert.equal(quotaReload.units.find((u) => u.id === "u6").quota, u6Before.quota + 1);
state = (await call("/api/units/u6/quota", { method: "PATCH", token: college, body: { quota: u6Before.quota } })).state;
assert.equal(state.units.find((u) => u.id === "u6").quota, u6Before.quota);
pass("college quota save + reload + restore");

state = (await call("/api/demo/stage", { method: "POST", token: sys, body: { stage: "publicity" } })).state;
assert.equal(state.stage, "publicity");
const adjustmentsBefore = (await call("/api/bootstrap", { token: sessions.college_leader.token })).state.adjustmentQueue;
for (const item of adjustmentsBefore.filter((row) => row.status !== "已生成")) {
  const tokenForAdj = item.authorized ? college : sessions.college_leader.token;
  state = (await call(`/api/adjustments/${item.id}/approve`, { method: "POST", token: tokenForAdj })).state;
  assert.equal(state.adjustmentQueue.find((row) => row.id === item.id).status, "已生成");
}
pass("adjustment queue approved by college admin / leader");
state = (await call("/api/publications/publish", { method: "POST", token: college })).state;
assert.equal(state.published, true);
assert.ok(state.publishedAt);
pass("publication generated");

state = (await call("/api/appeals", { method: "POST", token: student, body: { content: "这是端到端测试提交的公示异议说明。" } })).state;
const appeal = state.appeals.find((a) => a.status === "待处理");
assert.ok(appeal);
const leader = sessions.college_leader.token;
state = (await call(`/api/appeals/${appeal.id}/resolve`, { method: "POST", token: leader })).state;
assert.equal(state.appeals.find((a) => a.id === appeal.id).status, "已办结");
pass("appeal submit + leader resolve");

state = (await call("/api/publications/freeze", { method: "POST", token: leader })).state;
assert.ok(state.frozenAt);
const frozenReload = (await call("/api/bootstrap", { token: leader })).state;
assert.ok(frozenReload.frozenAt);
pass("leader freezes final list, persists");

const sysState = (await call("/api/bootstrap", { token: sys })).state;
const target = sysState.users.find((u) => u.account === "mentor");
assert.ok(target);
state = (await call(`/api/admin/users/${target.id}`, { method: "PATCH", token: sys, body: { active: false } })).state;
assert.equal(state.users.find((u) => u.id === target.id).active, false);
state = (await call(`/api/admin/users/${target.id}`, { method: "PATCH", token: sys, body: { active: true } })).state;
assert.equal(state.users.find((u) => u.id === target.id).active, true);
pass("system admin account status update + restore");

state = (await call("/api/admin/reset", { method: "POST", token: sys })).state;
assert.equal(state.stage, "offer");
assert.equal(state.published, false);
assert.equal(state.frozenAt, null);
assert.equal(state.candidates.find((c) => c.id === "cand-6").score, null);
assert.equal(state.offers.find((o) => o.id === "offer-1").status, "pending");
pass("final reset restores demo baseline");

console.log(`ALL ${checks} CHECKS PASSED`);
