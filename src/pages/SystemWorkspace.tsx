import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  HardDrive,
  LockKeyhole,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Callout,
  Modal,
  OverviewBoard,
  PageHeader,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "../components/Ui";
import { useApp } from "../store";
import type { Role } from "../types";
import { formatDateTime } from "../utils";

type SystemModule = "today" | "data" | "audit";

const roleNames: Array<{ value: Role; label: string }> = [
  { value: "student", label: "学生" },
  { value: "mentor", label: "导师" },
  { value: "interviewer", label: "面试官" },
  { value: "lab_manager", label: "实验室负责人" },
  { value: "college_admin", label: "学院管理员" },
  { value: "college_leader", label: "学院负责人" },
  { value: "sys_admin", label: "系统管理员" },
];

function roleLabel(role: Role) {
  return roleNames.find((item) => item.value === role)?.label ?? role;
}

export function SystemOverview() {
  const { state } = useApp();
  const [active, setActive] = useState<SystemModule>("today");
  const stats = state.dbStats;
  const activeUsers = state.users?.filter((user) => user.active).length ?? 0;
  const modules: Array<{ id: SystemModule; label: string; hint: string; icon: ReactNode }> = [
    { id: "today", label: "今日概览", hint: stats ? "数据库已连接" : "等待快照", icon: <Sparkles aria-hidden="true" /> },
    { id: "data", label: "账号与数据库", hint: `${stats?.users ?? state.users?.length ?? 0} 个账号`, icon: <Database aria-hidden="true" /> },
    { id: "audit", label: "审计", hint: `${stats?.auditEvents ?? state.audit.length} 条事件`, icon: <ScrollText aria-hidden="true" /> },
  ];

  return (
    <div className="role-portal">
      <OverviewBoard items={modules} active={active} onChange={setActive} ariaLabel="系统管理员工作台模块">
        {active === "today" && (
          <>
            <section className="mentor-banner">
              <div className="mentor-banner-main">
                <span className="mentor-avatar mentor-avatar--large">系</span>
                <div>
                  <span className="eyebrow">系统管理台 · SQLite</span>
                  <h2>先看系统是否健康，再改权限。</h2>
                  <p>账号、角色、数据库状态与审计。业务评价、名额和公示不在此处直接改写。</p>
                </div>
              </div>
              <div className="mentor-banner-actions">
                <Link to="/system/users" className="btn btn-primary">账号与角色 <ArrowRight aria-hidden="true" /></Link>
                <Link to="/system/database" className="btn btn-secondary">数据库状态</Link>
              </div>
            </section>

            <Callout tone="success" title="后端数据库在线">
              当前会话通过 Bearer Token 鉴权。账号密码使用 scrypt 哈希，业务写操作在事务内完成。
            </Callout>

            <section className="stats-grid stats-grid--four">
              <StatCard label="账号总数" value={stats?.users ?? state.users?.length ?? 0} hint={`${activeUsers} 个启用`} icon={<Users aria-hidden="true" />} tone="sky" />
              <StatCard label="活跃会话" value={stats?.activeSessions ?? "—"} hint="12 小时自动过期" icon={<Activity aria-hidden="true" />} tone="sage" />
              <StatCard label="审计事件" value={stats?.auditEvents ?? state.audit.length} hint="只追加，不覆盖" icon={<ScrollText aria-hidden="true" />} tone="coral" />
              <StatCard label="业务记录" value={(stats?.offers ?? 0) + (stats?.candidates ?? 0)} hint={`${stats?.offers ?? 0} 拟录取 · ${stats?.candidates ?? 0} 候选人`} icon={<Database aria-hidden="true" />} tone="leaf" />
            </section>
          </>
        )}

        {active === "data" && (
          <>
            <SectionTitle
              title="账号与数据库"
              description="账号权限与数据库状态分别管理，均写入审计。"
              action={<Link to="/system/database" className="text-link">数据库详情 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="overview-two-col">
              <div className="panel-card role-panel">
                <div className="db-path"><Database aria-hidden="true" /><code>{stats?.path ?? "data/tonglu.db"}</code></div>
                <dl className="role-facts">
                  <div><dt>引擎</dt><dd>SQLite · WAL</dd></div>
                  <div><dt>事务</dt><dd>BEGIN IMMEDIATE</dd></div>
                  <div><dt>密码</dt><dd>scrypt 哈希</dd></div>
                  <div><dt>会话</dt><dd>Bearer · 12 小时</dd></div>
                </dl>
              </div>
              <div className="stack-24">
                <div className="action-card-list">
                  <Link to="/system/users" className="action-card">
                    <span><Users aria-hidden="true" /></span>
                    <div><strong>账号与角色</strong><small>{stats?.users ?? state.users?.length ?? 0} 个账号</small></div>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/system/database" className="action-card">
                    <span><HardDrive aria-hidden="true" /></span>
                    <div><strong>数据库状态</strong><small>文件、计数与恢复</small></div>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
                <div className="soft-note">
                  <ShieldCheck aria-hidden="true" />
                  <span>角色权限按最小范围授予，敏感操作写入审计。</span>
                </div>
              </div>
            </div>
          </>
        )}

        {active === "audit" && (
          <>
            <SectionTitle
              title="全局审计"
              description="系统级审计只读，事件只追加，不覆盖。"
              action={<Link to="/system/audit" className="text-link">全部日志 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="panel-card role-panel">
              <div className="audit-preview audit-preview--compact">
                {state.audit.slice(0, 5).map((event) => (
                  <div key={event.id}>
                    <span className="audit-dot" aria-hidden="true" />
                    <div><strong>{event.action}</strong><p>{event.actor} · {event.object}</p></div>
                    <small>{formatDateTime(event.at)}</small>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </OverviewBoard>
    </div>
  );
}

export function SystemUsers() {
  const { state, updateUserAccess } = useApp();
  const users = state.users ?? [];

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow="账号角色 · 系统管理员"
        title="权限变更要可审计。"
        description="角色变更立即生效。停用账号会删除其所有会话；系统不能停用自己或最后一个管理员。"
        actions={<StatusBadge tone="sage">{users.length} 个账号</StatusBadge>}
      />

      <div className="table-card">
        <table className="data-table account-table">
          <thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>关联</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {users.map((user) => {
              const self = user.id === state.currentUser?.id;
              return (
                <tr key={user.id} className={!user.active ? "is-muted" : undefined}>
                  <td><strong>{user.account}</strong><small className="cell-sub">{user.id}</small></td>
                  <td>{user.name}{self && <small className="cell-sub">当前登录</small>}</td>
                  <td>
                    <select
                      className="table-select"
                      value={user.role}
                      disabled={self}
                      onChange={(event) => void updateUserAccess(user.id, { role: event.target.value as Role })}
                    >
                      {roleNames.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </td>
                  <td>{user.studentNo ? `学号 ${user.studentNo}` : user.unitId ? `实训室 ${user.unitId}` : "学院 / 全局"}</td>
                  <td><StatusBadge tone={user.active ? "sage" : "neutral"}>{user.active ? "启用" : "停用"}</StatusBadge></td>
                  <td>
                    <button
                      type="button"
                      className={user.active ? "btn btn-secondary btn-small" : "btn btn-primary btn-small"}
                      disabled={self}
                      onClick={() => void updateUserAccess(user.id, { active: !user.active })}
                    >
                      {user.active ? "停用" : "启用"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Callout tone="info" title="演示账号统一密码为 demo123">
        七个账号分别对应七种角色。前端切换角色时会自动建立该账号的新会话。
      </Callout>
    </div>
  );
}

export function SystemDatabase() {
  const { state, resetDemo } = useApp();
  const stats = state.dbStats;
  const tables = [
    "users", "sessions", "cycle", "units", "applications", "application_drafts",
    "offers", "interviews", "candidates", "adjustments", "supplements", "appeals",
    "publications", "audit_logs",
  ];

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow="数据库 · 运行时状态"
        title="数据库在跑，数据在写。"
        description="本页展示真实 SQLite 文件与业务表。恢复操作只重置业务数据，保留账号与当前会话。"
        actions={<StatusBadge tone={stats ? "sage" : "coral"}>{stats ? "在线" : "未连接"}</StatusBadge>}
      />

      <section className="stats-grid stats-grid--four">
        <StatCard label="账号" value={stats?.users ?? "—"} hint="users 表" icon={<Users aria-hidden="true" />} tone="sky" />
        <StatCard label="活跃会话" value={stats?.activeSessions ?? "—"} hint="sessions 表" icon={<LockKeyhole aria-hidden="true" />} tone="sage" />
        <StatCard label="候选人" value={stats?.candidates ?? "—"} hint="candidates 表" icon={<ShieldCheck aria-hidden="true" />} tone="coral" />
        <StatCard label="拟录取" value={stats?.offers ?? "—"} hint="offers 表" icon={<Database aria-hidden="true" />} tone="leaf" />
      </section>

      <section className="role-split role-split--wide-left">
        <div className="panel-card role-panel">
          <SectionTitle title="持久化文件" description="WAL 模式，支持并发读与事务写。" />
          <div className="db-path db-path--large"><HardDrive aria-hidden="true" /><code>{stats?.path ?? "data/tonglu.db"}</code></div>
          <div className="table-chip-grid">
            {tables.map((table) => <span key={table}>{table}</span>)}
          </div>
          <Callout tone="warning" title="恢复演示数据">
            会重置申请、拟录取、评分、调剂、公示和异议，保留全部账号与会话。重置动作会追加审计记录。
          </Callout>
        </div>
        <aside className="panel-card role-panel">
          <SectionTitle title="危险操作" description="仅系统管理员可执行。" />
          <div className="danger-zone">
            <TriangleAlert aria-hidden="true" />
            <strong>恢复业务初始状态</strong>
            <p>适用于演示重跑。执行后无法从页面撤回。</p>
            <ResetButton onReset={resetDemo} />
          </div>
        </aside>
      </section>
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}><RefreshCw aria-hidden="true" /> 恢复演示数据</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="确认恢复业务数据？"
        description="账号、密码和当前会话保留。"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>取消</button>
            <button type="button" className="btn btn-danger" onClick={async () => { await onReset(); setOpen(false); }}>确认恢复</button>
          </>
        }
      >
        <p className="modal-copy">所有业务记录恢复到种子数据。系统会写入一条恢复审计日志。</p>
      </Modal>
    </>
  );
}

export function SystemAudit() {
  const { state } = useApp();

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow="审计日志 · 全局"
        title="发生过的事，不靠记忆。"
        description="审计日志只追加。权限变更、阶段切换、业务写入与数据恢复均有记录。"
        actions={<StatusBadge tone="sage">{state.audit.length} 条</StatusBadge>}
      />

      <div className="table-card">
        <table className="data-table audit-table">
          <thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>详情</th></tr></thead>
          <tbody>
            {state.audit.map((event) => (
              <tr key={event.id}>
                <td className="nowrap">{formatDateTime(event.at)}</td>
                <td>{event.actor}</td>
                <td><strong>{event.action}</strong></td>
                <td>{event.object}</td>
                <td>{event.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
