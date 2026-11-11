import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  LockKeyhole,
  Megaphone,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Callout,
  OverviewBoard,
  PageHeader,
  SectionTitle,
  StageFunctionStrip,
  StatCard,
  StatusBadge,
} from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { getStageGuide } from "../stageGuidance";
import { useApp } from "../store";
import { cn, formatDateTime, getUnitStats } from "../utils";

type LeaderModule = "today" | "exceptions" | "publicity";

function useLeaderData() {
  const { state } = useApp();
  const units = state.units?.length ? state.units : UNITS;
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const unauthorized = state.adjustmentQueue.filter((item) => !item.authorized && item.status !== "已生成").length;
  const pendingAdjustments = state.adjustmentQueue.filter((item) => item.status === "待处理").length;
  const openAppeals = state.appeals.filter((appeal) => appeal.status === "待处理").length;
  const totals = units.reduce((sum, unit) => {
    const stats = getUnitStats(unit, state.offers);
    return { quota: sum.quota + unit.quota, confirmed: sum.confirmed + stats.confirmed, pending: sum.pending + stats.pending, remaining: sum.remaining + stats.remaining };
  }, { quota: 0, confirmed: 0, pending: 0, remaining: 0 });
  return { state, units, stage, unauthorized, pendingAdjustments, openAppeals, totals };
}

export function LeaderOverview() {
  const { state, stage, unauthorized, pendingAdjustments, openAppeals, totals } = useLeaderData();
  const [active, setActive] = useState<LeaderModule>("today");
  const guide = getStageGuide("college_leader", state.stage);
  const exceptions = unauthorized + openAppeals + (state.published ? 0 : 1);
  const checks = [
    { label: "学生已确认唯一去向", ok: Boolean(state.confirmedOfferId), detail: state.finalUnitId ? `最终方向 ${state.finalUnitId}` : "等待学生确认" },
    { label: "导师候选名单已提交", ok: state.candidateListSubmitted, detail: state.candidateListSubmitted ? "名单已锁定" : "尚未提交" },
    { label: "未授权调剂全部处理", ok: unauthorized === 0, detail: unauthorized ? `仍有 ${unauthorized} 条待审批` : "已全部处理" },
    { label: "公示名单已生成", ok: state.published, detail: state.published ? formatDateTime(state.publishedAt) : "等待学院管理员发布" },
    { label: "公示异议已办结", ok: openAppeals === 0, detail: openAppeals ? `${openAppeals} 条待办结` : "无待处理异议" },
  ];
  const blockers = checks.filter((check) => !check.ok).length;
  const modules: Array<{ id: LeaderModule; label: string; hint: string; icon: ReactNode; badge?: number }> = [
    { id: "today", label: "今日概览", hint: `第 ${stage.number} 阶段`, icon: <Sparkles aria-hidden="true" /> },
    { id: "exceptions", label: "异常与调剂", hint: `${unauthorized} 条待审批`, icon: <ShieldAlert aria-hidden="true" />, badge: unauthorized },
    { id: "publicity", label: "公示终审", hint: state.frozenAt ? "名单已冻结" : state.published ? "公示中" : "未发布", icon: <Megaphone aria-hidden="true" /> },
  ];

  return (
    <div className="role-portal">
      <OverviewBoard items={modules} active={active} onChange={setActive} ariaLabel="学院负责人工作台模块">
        {active === "today" && (
          <>
            <section className="mentor-banner">
              <div className="mentor-banner-main">
                <span className="mentor-avatar mentor-avatar--large">院</span>
                <div>
                  <span className="eyebrow">学院负责人工作台 · 第 {stage.number} 阶段</span>
                  <h2>{guide.headline}</h2>
                  <p>{guide.description}</p>
                </div>
              </div>
              <div className="mentor-banner-actions">
                <Link to={state.stage === "publicity" ? "/leader/publicity" : "/leader/exceptions"} className="btn btn-primary">
                  {state.stage === "adjustment" ? "审批未授权调剂" : state.stage === "publicity" ? "公示终审" : "查看异常"} <ArrowRight aria-hidden="true" />
                </Link>
                <Link to={state.stage === "publicity" ? "/leader/exceptions" : "/leader/publicity"} className="btn btn-secondary">
                  {state.stage === "publicity" ? "查看调剂" : "查看公示状态"}
                </Link>
              </div>
            </section>

            <Callout
              tone={exceptions ? "warning" : "success"}
              title={exceptions ? `${stage.label}：仍有 ${exceptions} 项需要关注` : `${stage.label}：当前没有待处理例外`}
              action={<Link to="/leader/exceptions" className="btn btn-secondary btn-small">查看异常 <ArrowRight aria-hidden="true" /></Link>}
            >
              {guide.nextStep}。{unauthorized ? `${unauthorized} 条未授权调剂待审批；` : ""}
              {openAppeals ? `${openAppeals} 条公示异议待办结；` : ""}
              {!state.published ? "公示名单尚未生成。" : "公示 V1 已生成。"}
            </Callout>

            <StageFunctionStrip available={guide.available} unavailable={guide.unavailable} />

            <section className="stats-grid stats-grid--four">
              <StatCard label="计划名额" value={totals.quota} hint={`${totals.confirmed + totals.pending} 人已占用`} icon={<Users aria-hidden="true" />} tone="sky" />
              <StatCard label="异常调剂" value={unauthorized} hint={`${pendingAdjustments} 条调剂待处理`} icon={<ShieldAlert aria-hidden="true" />} tone="coral" />
              <StatCard label="公示异议" value={openAppeals} hint={state.published ? "公示已生成" : "尚未公示"} icon={<MessageSquareWarning aria-hidden="true" />} tone="leaf" />
              <StatCard label="正式名单" value={state.frozenAt ? "已冻结" : state.published ? "公示中" : "未生成"} hint={state.frozenAt ? formatDateTime(state.frozenAt) : "等待学院管理员发布"} icon={<Megaphone aria-hidden="true" />} tone="sage" />
            </section>
          </>
        )}

        {active === "exceptions" && (
          <>
            <SectionTitle
              title="异常与调剂审批"
              description="只处理未授权例外；已授权调剂由学院管理员确认。审批写入审计日志。"
              action={<Link to="/leader/exceptions" className="text-link">审批队列 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="table-card">
              <table className="data-table compact-table">
                <thead><tr><th>优先级</th><th>学生</th><th>调剂路径</th><th>授权</th><th>状态</th></tr></thead>
                <tbody>
                  {state.adjustmentQueue.slice(0, 4).map((item) => (
                    <tr key={item.id}>
                      <td><span className={cn("priority-badge", `priority-badge--${item.priority}`)}>P{item.priority}</span></td>
                      <td><strong>{item.studentName}</strong><small className="cell-sub">{item.studentNo}</small></td>
                      <td><span className="adjustment-route-cell"><span>{item.source}</span><ArrowRight aria-hidden="true" /><strong>{item.target}</strong></span></td>
                      <td><StatusBadge tone={item.authorized ? "sage" : "coral"} dot={false}>{item.authorized ? "已授权" : "需审批"}</StatusBadge></td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {active === "publicity" && (
          <>
            <SectionTitle
              title="公示终审"
              description={`${checks.length - blockers} / ${checks.length} 项校验通过。`}
              action={<Link to="/leader/publicity" className="text-link">进入终审 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="overview-two-col overview-two-col--sidebar">
              <div className="panel-card role-panel">
                <div className="checklist-card checklist-card--flat">
                  {checks.map((check) => (
                    <div className={cn("checklist-row", check.ok ? "is-ok" : "is-blocked")} key={check.label}>
                      <span>{check.ok ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}</span>
                      <div><strong>{check.label}</strong><small>{check.detail}</small></div>
                      <StatusBadge tone={check.ok ? "sage" : "coral"} dot={false}>{check.ok ? "通过" : "未通过"}</StatusBadge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="stack-24">
                <div className="quota-card">
                  <div className="quota-card-head">
                    <div><span>全局名额</span><strong>{totals.remaining}</strong></div>
                    <span className="quota-fraction">{totals.confirmed + totals.pending} / {totals.quota}</span>
                  </div>
                  <dl className="quota-breakdown">
                    <div><dt>已确认</dt><dd>{totals.confirmed}</dd></div>
                    <div><dt>待确认</dt><dd>{totals.pending}</dd></div>
                    <div><dt>计划</dt><dd>{totals.quota}</dd></div>
                  </dl>
                </div>
                <div className="soft-note">
                  <LockKeyhole aria-hidden="true" />
                  <span>职责边界：不代导师评分，不代管理员发布。</span>
                </div>
              </div>
            </div>
          </>
        )}
      </OverviewBoard>
    </div>
  );
}

export function LeaderExceptions() {
  const { state, stage, unauthorized, pendingAdjustments } = useLeaderData();
  const { approveAdjustment } = useApp();
  const frozen = Boolean(state.frozenAt);
  const stageOpen = state.stage === "adjustment" || state.stage === "publicity";
  const sorted = [...state.adjustmentQueue].sort((a, b) => a.priority - b.priority);

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow={<>异常审批 · 第 {stage.number} 阶段</>}
        title="未获授权的调剂，必须有人签字。"
        description="学院负责人只处理未授权例外；已授权调剂由学院管理员确认。所有审批写入审计日志。"
        actions={<StatusBadge tone={unauthorized ? "coral" : "sage"}>{unauthorized} 条待审批</StatusBadge>}
      />

      {!stageOpen && (
        <Callout tone="warning" title="当前阶段不允许调剂审批">
          切换到第 7 阶段“统筹调剂”或第 8 阶段“公示与入组”后，审批按钮才可用。
        </Callout>
      )}

      <section className="stats-grid stats-grid--three">
        <StatCard label="待处理调剂" value={pendingAdjustments} hint="三级匹配队列" icon={<SlidersHorizontal aria-hidden="true" />} tone="sky" />
        <StatCard label="需负责人审批" value={unauthorized} hint="未授权跨实训室" icon={<ShieldAlert aria-hidden="true" />} tone="coral" />
        <StatCard label="已生成记录" value={state.adjustmentQueue.filter((item) => item.status === "已生成").length} hint="不可重复提交" icon={<CheckCircle2 aria-hidden="true" />} tone="sage" />
      </section>

      <div className="table-card">
        <table className="data-table leader-adjust-table">
          <thead><tr><th>优先级</th><th>学生</th><th>调剂路径</th><th>授权</th><th>处理</th></tr></thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.id}>
                <td><span className={cn("priority-badge", `priority-badge--${item.priority}`)}>P{item.priority}</span></td>
                <td><strong>{item.studentName}</strong><small className="cell-sub">{item.studentNo}</small></td>
                <td><span className="adjustment-route-cell"><span>{item.source}</span><ArrowRight aria-hidden="true" /><strong>{item.target}</strong></span><small className="cell-sub">{item.note}</small></td>
                <td><StatusBadge tone={item.authorized ? "sage" : "coral"} dot={false}>{item.authorized ? "已授权" : "需审批"}</StatusBadge></td>
                <td>
                  {item.status === "已生成" ? (
                    <span className="generated-label"><CheckCircle2 aria-hidden="true" /> 已生成</span>
                  ) : item.authorized ? (
                    <span className="muted-copy">由学院管理员处理</span>
                  ) : (
                    <button type="button" className="btn btn-primary btn-small" disabled={!stageOpen || frozen} onClick={() => void approveAdjustment(item.id)}>
                      {frozen ? <><LockKeyhole aria-hidden="true" /> 已冻结</> : "审批并生成"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LeaderPublicity() {
  const { state, stage, unauthorized, pendingAdjustments, openAppeals } = useLeaderData();
  const { freezeResults, resolveAppeal } = useApp();
  const frozen = Boolean(state.frozenAt);
  const checks = [
    { label: "学生已确认唯一去向", ok: Boolean(state.confirmedOfferId), detail: state.finalUnitId ? `最终方向 ${state.finalUnitId}` : "等待学生确认" },
    { label: "导师候选名单已提交", ok: state.candidateListSubmitted, detail: state.candidateListSubmitted ? "名单已锁定" : "尚未提交" },
    { label: "未授权调剂全部处理", ok: unauthorized === 0, detail: unauthorized ? `仍有 ${unauthorized} 条待审批` : "已全部处理" },
    { label: "公示名单已生成", ok: state.published, detail: state.published ? formatDateTime(state.publishedAt) : "等待学院管理员发布" },
    { label: "公示异议已办结", ok: openAppeals === 0, detail: openAppeals ? `${openAppeals} 条待办结` : "无待处理异议" },
  ];
  const blockers = checks.filter((check) => !check.ok).length;

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow={<>公示终审 · 第 {stage.number} 阶段</>}
        title="最后一按，必须建立在完整校验上。"
        description="学院负责人可办结异议并冻结正式名单。公示快照的生成仍由学院管理员执行。"
        actions={<StatusBadge tone={frozen ? "neutral" : state.published ? "sage" : "coral"}>{frozen ? "已冻结" : state.published ? "公示中" : "未发布"}</StatusBadge>}
      />

      {frozen && (
        <Callout tone="info" title="正式名单已冻结">
          冻结时间 {formatDateTime(state.frozenAt)}。业务写入已关闭，后续更正必须走专门流程。
        </Callout>
      )}

      <section className="role-split role-split--wide-left">
        <div className="panel-card role-panel">
          <SectionTitle title="终审校验" description={`${checks.length - blockers} / ${checks.length} 项通过。`} />
          <div className="checklist-card checklist-card--flat">
            {checks.map((check) => (
              <div className={cn("checklist-row", check.ok ? "is-ok" : "is-blocked")} key={check.label}>
                <span>{check.ok ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}</span>
                <div><strong>{check.label}</strong><small>{check.detail}</small></div>
                <StatusBadge tone={check.ok ? "sage" : "coral"} dot={false}>{check.ok ? "通过" : "未通过"}</StatusBadge>
              </div>
            ))}
          </div>
          <div className="publish-actions">
            <div><strong>{frozen ? "正式名单已冻结" : "冻结正式名单"}</strong><p>{pendingAdjustments ? `调剂队列仍有 ${pendingAdjustments} 条待处理。` : "冻结后进入只读状态。"}</p></div>
            <button type="button" className="btn btn-primary" disabled={!state.published || frozen || unauthorized > 0} onClick={() => void freezeResults()}>
              {frozen ? <><LockKeyhole aria-hidden="true" /> 已冻结</> : <><ShieldCheck aria-hidden="true" /> 冻结正式名单</>}
            </button>
          </div>
        </div>

        <aside className="panel-card role-panel">
          <SectionTitle title="公示异议" description="逐条核对并办结。" />
          {state.appeals.length === 0 ? (
            <div className="empty-mini"><MessageSquareWarning aria-hidden="true" /><strong>暂无异议</strong><p>学生提交后会出现在这里。</p></div>
          ) : (
            <div className="appeal-queue">
              {state.appeals.map((appeal) => (
                <article key={appeal.id}>
                  <div><StatusBadge tone={appeal.status === "已办结" ? "sage" : "coral"}>{appeal.status}</StatusBadge><small>{formatDateTime(appeal.createdAt)}</small></div>
                  <strong>{appeal.studentName}</strong>
                  <p>{appeal.content}</p>
                  {appeal.status === "待处理" && <button type="button" className="btn btn-secondary btn-small" onClick={() => void resolveAppeal(appeal.id)}>办结异议</button>}
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
