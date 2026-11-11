import {
  Bell,
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Compass,
  Database,
  FileText,
  Gauge,
  Home,
  Info,
  ListChecks,
  Megaphone,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CYCLE, STAGES } from "../data";
import { useApp } from "../store";
import type { Role } from "../types";
import { cn } from "../utils";
import { BrandMark } from "./Brand";
import { Avatar, Modal } from "./Ui";

const navByRole: Record<
  Role,
  Array<{ to: string; label: string; icon: typeof Home; end?: boolean }>
> = {
  student: [
    { to: "/student", label: "概览", icon: Home, end: true },
    { to: "/student/units", label: "招生方向", icon: Compass },
    { to: "/student/application", label: "我的申请", icon: FileText },
    { to: "/student/status", label: "面试与结果", icon: CalendarCheck2 },
    { to: "/student/results", label: "公示名单", icon: Megaphone },
  ],
  mentor: [
    { to: "/mentor", label: "工作台", icon: Gauge, end: true },
    { to: "/mentor/interviews", label: "面试安排", icon: CalendarCheck2 },
    { to: "/mentor/candidates", label: "候选人评审", icon: ClipboardCheck },
  ],
  interviewer: [
    { to: "/interviewer", label: "面试概览", icon: Gauge, end: true },
    { to: "/interviewer/scoring", label: "评分队列", icon: Star },
    { to: "/interviewer/records", label: "面试记录", icon: ClipboardCheck },
  ],
  lab_manager: [
    { to: "/lab", label: "实验室概览", icon: Gauge, end: true },
    { to: "/lab/quota", label: "名额看板", icon: ListChecks },
    { to: "/lab/candidates", label: "候选人只读", icon: Users },
  ],
  college_admin: [
    { to: "/admin", label: "运营看板", icon: Gauge, end: true },
    { to: "/admin/quota", label: "名额与补录", icon: ListChecks },
    { to: "/admin/adjustment", label: "调剂队列", icon: SlidersHorizontal },
    { to: "/admin/publicity", label: "公示管理", icon: Megaphone },
    { to: "/admin/audit", label: "审计日志", icon: ScrollText },
  ],
  college_leader: [
    { to: "/leader", label: "学院总览", icon: Gauge, end: true },
    { to: "/leader/exceptions", label: "异常审批", icon: ShieldCheck },
    { to: "/leader/publicity", label: "公示终审", icon: Megaphone },
  ],
  sys_admin: [
    { to: "/system", label: "系统概览", icon: Gauge, end: true },
    { to: "/system/users", label: "账号角色", icon: Users },
    { to: "/system/database", label: "数据库", icon: Database },
    { to: "/system/audit", label: "审计日志", icon: ScrollText },
  ],
};

const roleLabels: Record<Role, string> = {
  student: "学生端",
  mentor: "导师端",
  interviewer: "面试官端",
  lab_manager: "实验室负责人端",
  college_admin: "学院管理员端",
  college_leader: "学院负责人端",
  sys_admin: "系统管理员端",
};

const rolePaths: Record<Role, string> = {
  student: "/student",
  mentor: "/mentor",
  interviewer: "/interviewer",
  lab_manager: "/lab",
  college_admin: "/admin",
  college_leader: "/leader",
  sys_admin: "/system",
};

const routeRoles: Record<string, Role> = {
  student: "student",
  mentor: "mentor",
  interviewer: "interviewer",
  lab: "lab_manager",
  admin: "college_admin",
  leader: "college_leader",
  system: "sys_admin",
};

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "student", label: "学生端 · 孙悦" },
  { value: "mentor", label: "导师端 · 周明远" },
  { value: "interviewer", label: "面试官端 · 陈拓" },
  { value: "lab_manager", label: "实验室负责人端 · 赵启航" },
  { value: "college_admin", label: "学院管理员端" },
  { value: "college_leader", label: "学院负责人端" },
  { value: "sys_admin", label: "系统管理员端" },
];

export function Layout() {
  const {
    state,
    toast,
    dismissToast,
    loading,
    setRole,
    setStage,
    resetDemo,
    notify,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navItems = navByRole[state.role];
  const currentStage = STAGES.find((stage) => stage.key === state.stage) ?? STAGES[0];
  const activeNav =
    navItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ) ?? navItems[0];
  const currentName = state.currentUser?.name ?? roleLabels[state.role];

  useEffect(() => {
    const routeRole = routeRoles[location.pathname.split("/")[1] ?? ""];
    if (!loading && routeRole && routeRole !== state.role && !switching) {
      void setRole(routeRole);
    }
  }, [loading, location.pathname, setRole, state.role, switching]);

  const changeRole = async (role: Role) => {
    if (role === state.role) return;
    setSwitching(true);
    const ok = await setRole(role);
    setSwitching(false);
    if (ok) navigate(rolePaths[role]);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#mainContent">
        跳到主要内容
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="brand"
            type="button"
            onClick={() => navigate(rolePaths[state.role])}
            aria-label="返回同路首页"
          >
            <BrandMark />
            <span className="brand-copy">
              <strong>同路</strong>
              <small>实训室选导师</small>
            </span>
          </button>

          <nav className="main-nav" aria-label="主导航">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => cn("nav-link", isActive && "is-active")}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="topbar-actions">
            <span className="cycle-chip" title="当前选拔周期">
              <span className="status-dot" aria-hidden="true" />
              {CYCLE.name}
            </span>
            <label className="role-switch">
              <span className="sr-only">切换演示身份</span>
              <select
                value={state.role}
                disabled={switching}
                onChange={(event) => void changeRole(event.target.value as Role)}
                aria-label="切换演示身份"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="icon-button topbar-icon"
              aria-label="通知"
              onClick={() => notify(notificationForRole(state.role), "info")}
            >
              <Bell aria-hidden="true" />
              <span className="notification-dot" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-button topbar-icon"
              aria-label="演示说明"
              onClick={() => setHelpOpen(true)}
            >
              <Info aria-hidden="true" />
            </button>
            <Avatar initials={currentName.slice(0, 1)} name={currentName} size="sm" />
          </div>
        </div>

        <div className="demo-toolbar">
          <div className="demo-toolbar-inner">
            <div className="demo-caption">
              <Sparkles aria-hidden="true" />
              <h2>{activeNav.label}</h2>
              <span className="demo-role">{roleLabels[state.role]}</span>
              <small>服务器阶段 · 可切换</small>
            </div>
            <ol className="demo-stages" aria-label="演示阶段切换">
              {STAGES.map((stage) => (
                <li key={stage.key}>
                  <button
                    type="button"
                    className={cn("demo-stage", stage.key === state.stage && "is-active")}
                    onClick={() => void setStage(stage.key)}
                    aria-current={stage.key === state.stage ? "step" : undefined}
                    title={`${stage.label}：${stage.description}`}
                  >
                    <span>{stage.number}</span>
                    {stage.short}
                  </button>
                </li>
              ))}
            </ol>
            {state.role === "sys_admin" && (
              <button
                type="button"
                className="reset-button"
                onClick={() => setResetOpen(true)}
                title="恢复业务数据"
              >
                <RotateCcw aria-hidden="true" />
                <span>重置</span>
              </button>
            )}
          </div>
          <div className="stage-context">
            <h2>第 {currentStage.number} 阶段 · {currentStage.label}</h2>
          </div>
        </div>
      </header>

      <main id="mainContent" className="page-frame" tabIndex={-1}>
        <div className="page-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div>
          <BrandMark small />
          <span>同路 · 学生实训室进组选导师系统</span>
        </div>
        <p>MVP 演示环境 · SQLite 持久化 · 所有业务写入均经服务器权限与事务校验</p>
      </footer>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="七个角色，共用一套真实业务数据"
        description="前端经 Vite 代理访问 Node API，数据写入 data/tonglu.db。"
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setHelpOpen(false)}>
            继续体验
          </button>
        }
      >
        <div className="prose-stack">
          <p>
            右上角可切换学生、导师、面试官、实验室负责人、学院管理员、学院负责人和系统管理员。每个角色使用独立账号和服务端权限。
          </p>
          <p>
            顶部“演示阶段”会写入数据库。阶段关闭后，对应写接口会拒绝请求；正式名单冻结后，业务数据只读。
          </p>
          <p>
            系统管理员的“重置”只恢复业务表，保留账号与会话。数据库位于 data/tonglu.db。
          </p>
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="恢复全部业务数据？"
        description="账号、密码和当前会话会保留。"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setResetOpen(false)}>
              保留当前数据
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                const ok = await resetDemo();
                setResetOpen(false);
                if (ok) navigate("/system");
              }}
            >
              确认重置
            </button>
          </>
        }
      >
        <p className="modal-copy">
          申请、拟录取确认、评分、调剂、公示与异议记录都会恢复初始状态。审计日志保留重置动作。
        </p>
      </Modal>

      {toast && (
        <div className={cn("toast", `toast--${toast.tone}`)} role="status" aria-live="polite">
          {toast.tone === "success" ? (
            <CheckCircle2 aria-hidden="true" />
          ) : toast.tone === "warning" || toast.tone === "danger" ? (
            <TriangleAlert aria-hidden="true" />
          ) : (
            <CircleAlert aria-hidden="true" />
          )}
          <span>{toast.message}</span>
          <button type="button" onClick={dismissToast} aria-label="关闭提示">
            <X aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function notificationForRole(role: Role): string {
  const messages: Record<Role, string> = {
    student: "你收到 2 个拟录取意向，请在截止前确认。",
    mentor: "候选人评分与名单已与数据库同步。",
    interviewer: "评分队列已加载，请完成待评分学生。",
    lab_manager: "实验室名额与候选人数据来自实时数据库。",
    college_admin: "调剂与公示校验等待处理。",
    college_leader: "存在需学院负责人审批的异常调剂。",
    sys_admin: "数据库连接正常，可查看账号与审计状态。",
  };
  return messages[role];
}
