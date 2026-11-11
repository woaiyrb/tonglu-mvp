import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendAudit,
  db,
  DB_PATH,
  findUserById,
  getSessionUser,
  login,
  logout,
  nowIso,
  resetBusinessData,
  sanitizeUser,
  transaction,
} from "./database.mjs";
import { DEMO_PASSWORD, PUBLIC_RESULTS } from "./seed-data.mjs";

const PORT = Number(process.env.PORT ?? 4176);
const HOST = process.env.HOST ?? "127.0.0.1";
const APP_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST_ROOT = join(APP_ROOT, "dist");

const ROLES = new Set([
  "student",
  "mentor",
  "interviewer",
  "lab_manager",
  "college_admin",
  "college_leader",
  "sys_admin",
]);

const STAGES = new Set(["intent", "interview", "offer", "supplement", "adjustment", "publicity"]);

const DEMO_ACCOUNTS = {
  student: "student",
  mentor: "mentor",
  interviewer: "interviewer",
  lab_manager: "lab",
  college_admin: "college",
  college_leader: "leader",
  sys_admin: "system",
};

const ROLE_PERMISSIONS = {
  student: ["application:write", "offer:confirm", "appeal:write", "self:read"],
  mentor: ["candidate:score", "candidate:decide", "candidate:submit", "unit:read"],
  interviewer: ["candidate:score", "unit:read"],
  lab_manager: ["unit:read", "candidate:read", "export:read"],
  college_admin: ["cycle:admin", "quota:write", "supplement:write", "adjustment:approve", "publicity:publish", "appeal:resolve", "audit:read", "unit:read"],
  college_leader: ["adjustment:approve:exception", "publicity:freeze", "appeal:resolve", "audit:read", "unit:read"],
  sys_admin: ["user:admin", "audit:read", "system:reset", "system:read"],
};

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && /^(http:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function ok(res, data, status = 200) {
  sendJson(res, status, { ok: true, data });
}

function fail(res, status, code, message) {
  sendJson(res, status, { ok: false, error: { code, message } });
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "请求体过大。");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "请求体不是合法 JSON。");
  }
}

function bearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

function requireUser(req) {
  const user = getSessionUser(bearerToken(req));
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "会话已失效，请重新登录。");
  return user;
}

function requireRole(user, roles) {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "当前角色没有执行此操作的权限。");
  }
}

function getCycle() {
  return db.prepare("SELECT * FROM cycle WHERE id = 1").get();
}

function requireStage(...stages) {
  const cycle = getCycle();
  if (!stages.includes(cycle.stage)) {
    throw new ApiError(409, "STAGE_LOCKED", "当前业务阶段不允许此操作，请切换到正确阶段。");
  }
  return cycle;
}

function assertNotFrozen(cycle) {
  if (cycle.frozen_at) {
    throw new ApiError(409, "RESULT_FROZEN", "正式名单已冻结，只能走更正流程。");
  }
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function latestApplication(studentId) {
  return db.prepare("SELECT * FROM applications WHERE student_id = ? ORDER BY version DESC LIMIT 1").get(studentId) ?? null;
}

function studentDraft(studentId) {
  const draft = db.prepare("SELECT * FROM application_drafts WHERE student_id = ?").get(studentId);
  const application = latestApplication(studentId);
  if (draft) {
    return {
      selectedUnitIds: parseJson(draft.selected_units, []),
      adjustments: parseJson(draft.adjustments, { internal: false, cross: false }),
      commitment: Boolean(draft.commitment),
    };
  }
  if (application) {
    return {
      selectedUnitIds: parseJson(application.selected_units, []),
      adjustments: parseJson(application.adjustments, { internal: false, cross: false }),
      commitment: Boolean(application.commitment),
    };
  }
  return { selectedUnitIds: [], adjustments: { internal: false, cross: false }, commitment: false };
}

function mapOffer(row) {
  return {
    id: row.id,
    unitId: row.unit_id,
    status: row.status,
    issuedAt: row.issued_at,
    deadline: row.deadline,
    score: row.score,
    note: row.note,
  };
}

function mapInterview(row) {
  return {
    id: row.id,
    unitId: row.unit_id,
    dateLabel: row.date_label,
    time: row.time,
    location: row.location,
    interviewer: row.interviewer,
    status: row.status,
    score: row.score,
  };
}

function mapCandidate(row) {
  return {
    id: row.id,
    name: row.name,
    studentNo: row.student_no,
    major: row.major,
    interviewAt: row.interview_at,
    score: row.score,
    comment: row.comment,
    decision: row.decision,
  };
}

const UNIT_VISUALS = [
  { tone: "sage", glyph: "spark", tags: ["AI Agent", "多模态", "Python"], summary: "围绕智能体、多模态交互与真实任务协作开展项目制训练。", training: "每周组会、双周迭代与阶段演示。", assessment: "项目贡献、代码质量与阶段答辩。", materials: "个人简历、项目说明与成绩单。", heat: 86 },
  { tone: "sky", glyph: "database", tags: ["数据平台", "SQL", "可观测性"], summary: "建设实时数据链路、指标平台与故障定位工具。", training: "数据工程任务拆解与线上演练。", assessment: "链路设计、实验记录与复盘质量。", materials: "项目代码仓库与技术说明。", heat: 74 },
  { tone: "coral", glyph: "eye", tags: ["视觉理解", "生成模型", "评测"], summary: "研究多模态视觉理解、生成与可解释评测。", training: "论文研讨、数据标注与模型评测。", assessment: "实验设计、结果分析与复现能力。", materials: "研究兴趣说明与课程项目。", heat: 91 },
  { tone: "leaf", glyph: "code", tags: ["AI 研发", "工程效能", "测试"], summary: "用 AI 辅助研发流程，关注工程质量与交付效率。", training: "结对开发、代码评审与自动化测试。", assessment: "工程实践、协作记录与交付质量。", materials: "代码样例与工程实践说明。", heat: 69 },
  { tone: "gold", glyph: "chip", tags: ["边缘智能", "嵌入式", "低功耗"], summary: "面向边缘设备开展智能算法与低功耗硬件协同训练。", training: "硬件实验、驱动开发与联合调试。", assessment: "硬件调试、系统集成与安全规范。", materials: "硬件项目说明与实验记录。", heat: 80 },
  { tone: "rose", glyph: "compass", tags: ["产品研究", "人机协作", "体验"], summary: "研究人机协作产品、服务设计与体验评估方法。", training: "用户访谈、原型迭代与可用性测试。", assessment: "问题洞察、原型质量与验证证据。", materials: "产品作品集与用户研究样例。", heat: 63 },
];

function mapUnit(row, index) {
  const live = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN status <> 'pending' THEN 1 ELSE 0 END) AS released
    FROM offers WHERE unit_id = ?
  `).get(row.id);
  // base_confirmed/base_pending already count the seeded offers. Only apply
  // the status change delta so a confirmed offer is not counted twice.
  const confirmed = row.base_confirmed + Number(live?.confirmed ?? 0);
  const pending = Math.max(0, row.base_pending - Number(live?.released ?? 0));
  const remaining = Math.max(0, row.quota - confirmed - pending);
  const visual = UNIT_VISUALS[index % UNIT_VISUALS.length];
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    direction: row.direction,
    mentor: row.mentor,
    mentorTitle: row.mentor_title,
    quota: row.quota,
    confirmed,
    pending,
    tags: visual.tags,
    summary: visual.summary,
    training: visual.training,
    assessment: visual.assessment,
    materials: visual.materials,
    schedule: row.schedule,
    location: row.location,
    tone: visual.tone,
    glyph: visual.glyph,
    heat: visual.heat,
    stats: {
      confirmed,
      pending,
      remaining,
      fillRate: Math.round(((confirmed + pending) / row.quota) * 100),
    },
  };
}

function mapAdjustment(row) {
  return {
    id: row.id,
    studentName: row.student_name,
    studentNo: row.student_no,
    source: row.source,
    target: row.target,
    priority: row.priority,
    authorized: Boolean(row.authorized),
    status: row.status,
    note: row.note,
  };
}

function mapAppeal(row) {
  return {
    id: row.id,
    studentName: row.student_name,
    content: row.content,
    createdAt: row.created_at,
    status: row.status,
  };
}

function mapAudit(row) {
  return {
    id: row.id,
    at: row.at,
    actor: row.actor,
    action: row.action,
    object: row.object,
    detail: row.detail,
  };
}

function buildSnapshot(user) {
  const cycle = getCycle();
  const isStudent = user.role === "student";
  const isCollege = ["college_admin", "college_leader", "sys_admin"].includes(user.role);
  const draft = isStudent ? studentDraft(user.id) : studentDraft("stu-sy");
  const application = isStudent ? latestApplication(user.id) : null;
  const confirmedOffer = isStudent
    ? db.prepare("SELECT * FROM offers WHERE student_id = ? AND status = 'confirmed' LIMIT 1").get(user.id)
    : db.prepare("SELECT * FROM offers WHERE student_id = 'stu-sy' AND status = 'confirmed' LIMIT 1").get();

  const offers = isStudent
    ? db.prepare("SELECT * FROM offers WHERE student_id = ? ORDER BY issued_at").all(user.id)
    : db.prepare("SELECT * FROM offers ORDER BY issued_at").all();

  let candidates = [];
  if (user.role === "student") {
    candidates = [];
  } else if (["mentor", "interviewer", "lab_manager"].includes(user.role)) {
    candidates = db.prepare("SELECT * FROM candidates WHERE unit_id = ? ORDER BY interview_at").all(user.unitId ?? "");
  } else {
    candidates = db.prepare("SELECT * FROM candidates ORDER BY interview_at").all();
  }

  let adjustments = [];
  if (["college_admin", "college_leader"].includes(user.role)) {
    adjustments = db.prepare("SELECT * FROM adjustments ORDER BY priority, student_no").all();
  }

  let appeals = [];
  if (isStudent) {
    appeals = db.prepare("SELECT * FROM appeals WHERE student_id = ? ORDER BY created_at DESC").all(user.id);
  } else if (["college_admin", "college_leader", "sys_admin"].includes(user.role)) {
    appeals = db.prepare("SELECT * FROM appeals ORDER BY created_at DESC").all();
  }

  let auditRows;
  if (isCollege) {
    auditRows = db.prepare("SELECT * FROM audit_logs ORDER BY seq DESC LIMIT 200").all();
  } else {
    auditRows = db.prepare("SELECT * FROM audit_logs WHERE actor = ? ORDER BY seq DESC LIMIT 40").all(user.name);
  }

  let users = [];
  let dbStats = null;
  if (user.role === "sys_admin") {
    users = db.prepare("SELECT * FROM users ORDER BY created_at, account").all().map(sanitizeUser);
    dbStats = {
      path: DB_PATH,
      users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
      activeSessions: db.prepare("SELECT COUNT(*) AS count FROM sessions WHERE expires_at > ?").get(nowIso()).count,
      auditEvents: db.prepare("SELECT COUNT(*) AS count FROM audit_logs").get().count,
      candidates: db.prepare("SELECT COUNT(*) AS count FROM candidates").get().count,
      offers: db.prepare("SELECT COUNT(*) AS count FROM offers").get().count,
    };
  }

  const interviews = isStudent
    ? db.prepare("SELECT * FROM interviews WHERE student_id = ? ORDER BY date_label, time").all(user.id)
    : db.prepare("SELECT * FROM interviews ORDER BY date_label, time").all();

  return {
    role: user.role,
    units: db.prepare("SELECT * FROM units ORDER BY id").all().map(mapUnit),
    currentUser: user,
    permissions: ROLE_PERMISSIONS[user.role] ?? [],
    stage: cycle.stage,
    selectedUnitIds: draft.selectedUnitIds,
    adjustments: draft.adjustments,
    commitment: draft.commitment,
    application: application
      ? {
          submittedAt: application.submitted_at,
          version: application.version,
          round: application.round,
          idempotencyKey: application.idempotency_key,
        }
      : null,
    offers: offers.map(mapOffer),
    confirmedOfferId: confirmedOffer?.id ?? null,
    finalUnitId: confirmedOffer?.unit_id ?? null,
    interviews: interviews.map(mapInterview),
    candidates: candidates.map(mapCandidate),
    candidateListSubmitted: Boolean(cycle.candidate_list_submitted),
    adjustmentQueue: adjustments.map(mapAdjustment),
    published: Boolean(cycle.published),
    publishedAt: cycle.published_at,
    frozenAt: cycle.frozen_at,
    appeals: appeals.map(mapAppeal),
    supplementRound: cycle.supplement_round,
    supplementGeneratedAt: cycle.supplement_generated_at,
    audit: auditRows.map(mapAudit),
    users,
    dbStats,
  };
}

function saveDraft(studentId, selectedUnitIds, adjustments, commitment) {
  const cycle = requireStage("intent");
  assertNotFrozen(cycle);
  if (selectedUnitIds.length > 3) {
    throw new ApiError(422, "TOO_MANY_UNITS", "每轮最多选择 3 个平行意向。");
  }
  const unique = [...new Set(selectedUnitIds)];
  if (unique.length !== selectedUnitIds.length) {
    throw new ApiError(422, "DUPLICATE_UNITS", "意向方向不能重复。");
  }
  const existing = db.prepare("SELECT id FROM units WHERE id IN (SELECT value FROM json_each(?))").all(JSON.stringify(unique));
  if (existing.length !== unique.length) {
    throw new ApiError(422, "UNKNOWN_UNIT", "存在无效的招生方向。");
  }
  db.prepare(`
    INSERT INTO application_drafts (student_id, selected_units, adjustments, commitment, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id) DO UPDATE SET
      selected_units = excluded.selected_units,
      adjustments = excluded.adjustments,
      commitment = excluded.commitment,
      updated_at = excluded.updated_at
  `).run(studentId, JSON.stringify(unique), JSON.stringify(adjustments), commitment ? 1 : 0, nowIso());
}

function handleSubmitApplication(user, body) {
  requireRole(user, ["student"]);
  const cycle = requireStage("intent");
  assertNotFrozen(cycle);
  const draft = studentDraft(user.id);
  if (body.selectedUnitIds) {
    saveDraft(user.id, body.selectedUnitIds, body.adjustments ?? draft.adjustments, body.commitment ?? draft.commitment);
  }
  const current = studentDraft(user.id);
  if (current.selectedUnitIds.length === 0) {
    throw new ApiError(422, "NO_UNITS", "至少选择 1 个招生方向后才能提交。");
  }
  if (!current.commitment) {
    throw new ApiError(422, "COMMITMENT_REQUIRED", "请先确认材料真实性与承诺声明。");
  }
  const idempotencyKey = String(body.idempotencyKey ?? "").trim();
  if (idempotencyKey) {
    const existing = db.prepare("SELECT * FROM applications WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) return;
  }
  const latest = latestApplication(user.id);
  const version = (latest?.version ?? 0) + 1;
  const key = idempotencyKey || `${cycle.code}-${user.id}-v${version}`;
  transaction(() => {
    db.prepare(`
      INSERT INTO applications (id, student_id, submitted_at, version, round, idempotency_key, selected_units, adjustments, commitment)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(`app-${user.id}-v${version}`, user.id, nowIso(), version, key, JSON.stringify(current.selectedUnitIds), JSON.stringify(current.adjustments), current.commitment ? 1 : 0);
    appendAudit(
      user.name,
      "提交申请",
      `${cycle.code} / 申请 v${version}`,
      `提交 ${current.selectedUnitIds.length} 个平行意向；实训室内调剂${current.adjustments.internal ? "已授权" : "未授权"}，跨实训室调剂${current.adjustments.cross ? "已授权" : "未授权"}。`,
    );
  });
}

function handleConfirmOffer(user, offerId) {
  requireRole(user, ["student"]);
  const cycle = requireStage("offer");
  assertNotFrozen(cycle);
  transaction(() => {
    const offer = db.prepare("SELECT * FROM offers WHERE id = ? AND student_id = ?").get(offerId, user.id);
    if (!offer) throw new ApiError(404, "OFFER_NOT_FOUND", "拟录取不存在。");
    const confirmed = db.prepare("SELECT * FROM offers WHERE student_id = ? AND status = 'confirmed' LIMIT 1").get(user.id);
    if (confirmed) {
      if (confirmed.id === offerId) return;
      throw new ApiError(409, "ALREADY_CONFIRMED", "本周期已确认去向，不能重复确认。");
    }
    if (offer.status !== "pending") throw new ApiError(409, "OFFER_INVALID", "该拟录取已失效，请刷新后重试。");
    db.prepare("UPDATE offers SET status = 'confirmed' WHERE id = ?").run(offerId);
    db.prepare("UPDATE offers SET status = 'superseded' WHERE student_id = ? AND id <> ? AND status = 'pending'").run(user.id, offerId);
    appendAudit(user.name, "确认拟录取", offer.unit_id, "确认唯一去向，其他待确认拟录取自动失效并释放名额。");
  });
}

function handleScore(user, candidateId, body) {
  requireRole(user, ["mentor", "interviewer"]);
  const score = Number(body.score);
  const comment = String(body.comment ?? "").trim();
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new ApiError(422, "INVALID_SCORE", "评分必须是 0 到 100 的数字。");
  }
  const cycle = requireStage("interview");
  assertNotFrozen(cycle);
  const candidate = db.prepare("SELECT * FROM candidates WHERE id = ?").get(candidateId);
  if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "候选人不存在。");
  if (candidate.unit_id !== user.unitId) {
    throw new ApiError(403, "OUT_OF_SCOPE", "只能评分本人负责场次的学生。");
  }
  if (cycle.candidate_list_submitted) {
    throw new ApiError(409, "LIST_LOCKED", "候选名单已提交，评分已锁定。");
  }
  transaction(() => {
    db.prepare("UPDATE candidates SET score = ?, comment = ? WHERE id = ?").run(Math.round(score), comment, candidateId);
    appendAudit(user.name, "保存面试评分", `${candidate.name} / ${candidate.student_no}`, `评分 ${Math.round(score)}，评语已更新。`);
  });
}

function handleDecision(user, candidateId, body) {
  requireRole(user, ["mentor"]);
  const decision = body.decision;
  if (![null, "offer", "waitlist", "reject"].includes(decision)) {
    throw new ApiError(422, "INVALID_DECISION", "候选结论无效。");
  }
  const cycle = requireStage("interview");
  assertNotFrozen(cycle);
  if (cycle.candidate_list_submitted) throw new ApiError(409, "LIST_LOCKED", "候选名单已提交，结论已锁定。");
  const candidate = db.prepare("SELECT * FROM candidates WHERE id = ?").get(candidateId);
  if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "候选人不存在。");
  if (candidate.unit_id !== user.unitId) throw new ApiError(403, "OUT_OF_SCOPE", "只能处理本人实训室的候选人。");
  db.prepare("UPDATE candidates SET decision = ? WHERE id = ?").run(decision, candidateId);
}

function handleSubmitCandidates(user) {
  requireRole(user, ["mentor"]);
  const cycle = requireStage("interview");
  assertNotFrozen(cycle);
  if (cycle.candidate_list_submitted) return;
  const missing = db.prepare("SELECT COUNT(*) AS count FROM candidates WHERE unit_id = ? AND score IS NULL").get(user.unitId).count;
  if (missing > 0) throw new ApiError(422, "SCORE_INCOMPLETE", `还有 ${missing} 名学生未完成评分。`);
  transaction(() => {
    db.prepare("UPDATE cycle SET candidate_list_submitted = 1 WHERE id = 1").run();
    const offers = db.prepare("SELECT COUNT(*) AS count FROM candidates WHERE unit_id = ? AND decision = 'offer'").get(user.unitId).count;
    const waitlist = db.prepare("SELECT COUNT(*) AS count FROM candidates WHERE unit_id = ? AND decision = 'waitlist'").get(user.unitId).count;
    appendAudit(user.name, "提交候选名单", user.unitId, `拟录取 ${offers} 人，候补 ${waitlist} 人。`);
  });
}

function handleSupplement(user) {
  requireRole(user, ["college_admin"]);
  const cycle = requireStage("supplement");
  assertNotFrozen(cycle);
  if (cycle.supplement_round >= 2) throw new ApiError(409, "ROUND_LIMIT", "第二轮和第三轮补录均已生成。");
  const nextRound = cycle.supplement_round + 1;
  transaction(() => {
    db.prepare("UPDATE cycle SET supplement_round = ?, supplement_generated_at = ? WHERE id = 1").run(nextRound, nowIso());
    db.prepare("INSERT INTO supplements (id, round, generated_at, note) VALUES (?, ?, ?, ?)").run(`supp-${nextRound}`, nextRound, nowIso(), "按剩余名额重新开放填报。");
    appendAudit(user.name, "生成补录任务", `2026-AUT / 第 ${nextRound + 1} 轮补录`, "按剩余名额重新开放填报，沿用面试、拟录取和候补规则。");
  });
}

function handleAdjustment(user, id) {
  const cycle = requireStage("adjustment", "publicity");
  assertNotFrozen(cycle);
  const item = db.prepare("SELECT * FROM adjustments WHERE id = ?").get(id);
  if (!item) throw new ApiError(404, "ADJUSTMENT_NOT_FOUND", "调剂记录不存在。");
  if (item.status === "已生成") return;
  if (item.authorized) {
    requireRole(user, ["college_admin"]);
  } else {
    requireRole(user, ["college_leader"]);
  }
  transaction(() => {
    db.prepare("UPDATE adjustments SET status = '已生成' WHERE id = ?").run(id);
    appendAudit(user.name, item.authorized ? "确认调剂" : "审批并调剂", item.student_no, `从 ${item.source} 调整至 ${item.target}，优先级 ${item.priority}。`);
  });
}

function handlePublish(user) {
  requireRole(user, ["college_admin"]);
  const cycle = requireStage("publicity");
  assertNotFrozen(cycle);
  const confirmed = db.prepare("SELECT * FROM offers WHERE student_id = 'stu-sy' AND status = 'confirmed' LIMIT 1").get();
  if (!confirmed) throw new ApiError(422, "NO_CONFIRMED_OFFER", "尚有待确认拟录取，不能生成公示名单。");
  const missing = db.prepare("SELECT COUNT(*) AS count FROM candidates WHERE score IS NULL").get().count;
  if (missing > 0) throw new ApiError(422, "SCORE_INCOMPLETE", "仍有学生未完成面试评分，不能生成公示名单。");
  const unauthorized = db.prepare("SELECT COUNT(*) AS count FROM adjustments WHERE authorized = 0 AND status <> '已生成'").get().count;
  if (unauthorized > 0) throw new ApiError(422, "AUTH_PENDING", "调剂授权尚未核对完成，不能生成公示名单。");
  if (!cycle.candidate_list_submitted) throw new ApiError(422, "LIST_NOT_SUBMITTED", "导师候选名单尚未提交，不能生成公示名单。");
  const overQuota = db.prepare(`
    SELECT u.id FROM units u
    WHERE u.base_confirmed + u.base_pending > u.quota
  `).all();
  if (overQuota.length > 0) throw new ApiError(422, "QUOTA_EXCEEDED", "存在名额超限的实训室，不能公示。");

  const version = cycle.publication_version + 1;
  const snapshot = PUBLIC_RESULTS.map((row) => ({ ...row }));
  if (!snapshot.some((row) => row.studentNo === "2024010826")) {
    snapshot.push({ name: "孙悦", studentNo: "2024010826", unitId: confirmed.unit_id, source: "本轮确认" });
  }
  transaction(() => {
    db.prepare("INSERT INTO publications (id, version, published_at, snapshot_json) VALUES (?, ?, ?, ?)").run(`pub-${version}`, version, nowIso(), JSON.stringify(snapshot));
    db.prepare("UPDATE cycle SET published = 1, published_at = ?, publication_version = ? WHERE id = 1").run(nowIso(), version);
    appendAudit(user.name, "生成公示名单", `2026-AUT / 公示 V${version}`, "唯一性、名额、调剂授权和导师名单校验通过，生成公示快照。");
  });
}

function handleFreeze(user) {
  requireRole(user, ["college_admin", "college_leader"]);
  const cycle = requireStage("publicity");
  if (!cycle.published) throw new ApiError(409, "NOT_PUBLISHED", "请先生成公示名单。");
  if (cycle.frozen_at) throw new ApiError(409, "ALREADY_FROZEN", "名单已冻结，如需更正请发起更正流程。");
  transaction(() => {
    const at = nowIso();
    db.prepare("UPDATE cycle SET frozen_at = ? WHERE id = 1").run(at);
    db.prepare("UPDATE publications SET frozen_at = ? WHERE version = ?").run(at, cycle.publication_version);
    appendAudit(user.name, "冻结正式名单", `2026-AUT / 正式名单 V${cycle.publication_version}`, "公示结束，正式入组名单只读；后续修改必须走更正流程。");
  });
}

function handleAppeal(user, body) {
  requireRole(user, ["student"]);
  const cycle = getCycle();
  if (!cycle.published) throw new ApiError(409, "NOT_PUBLISHED", "公示尚未开始，不能提交异议。");
  const content = String(body.content ?? "").trim();
  if (content.length < 8) throw new ApiError(422, "CONTENT_TOO_SHORT", "请补充至少 8 个字的异议说明。");
  const id = `appeal-${Date.now()}`;
  transaction(() => {
    db.prepare("INSERT INTO appeals (id, student_id, student_name, content, created_at, status) VALUES (?, ?, ?, ?, ?, '待处理')").run(id, user.id, user.name, content, nowIso());
    appendAudit(user.name, "提交异议", `公示 V${cycle.publication_version}`, content);
  });
}

function handleResolveAppeal(user, id) {
  requireRole(user, ["college_admin", "college_leader"]);
  const appeal = db.prepare("SELECT * FROM appeals WHERE id = ?").get(id);
  if (!appeal) throw new ApiError(404, "APPEAL_NOT_FOUND", "异议不存在。");
  if (appeal.status === "已办结") return;
  transaction(() => {
    db.prepare("UPDATE appeals SET status = '已办结' WHERE id = ?").run(id);
    appendAudit(user.name, "办结异议", id, "已核对材料并记录处理结论。");
  });
}

function handleUserUpdate(actor, userId, body) {
  requireRole(actor, ["sys_admin"]);
  const target = findUserById(userId);
  if (!target) throw new ApiError(404, "USER_NOT_FOUND", "账号不存在。");
  const nextRole = body.role ?? target.role;
  const nextActive = typeof body.active === "boolean" ? body.active : Boolean(target.active);
  if (!ROLES.has(nextRole)) throw new ApiError(422, "INVALID_ROLE", "角色无效。");
  if (target.id === actor.id && (!nextActive || nextRole !== "sys_admin")) {
    throw new ApiError(409, "SELF_LOCKOUT", "不能停用自己或移除自己的系统管理员角色。");
  }
  if (target.role === "sys_admin" && (nextRole !== "sys_admin" || !nextActive)) {
    const admins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'sys_admin' AND active = 1").get().count;
    if (admins <= 1) throw new ApiError(409, "LAST_ADMIN", "必须保留至少一个启用的系统管理员。");
  }
  transaction(() => {
    db.prepare("UPDATE users SET role = ?, active = ? WHERE id = ?").run(nextRole, nextActive ? 1 : 0, userId);
    if (!nextActive) db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    appendAudit(actor.name, "更新账号权限", `${target.account} / ${target.name}`, `角色 ${target.role} → ${nextRole}，状态 ${nextActive ? "启用" : "停用"}。`);
  });
}

async function handleApi(req, res, url) {
  const { pathname } = url;

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === "/api/health" && req.method === "GET") {
    const cycle = getCycle();
    return ok(res, { status: "ok", database: "sqlite", stage: cycle.stage, time: nowIso() });
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const body = await readJson(req);
    const account = String(body.account ?? "").trim();
    const password = String(body.password ?? "");
    const session = login(account, password);
    if (!session) throw new ApiError(401, "INVALID_CREDENTIALS", "账号或密码错误。");
    return ok(res, { ...session, state: buildSnapshot(session.user) });
  }

  if (pathname === "/api/auth/demo" && req.method === "POST") {
    const body = await readJson(req);
    const role = String(body.role ?? "");
    if (!ROLES.has(role)) throw new ApiError(422, "INVALID_ROLE", "角色无效。");
    const session = login(DEMO_ACCOUNTS[role], DEMO_PASSWORD);
    if (!session) throw new ApiError(404, "DEMO_ROLE_NOT_FOUND", "该演示角色账号不可用。");
    appendAudit("系统", "演示身份切换", role, `以 ${session.user.name} 身份进入演示。`);
    return ok(res, { ...session, state: buildSnapshot(session.user) });
  }

  if (pathname === "/api/auth/logout" && req.method === "POST") {
    logout(bearerToken(req));
    return ok(res, { loggedOut: true });
  }

  const user = requireUser(req);

  if (pathname === "/api/bootstrap" && req.method === "GET") {
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/demo/stage" && req.method === "POST") {
    const body = await readJson(req);
    const stage = String(body.stage ?? "");
    if (!STAGES.has(stage)) throw new ApiError(422, "INVALID_STAGE", "业务阶段无效。");
    const cycle = getCycle();
    if (cycle.frozen_at && stage !== "publicity") {
      throw new ApiError(409, "RESULT_FROZEN", "正式名单已冻结，不能回退业务阶段。");
    }
    db.prepare("UPDATE cycle SET stage = ? WHERE id = 1").run(stage);
    appendAudit(user.name, "切换演示阶段", `2026-AUT / ${stage}`, "仅用于演示与验收，正式环境由服务器时间控制。");
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/student/draft" && req.method === "PATCH") {
    requireRole(user, ["student"]);
    const body = await readJson(req);
    const selected = Array.isArray(body.selectedUnitIds) ? body.selectedUnitIds.map(String) : [];
    const adjustments = body.adjustments ?? { internal: false, cross: false };
    saveDraft(user.id, selected, { internal: Boolean(adjustments.internal), cross: Boolean(adjustments.cross) }, Boolean(body.commitment));
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/applications" && req.method === "POST") {
    handleSubmitApplication(user, await readJson(req));
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname.startsWith("/api/offers/") && pathname.endsWith("/confirm") && req.method === "POST") {
    handleConfirmOffer(user, pathname.split("/")[3]);
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname.startsWith("/api/candidates/") && pathname.endsWith("/score") && req.method === "PATCH") {
    handleScore(user, pathname.split("/")[3], await readJson(req));
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname.startsWith("/api/candidates/") && pathname.endsWith("/decision") && req.method === "PATCH") {
    handleDecision(user, pathname.split("/")[3], await readJson(req));
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/candidates/submit" && req.method === "POST") {
    handleSubmitCandidates(user);
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/supplements" && req.method === "POST") {
    handleSupplement(user);
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname.startsWith("/api/adjustments/") && pathname.endsWith("/approve") && req.method === "POST") {
    handleAdjustment(user, pathname.split("/")[3]);
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/publications/publish" && req.method === "POST") {
    handlePublish(user);
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/publications/freeze" && req.method === "POST") {
    handleFreeze(user);
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/appeals" && req.method === "POST") {
    handleAppeal(user, await readJson(req));
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname.startsWith("/api/appeals/") && pathname.endsWith("/resolve") && req.method === "POST") {
    handleResolveAppeal(user, pathname.split("/")[3]);
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname.startsWith("/api/units/") && pathname.endsWith("/quota") && req.method === "PATCH") {
    requireRole(user, ["college_admin"]);
    const unitId = pathname.split("/")[3];
    const body = await readJson(req);
    const quota = Number(body.quota);
    const cycle = getCycle();
    assertNotFrozen(cycle);
    if (!Number.isInteger(quota) || quota < 1 || quota > 30) throw new ApiError(422, "INVALID_QUOTA", "名额必须为 1 到 30 的整数。");
    const unit = db.prepare("SELECT * FROM units WHERE id = ?").get(unitId);
    if (!unit) throw new ApiError(404, "UNIT_NOT_FOUND", "实训室不存在。");
    const live = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status <> 'pending' THEN 1 ELSE 0 END) AS released
      FROM offers WHERE unit_id = ?
    `).get(unitId);
    const confirmed = unit.base_confirmed + Number(live?.confirmed ?? 0);
    const pending = Math.max(0, unit.base_pending - Number(live?.released ?? 0));
    if (quota < confirmed + pending) throw new ApiError(422, "QUOTA_BELOW_USED", "名额不能低于已确认与待确认人数。");
    transaction(() => {
      db.prepare("UPDATE units SET quota = ? WHERE id = ?").run(quota, unitId);
      appendAudit(user.name, "调整计划名额", unit.name, `${unit.quota} → ${quota}。`);
    });
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname.startsWith("/api/admin/users/") && req.method === "PATCH") {
    handleUserUpdate(user, pathname.split("/")[4], await readJson(req));
    return ok(res, { state: buildSnapshot(user) });
  }

  if (pathname === "/api/admin/reset" && req.method === "POST") {
    requireRole(user, ["sys_admin"]);
    resetBusinessData();
    appendAudit(user.name, "恢复演示数据", "2026-AUT", "业务数据已重置，账号与会话保留。");
    return ok(res, { state: buildSnapshot(user) });
  }

  throw new ApiError(404, "NOT_FOUND", "接口不存在。");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

async function serveStatic(req, res, pathname) {
  if (!existsSync(DIST_ROOT)) return false;
  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(DIST_ROOT, safePath);
  if (!filePath.startsWith(DIST_ROOT)) return false;
  if (!existsSync(filePath)) filePath = join(DIST_ROOT, "index.html");
  try {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream" });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  setCors(req, res);
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${HOST}:${PORT}`}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    if (req.method === "GET" && await serveStatic(req, res, url.pathname)) return;
    fail(res, 404, "NOT_FOUND", "资源不存在。");
  } catch (error) {
    if (error instanceof ApiError) {
      fail(res, error.status, error.code, error.message);
      return;
    }
    console.error(error);
    fail(res, 500, "INTERNAL_ERROR", "服务器内部错误。");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Tonglu API listening on http://${HOST}:${PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
});
