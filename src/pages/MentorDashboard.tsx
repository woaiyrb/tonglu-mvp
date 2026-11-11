import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Gauge,
  Sparkles,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Callout, OverviewBoard, ProgressBar, SectionTitle, StatCard, StatusBadge } from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { useApp } from "../store";
import { getUnitStats, scoreTone } from "../utils";

type MentorModule = "today" | "queue" | "quota";

export function MentorDashboard() {
  const { state } = useApp();
  const [active, setActive] = useState<MentorModule>("today");
  const unit = UNITS[0];
  const stats = getUnitStats(unit, state.offers);
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const scored = state.candidates.filter((candidate) => candidate.score !== null).length;
  const unscored = state.candidates.length - scored;
  const offers = state.candidates.filter((candidate) => candidate.decision === "offer").length;
  const waitlist = state.candidates.filter((candidate) => candidate.decision === "waitlist").length;
  const done = state.candidates.length - unscored;

  const modules: Array<{ id: MentorModule; label: string; hint: string; icon: ReactNode }> = [
    { id: "today", label: "今日概览", hint: `第 ${stage.number} 阶段`, icon: <Sparkles aria-hidden="true" /> },
    { id: "queue", label: "面试队列", hint: `${state.candidates.length} 名候选人`, icon: <Users aria-hidden="true" /> },
    { id: "quota", label: "名额与名单", hint: `计划 ${unit.quota} 人`, icon: <Gauge aria-hidden="true" /> },
  ];

  return (
    <div className="mentor-page">
      <OverviewBoard items={modules} active={active} onChange={setActive} ariaLabel="导师工作台模块">
        {active === "today" && (
          <>
            <section className="mentor-banner">
              <div className="mentor-banner-main">
                <span className="mentor-avatar mentor-avatar--large">周</span>
                <div>
                  <span className="eyebrow">智能交互实验室 · {unit.code}</span>
                  <h2>早上好，周老师。</h2>
                  <p>{unit.direction} · 本轮 {state.candidates.length} 名学生进入面试。</p>
                </div>
              </div>
              <div className="mentor-banner-actions">
                <Link to="/mentor/interviews" className="btn btn-primary">
                  继续面试评分 <ArrowRight aria-hidden="true" />
                </Link>
                <Link to="/mentor/candidates" className="btn btn-secondary">查看候选名单</Link>
              </div>
            </section>

            {unscored > 0 ? (
              <Callout
                tone="warning"
                title={`还有 ${unscored} 名学生未完成评分`}
                action={<Link to="/mentor/interviews" className="btn btn-secondary btn-small">去评分</Link>}
              >
                候选名单提交前必须完成全部评分与评语，避免只凭印象排序。
              </Callout>
            ) : (
              <Callout tone="success" title="本轮评分已全部完成">
                可以核对候选结论并形成名单。
              </Callout>
            )}

            <section className="stats-grid">
              <StatCard label="进入面试" value={state.candidates.length} hint="本轮有效报名" icon={<Users aria-hidden="true" />} tone="sky" />
              <StatCard label="已完成评分" value={`${scored}/${state.candidates.length}`} hint={`${done} 场记录已归档`} icon={<CalendarCheck2 aria-hidden="true" />} tone="sage" />
              <StatCard label="拟录取" value={offers} hint={`候补 ${waitlist} 人`} icon={<ClipboardCheck aria-hidden="true" />} tone="coral" />
              <StatCard label="计划名额" value={unit.quota} hint={`已确认 ${stats.confirmed} · 待确认 ${stats.pending}`} icon={<Gauge aria-hidden="true" />} tone="leaf" />
            </section>
          </>
        )}

        {active === "queue" && (
          <>
            <SectionTitle
              title="本轮面试队列"
              description="评分完成后再做录取、候补或淘汰结论。"
              action={<Link to="/mentor/interviews" className="text-link">全部面试 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="table-card">
              <table className="data-table compact-table">
                <thead>
                  <tr><th>学生</th><th>时间</th><th>评分</th><th>结论</th></tr>
                </thead>
                <tbody>
                  {state.candidates.slice(0, 5).map((candidate) => (
                    <tr key={candidate.id}>
                      <td><strong>{candidate.name}</strong><small className="cell-sub">{candidate.major}</small></td>
                      <td>{candidate.interviewAt}</td>
                      <td><span className={`score-text score-text--${scoreTone(candidate.score)}`}>{candidate.score ?? "未评分"}</span></td>
                      <td>
                        <StatusBadge tone={candidate.decision === "offer" ? "sage" : candidate.decision === "waitlist" ? "sky" : candidate.decision === "reject" ? "neutral" : "coral"} dot={false}>
                          {candidate.decision === "offer" ? "拟录取" : candidate.decision === "waitlist" ? "候补" : candidate.decision === "reject" ? "未录取" : "待定"}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {active === "quota" && (
          <>
            <SectionTitle title="名额与名单" description="提交候选名单前请核对名额与完成项。" />
            <div className="overview-two-col overview-two-col--sidebar">
              <div className="quota-card">
                <div className="quota-card-head">
                  <div><span>剩余名额</span><strong>{stats.remaining}</strong></div>
                  <span className="quota-fraction">{stats.confirmed + stats.pending} / {unit.quota}</span>
                </div>
                <ProgressBar value={stats.fillRate} tone="sage" label="智能交互实验室名额使用率" />
                <dl className="quota-breakdown">
                  <div><dt>已确认</dt><dd>{stats.confirmed}</dd></div>
                  <div><dt>待确认</dt><dd>{stats.pending}</dd></div>
                  <div><dt>计划</dt><dd>{unit.quota}</dd></div>
                </dl>
              </div>
              <div className="stack-24">
                <div className="task-list">
                  <div className={scored === state.candidates.length ? "is-done" : ""}>
                    <CheckCircle2 aria-hidden="true" />
                    <span><strong>完成全部评分</strong><small>{scored} / {state.candidates.length}</small></span>
                  </div>
                  <div className={state.candidateListSubmitted ? "is-done" : ""}>
                    <CheckCircle2 aria-hidden="true" />
                    <span><strong>形成候选名单</strong><small>{state.candidateListSubmitted ? "已提交" : "待提交"}</small></span>
                  </div>
                  <div className={state.published ? "is-done" : ""}>
                    <CheckCircle2 aria-hidden="true" />
                    <span><strong>等待学院公示</strong><small>{state.published ? "已公示" : "待管理端处理"}</small></span>
                  </div>
                </div>
                <div className="soft-note">
                  <Clock3 aria-hidden="true" />
                  <span>名单提交后锁定。若学院退回，修改会生成新版本并保留退回原因。</span>
                </div>
              </div>
            </div>
            <section className="mentor-tip">
              <Sparkles aria-hidden="true" />
              <div><strong>评分提示</strong><p>评语要写可核对的行为。避免只写“优秀”“一般”等无法复盘的评价。</p></div>
            </section>
          </>
        )}
      </OverviewBoard>
    </div>
  );
}
