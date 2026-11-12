import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardList,
  Database,
  Download,
  Gauge,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Callout,
  OverviewBoard,
  PageHeader,
  ProgressBar,
  ScorePill,
  SectionTitle,
  StageFunctionStrip,
  StatCard,
  StatusBadge,
} from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { getStageGuide } from "../stageGuidance";
import { useApp } from "../store";
import { downloadCsv, getUnitStats } from "../utils";

type LabModule = "today" | "quota" | "candidates";

function useLabData() {
  const { state } = useApp();
  const units = state.units?.length ? state.units : UNITS;
  const unit = units.find((item) => item.id === state.currentUser?.unitId) ?? units[0];
  const stats = getUnitStats(unit, state.offers);
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const candidates = state.candidates;
  const scored = candidates.filter((candidate) => candidate.score !== null).length;
  const offers = candidates.filter((candidate) => candidate.decision === "offer").length;
  const waitlist = candidates.filter((candidate) => candidate.decision === "waitlist").length;
  return { state, units, unit, stats, stage, candidates, scored, offers, waitlist };
}

export function LabOverview() {
  const { state, unit, stats, stage, candidates, scored, offers, waitlist } = useLabData();
  const [active, setActive] = useState<LabModule>("today");
  const guide = getStageGuide("lab_manager", state.stage);
  const modules: Array<{ id: LabModule; label: string; hint: string; icon: ReactNode }> = [
    { id: "today", label: "今日概览", hint: `第 ${stage.number} 阶段`, icon: <Sparkles aria-hidden="true" /> },
    { id: "quota", label: "名额", hint: `剩余 ${stats.remaining} 人`, icon: <Gauge aria-hidden="true" /> },
    { id: "candidates", label: "候选人", hint: `${candidates.length} 人`, icon: <Users aria-hidden="true" /> },
  ];

  return (
    <div className="role-portal">
      <OverviewBoard items={modules} active={active} onChange={setActive} ariaLabel="实验室负责人工作台模块">
        {active === "today" && (
          <>
            <section className="mentor-banner">
              <div className="mentor-banner-main">
                <span className="mentor-avatar mentor-avatar--large">实</span>
                <div>
                  <span className="eyebrow">实验室负责人工作台 · {unit.code}</span>
                  <h2>{guide.headline}</h2>
                  <p>{guide.description}</p>
                </div>
              </div>
              <div className="mentor-banner-actions">
                <Link to="/lab/quota" className="btn btn-primary">查看全部名额 <ArrowRight aria-hidden="true" /></Link>
                <Link to="/lab/candidates" className="btn btn-secondary">候选人名单</Link>
              </div>
            </section>

            <Callout tone="info" title={`${stage.label}：${guide.focus}`}>
              {guide.nextStep}。名额由学院管理员调整，评分由面试官维护，实验室负责人只读查看与导出。
            </Callout>

            <StageFunctionStrip available={guide.available} unavailable={guide.unavailable} />

            <section className="stats-grid stats-grid--four">
              <StatCard label="计划名额" value={unit.quota} hint={`${unit.name}`} icon={<Users aria-hidden="true" />} tone="sky" />
              <StatCard label="已确认 / 待确认" value={`${stats.confirmed} / ${stats.pending}`} hint={`已占 ${stats.confirmed + stats.pending} 人`} icon={<ClipboardList aria-hidden="true" />} tone="sage" />
              <StatCard label="剩余名额" value={stats.remaining} hint={`使用率 ${stats.fillRate}%`} icon={<Gauge aria-hidden="true" />} tone="coral" />
              <StatCard label="候选人" value={candidates.length} hint={`${scored} 人已评分`} icon={<BarChart3 aria-hidden="true" />} tone="leaf" />
            </section>
          </>
        )}

        {active === "quota" && (
          <>
            <SectionTitle
              title="名额总览"
              description="已确认与待确认同时占用名额；只读，不直接改写。"
              action={<Link to="/lab/quota" className="text-link">全部名额 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="overview-two-col overview-two-col--sidebar">
              <div className="quota-card">
                <div className="quota-card-head">
                  <div><span>剩余名额</span><strong>{stats.remaining}</strong></div>
                  <span className="quota-fraction">{stats.confirmed + stats.pending} / {unit.quota}</span>
                </div>
                <ProgressBar value={stats.fillRate} tone={stats.remaining === 0 ? "coral" : "sage"} label={`${unit.name}名额使用率`} />
                <dl className="quota-breakdown">
                  <div><dt>已确认</dt><dd>{stats.confirmed}</dd></div>
                  <div><dt>待确认</dt><dd>{stats.pending}</dd></div>
                  <div><dt>计划</dt><dd>{unit.quota}</dd></div>
                </dl>
              </div>
              <div className="panel-card role-panel">
                <dl className="role-facts">
                  <div><dt>实训室</dt><dd>{unit.name}</dd></div>
                  <div><dt>负责人</dt><dd>{unit.mentor}</dd></div>
                  <div><dt>地点</dt><dd>{unit.location}</dd></div>
                  <div><dt>组会</dt><dd>{unit.schedule}</dd></div>
                </dl>
                <div className="soft-note">
                  <LockKeyhole aria-hidden="true" />
                  <span>写入边界：只读与导出，无写接口。</span>
                </div>
              </div>
            </div>
          </>
        )}

        {active === "candidates" && (
          <>
            <SectionTitle
              title="候选人核对"
              description={`拟录取 ${offers} 人 · 候补 ${waitlist} 人 · 已评分 ${scored} 人。`}
              action={<Link to="/lab/candidates" className="text-link">全部候选人 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="table-card">
              <table className="data-table compact-table">
                <thead><tr><th>学生</th><th>专业</th><th>评分</th><th>结论</th></tr></thead>
                <tbody>
                  {candidates.slice(0, 5).map((candidate) => (
                    <tr key={candidate.id}>
                      <td><strong>{candidate.name}</strong><small className="cell-sub">{candidate.studentNo}</small></td>
                      <td>{candidate.major}</td>
                      <td><ScorePill score={candidate.score} /></td>
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
      </OverviewBoard>
    </div>
  );
}

export function LabQuota() {
  const { state, units, stage } = useLabData();
  const { notify } = useApp();
  const totals = units.reduce((sum, unit) => {
    const stats = getUnitStats(unit, state.offers);
    return { quota: sum.quota + unit.quota, confirmed: sum.confirmed + stats.confirmed, pending: sum.pending + stats.pending, remaining: sum.remaining + stats.remaining };
  }, { quota: 0, confirmed: 0, pending: 0, remaining: 0 });

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow={<>名额看板 · 只读 · 第 {stage.number} 阶段</>}
        title="每个名额都要对得上。"
        description="数据直接来自数据库快照。名额变更由学院管理员执行。"
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              downloadCsv("2026-AUT-实验室名额只读.csv", [
                ["代码", "实训室", "导师", "计划", "已确认", "待确认", "剩余", "使用率"],
                ...units.map((unit) => {
                  const stats = getUnitStats(unit, state.offers);
                  return [unit.code, unit.name, unit.mentor, unit.quota, stats.confirmed, stats.pending, stats.remaining, `${stats.fillRate}%`];
                }),
              ]);
              notify("名额看板已导出。", "success");
            }}
          >
            <Download aria-hidden="true" /> 导出
          </button>
        }
      />

      <section className="quota-total-bar">
        <div><span>计划名额</span><strong>{totals.quota}</strong></div>
        <div><span>已确认</span><strong>{totals.confirmed}</strong></div>
        <div><span>待确认</span><strong>{totals.pending}</strong></div>
        <div><span>剩余</span><strong>{totals.remaining}</strong></div>
        <ProgressBar value={Math.round(((totals.confirmed + totals.pending) / Math.max(1, totals.quota)) * 100)} tone="sage" label="全部实验室名额使用率" />
      </section>

      <div className="table-card">
        <table className="data-table quota-table">
          <thead><tr><th>实训室</th><th>导师</th><th>计划</th><th>已确认</th><th>待确认</th><th>剩余</th><th>使用率</th></tr></thead>
          <tbody>
            {units.map((unit) => {
              const stats = getUnitStats(unit, state.offers);
              return (
                <tr key={unit.id}>
                  <td><strong>{unit.name}</strong><small className="cell-sub">{unit.code} · {unit.direction}</small></td>
                  <td>{unit.mentor}</td>
                  <td>{unit.quota}</td>
                  <td>{stats.confirmed}</td>
                  <td>{stats.pending}</td>
                  <td><span className={stats.remaining === 0 ? "value-alert" : "value-good"}>{stats.remaining}</span></td>
                  <td><div className="inline-progress"><ProgressBar value={stats.fillRate} tone={stats.remaining === 0 ? "coral" : "sage"} label={`${unit.name}使用率`} /><span>{stats.fillRate}%</span></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LabCandidates() {
  const { state, unit, stage, candidates, scored, offers, waitlist } = useLabData();
  const { notify } = useApp();

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow={<>候选人只读 · {unit.code} · 第 {stage.number} 阶段</>}
        title="评分与结论，逐条可核对。"
        description="实验室负责人可查看本实训室候选人的评分、评语与导师结论，不可修改。"
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              downloadCsv(`${unit.name}-候选人只读.csv`, [
                ["姓名", "学号", "专业", "面试时间", "评分", "结论", "评语"],
                ...candidates.map((item) => [item.name, item.studentNo, item.major, item.interviewAt, item.score ?? "", item.decision === "offer" ? "拟录取" : item.decision === "waitlist" ? "候补" : item.decision === "reject" ? "未录取" : "待定", item.comment]),
              ]);
              notify("候选人数据已导出。", "success");
            }}
          >
            <Download aria-hidden="true" /> 导出
          </button>
        }
      />

      <section className="stats-grid stats-grid--four">
        <StatCard label="候选人" value={candidates.length} hint={unit.name} icon={<Users aria-hidden="true" />} tone="sky" />
        <StatCard label="已评分" value={scored} hint="评分来自面试官" icon={<ClipboardList aria-hidden="true" />} tone="sage" />
        <StatCard label="拟录取" value={offers} hint={`候补 ${waitlist} 人`} icon={<Gauge aria-hidden="true" />} tone="coral" />
        <StatCard label="提交状态" value={state.candidateListSubmitted ? "已锁定" : "编辑中"} hint="导师操作" icon={<LockKeyhole aria-hidden="true" />} tone="leaf" />
      </section>

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>候选人</th><th>面试时间</th><th>评分</th><th>结论</th><th>评语</th></tr></thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td><strong>{candidate.name}</strong><small className="cell-sub">{candidate.studentNo} · {candidate.major}</small></td>
                <td>{candidate.interviewAt}</td>
                <td><ScorePill score={candidate.score} /></td>
                <td>
                  <StatusBadge tone={candidate.decision === "offer" ? "sage" : candidate.decision === "waitlist" ? "sky" : candidate.decision === "reject" ? "neutral" : "coral"} dot={false}>
                    {candidate.decision === "offer" ? "拟录取" : candidate.decision === "waitlist" ? "候补" : candidate.decision === "reject" ? "未录取" : "待定"}
                  </StatusBadge>
                </td>
                <td>{candidate.comment || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
