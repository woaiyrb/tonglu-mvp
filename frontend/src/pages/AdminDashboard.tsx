import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  Gauge,
  ListChecks,
  Megaphone,
  ScrollText,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Callout, OverviewBoard, ProgressBar, SectionTitle, StageFunctionStrip, StatCard, StatusBadge } from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { getStageGuide } from "../stageGuidance";
import { useApp } from "../store";
import { formatDateTime, getUnitStats } from "../utils";

type AdminModule = "today" | "quota" | "operations";

export function AdminDashboard() {
  const { state } = useApp();
  const [active, setActive] = useState<AdminModule>("today");
  const guide = getStageGuide("college_admin", state.stage);
  const units = state.units?.length ? state.units : UNITS;
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const totals = units.reduce(
    (sum, unit) => {
      const stats = getUnitStats(unit, state.offers);
      return {
        quota: sum.quota + unit.quota,
        confirmed: sum.confirmed + stats.confirmed,
        pending: sum.pending + stats.pending,
        remaining: sum.remaining + stats.remaining,
      };
    },
    { quota: 0, confirmed: 0, pending: 0, remaining: 0 },
  );
  const unscored = state.candidates.filter((candidate) => candidate.score === null).length;
  const unauthorized = state.adjustmentQueue.filter((item) => !item.authorized && item.status !== "已生成").length;
  const openAppeals = state.appeals.filter((appeal) => appeal.status === "待处理").length;
  const exceptions = [
    unscored > 0 ? `${unscored} 名学生尚未完成面试评分` : null,
    unauthorized > 0 ? `${unauthorized} 条跨实训室调剂缺少授权` : null,
    !state.confirmedOfferId ? "学生尚未确认唯一拟录取去向" : null,
    openAppeals > 0 ? `${openAppeals} 条公示异议待处理` : null,
  ].filter(Boolean) as string[];
  const modules: Array<{ id: AdminModule; label: string; hint: string; icon: ReactNode; badge?: number }> = [
    { id: "today", label: "今日概览", hint: `第 ${stage.number} 阶段`, icon: <Sparkles aria-hidden="true" /> },
    { id: "quota", label: "名额全景", hint: `剩余 ${totals.remaining} 人`, icon: <Gauge aria-hidden="true" /> },
    { id: "operations", label: "调剂与公示", hint: "异常与审计", icon: <ListChecks aria-hidden="true" />, badge: exceptions.length },
  ];

  return (
    <div className="admin-page">
      <OverviewBoard items={modules} active={active} onChange={setActive} ariaLabel="学院管理员工作台模块">
        {active === "today" && (
          <>
            <section className="mentor-banner">
              <div className="mentor-banner-main">
                <span className="mentor-avatar mentor-avatar--large">管</span>
                <div>
                  <span className="eyebrow">运营看板 · 第 {stage.number} 阶段</span>
                  <h2>{guide.headline}</h2>
                  <p>{guide.description}</p>
                </div>
              </div>
              <div className="mentor-banner-actions">
                <Link
                  to={state.stage === "supplement" ? "/admin/quota" : state.stage === "publicity" ? "/admin/publicity" : "/admin/adjustment"}
                  className="btn btn-primary"
                >
                  {state.stage === "supplement" ? "生成补录" : state.stage === "publicity" ? "发布与冻结" : "处理例外"} <ArrowRight aria-hidden="true" />
                </Link>
                <Link to={state.stage === "publicity" ? "/admin/adjustment" : "/admin/publicity"} className="btn btn-secondary">
                  {state.stage === "publicity" ? "查看调剂" : "查看公示"}
                </Link>
              </div>
            </section>

            {exceptions.length > 0 && ["supplement", "adjustment", "publicity"].includes(state.stage) ? (
              <Callout
                tone="warning"
                title={`有 ${exceptions.length} 项需要关注`}
                action={<Link to="/admin/adjustment" className="btn btn-secondary btn-small">处理异常 <ArrowRight aria-hidden="true" /></Link>}
              >
                {exceptions.join("；")}。
              </Callout>
            ) : (
              <Callout tone="info" title={`${stage.label}：${guide.focus}`}>
                {guide.nextStep}。当前阶段未开放的写操作已在下方标出。
              </Callout>
            )}

            <StageFunctionStrip available={guide.available} unavailable={guide.unavailable} />

            <section className="stats-grid stats-grid--four">
              <StatCard label="计划名额" value={totals.quota} hint={`${units.length} 个实训室`} icon={<Users aria-hidden="true" />} tone="sky" />
              <StatCard label="已确认" value={totals.confirmed} hint={`待确认 ${totals.pending} 人`} icon={<ClipboardList aria-hidden="true" />} tone="sage" />
              <StatCard label="剩余名额" value={totals.remaining} hint={`总体使用率 ${Math.round(((totals.confirmed + totals.pending) / Math.max(1, totals.quota)) * 100)}%`} icon={<Gauge aria-hidden="true" />} tone="coral" />
              <StatCard label="待办异常" value={exceptions.length} hint="评分、授权、公示" icon={<TriangleAlert aria-hidden="true" />} tone="leaf" />
            </section>
          </>
        )}

        {active === "quota" && (
          <>
            <SectionTitle
              title="实训室名额全景"
              description="已确认与待确认同时占用名额；失效拟录取会释放名额。"
              action={<Link to="/admin/quota" className="text-link">管理名额 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="table-card">
              <table className="data-table compact-table">
                <thead><tr><th>实训室</th><th>计划</th><th>已确认</th><th>待确认</th><th>剩余</th><th>使用率</th></tr></thead>
                <tbody>
                  {units.map((unit) => {
                    const stats = getUnitStats(unit, state.offers);
                    return (
                      <tr key={unit.id}>
                        <td><strong>{unit.name}</strong><small className="cell-sub">{unit.code} · {unit.mentor}</small></td>
                        <td>{unit.quota}</td>
                        <td>{stats.confirmed}</td>
                        <td>{stats.pending}</td>
                        <td><span className={stats.remaining === 0 ? "value-alert" : "value-good"}>{stats.remaining}</span></td>
                        <td>
                          <div className="inline-progress">
                            <ProgressBar value={stats.fillRate} tone={stats.remaining === 0 ? "coral" : "sage"} label={`${unit.name}使用率`} />
                            <span>{stats.fillRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {active === "operations" && (
          <>
            <SectionTitle title="调剂、公示与审计" description="建议按顺序完成，异常优先。" />
            <div className="overview-two-col overview-two-col--sidebar">
              <div className="stack-24">
                <div className="action-card-list">
                  <Link to="/admin/adjustment" className="action-card">
                    <span><ListChecks aria-hidden="true" /></span>
                    <div><strong>处理调剂队列</strong><small>{state.adjustmentQueue.filter((item) => item.status === "待处理").length} 条待处理</small></div>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/admin/publicity" className="action-card">
                    <span><Megaphone aria-hidden="true" /></span>
                    <div><strong>生成公示名单</strong><small>{state.published ? "已生成，可查看" : "等待确认与校验"}</small></div>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/admin/audit" className="action-card">
                    <span><ScrollText aria-hidden="true" /></span>
                    <div><strong>查看审计日志</strong><small>{state.audit.length} 条追加记录</small></div>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
                <div className="soft-note">
                  <CircleAlert aria-hidden="true" />
                  <span>公示前必须确认学生唯一去向。多人重复入围但未确认时，不允许生成正式名单。</span>
                </div>
              </div>
              <div className="panel-card role-panel">
                <SectionTitle title="最近操作" description="审计只追加，不覆盖。" action={<Link to="/admin/audit" className="text-link">全部日志</Link>} />
                <div className="audit-preview audit-preview--compact">
                  {state.audit.slice(0, 3).map((event) => (
                    <div key={event.id}>
                      <span className="audit-dot" aria-hidden="true" />
                      <div><strong>{event.action}</strong><p>{event.actor} · {event.object}</p></div>
                      <small>{formatDateTime(event.at)}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </OverviewBoard>
    </div>
  );
}
