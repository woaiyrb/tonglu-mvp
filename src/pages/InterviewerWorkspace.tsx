import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  Download,
  Gauge,
  LockKeyhole,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundSearch,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Callout,
  EmptyState,
  OverviewBoard,
  PageHeader,
  ProgressBar,
  ScorePill,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "../components/Ui";
import { ScoreDialog } from "../components/ScoreDialog";
import { STAGES, UNITS } from "../data";
import { useApp } from "../store";
import type { Candidate } from "../types";
import { cn, downloadCsv } from "../utils";

type InterviewerModule = "today" | "queue" | "records";

function useInterviewerData() {
  const { state } = useApp();
  const unit = state.units?.find((item) => item.id === state.currentUser?.unitId)
    ?? UNITS.find((item) => item.id === state.currentUser?.unitId)
    ?? UNITS[0];
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const scored = state.candidates.filter((candidate) => candidate.score !== null).length;
  const pending = state.candidates.length - scored;
  const average = Math.round(
    state.candidates.reduce((sum, candidate) => sum + (candidate.score ?? 0), 0) /
      Math.max(1, scored),
  );
  const locked = stage.key !== "interview" || state.candidateListSubmitted || Boolean(state.frozenAt);
  return { state, unit, stage, scored, pending, average, locked };
}

export function InterviewerOverview() {
  const { state, unit, stage, scored, pending, average, locked } = useInterviewerData();
  const [active, setActive] = useState<InterviewerModule>("today");
  const recent = state.candidates
    .filter((candidate) => candidate.score !== null)
    .slice(0, 4);
  const modules: Array<{ id: InterviewerModule; label: string; hint: string; icon: ReactNode; badge?: number }> = [
    { id: "today", label: "今日概览", hint: `第 ${stage.number} 阶段`, icon: <Sparkles aria-hidden="true" /> },
    { id: "queue", label: "评分队列", hint: pending ? `${pending} 人待评分` : "全部完成", icon: <Star aria-hidden="true" />, badge: pending },
    { id: "records", label: "评分记录", hint: `${scored} 条已归档`, icon: <ClipboardCheck aria-hidden="true" /> },
  ];

  return (
    <div className="role-portal">
      <OverviewBoard items={modules} active={active} onChange={setActive} ariaLabel="面试官工作台模块">
        {active === "today" && (
          <>
            <section className="mentor-banner">
              <div className="mentor-banner-main">
                <span className="mentor-avatar mentor-avatar--large">评</span>
                <div>
                  <span className="eyebrow">面试官工作台 · {unit.code}</span>
                  <h2>{locked ? "评分入口已锁定。" : pending ? `还有 ${pending} 名学生待评分。` : "本实训室评分已完成。"}</h2>
                  <p>{unit.name} · {unit.mentor} · 第 {stage.number} 阶段 {stage.label}</p>
                </div>
              </div>
              <div className="mentor-banner-actions">
                <Link to="/interviewer/scoring" className="btn btn-primary">进入评分队列 <ArrowRight aria-hidden="true" /></Link>
                <Link to="/interviewer/records" className="btn btn-secondary">评分记录</Link>
              </div>
            </section>

            <Callout
              tone={locked ? "info" : pending > 0 ? "warning" : "success"}
              title={locked ? "当前评分入口已锁定" : pending > 0 ? `还有 ${pending} 名学生待评分` : "本实训室评分已全部完成"}
            >
              {locked
                ? state.candidateListSubmitted
                  ? "候选名单已提交。需要更正时由学院退回，不能直接改写评分。"
                  : "切换到第 4 阶段“面试考核”后，评分才会写入数据库。"
                : "评分保存后立即进入数据库，评语与操作人同步写入审计日志。"}
            </Callout>

            <section className="stats-grid stats-grid--four">
              <StatCard label="面试学生" value={state.candidates.length} hint={`${unit.name} 候选人`} icon={<UserRoundSearch aria-hidden="true" />} tone="sky" />
              <StatCard label="已评分" value={scored} hint={`完成率 ${Math.round((scored / Math.max(1, state.candidates.length)) * 100)}%`} icon={<Check aria-hidden="true" />} tone="sage" />
              <StatCard label="平均分" value={scored ? average : "—"} hint={scored ? `基于 ${scored} 份评分` : "尚无可计算评分"} icon={<Star aria-hidden="true" />} tone="coral" />
              <StatCard label="待评分" value={pending} hint="权限仅限本实训室" icon={<MessageSquareText aria-hidden="true" />} tone="leaf" />
            </section>
          </>
        )}

        {active === "queue" && (
          <>
            <SectionTitle
              title="评分队列"
              description="按名单顺序处理，评分与评语保存后即时归档。"
              action={<Link to="/interviewer/scoring" className="text-link">进入评分 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="table-card">
              <table className="data-table compact-table">
                <thead><tr><th>学生</th><th>专业</th><th>评分</th><th>状态</th><th /></tr></thead>
                <tbody>
                  {state.candidates.slice(0, 5).map((candidate) => (
                    <tr key={candidate.id}>
                      <td><strong>{candidate.name}</strong><small className="cell-sub">{candidate.studentNo}</small></td>
                      <td>{candidate.major}</td>
                      <td><ScorePill score={candidate.score} /></td>
                      <td><StatusBadge tone={candidate.score === null ? "coral" : "sage"} dot={false}>{candidate.score === null ? "待评分" : "已评分"}</StatusBadge></td>
                      <td><Link to="/interviewer/scoring" className="text-link">去评分</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {active === "records" && (
          <>
            <SectionTitle
              title="评分记录"
              description="面试官只处理本实训室候选人，不提交名单，不修改结论。"
              action={<Link to="/interviewer/records" className="text-link">全部记录 <ArrowRight aria-hidden="true" /></Link>}
            />
            <div className="overview-two-col">
              <div className="panel-card role-panel">
                <div className="role-progress-line">
                  <ProgressBar value={Math.round((scored / Math.max(1, state.candidates.length)) * 100)} tone={pending ? "coral" : "sage"} label="评分完成率" />
                  <strong>{scored} / {state.candidates.length}</strong>
                </div>
                <div className="role-mini-list">
                  {recent.map((candidate) => (
                    <div key={candidate.id}>
                      <span className="mentor-avatar">{candidate.name.slice(0, 1)}</span>
                      <span><strong>{candidate.name}</strong><small>{candidate.studentNo}</small></span>
                      <ScorePill score={candidate.score} />
                    </div>
                  ))}
                  {recent.length === 0 && <p className="muted-copy">暂无已保存评分。</p>}
                </div>
              </div>
              <div className="panel-card role-panel">
                <dl className="role-facts">
                  <div><dt>实训室</dt><dd>{unit.name}</dd></div>
                  <div><dt>负责人</dt><dd>{unit.mentor}</dd></div>
                  <div><dt>面试地点</dt><dd>{unit.location}</dd></div>
                  <div><dt>当前阶段</dt><dd>{stage.label}</dd></div>
                  <div><dt>评分状态</dt><dd>{locked ? "只读" : "可写"}</dd></div>
                </dl>
              </div>
            </div>
          </>
        )}
      </OverviewBoard>
    </div>
  );
}

export function InterviewerScoring() {
  const { state, unit, stage, scored, pending, locked } = useInterviewerData();
  const { notify, setStage } = useApp();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Candidate | null>(null);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.candidates.filter((candidate) =>
      !normalized || `${candidate.name} ${candidate.studentNo} ${candidate.major}`.toLowerCase().includes(normalized),
    );
  }, [query, state.candidates]);

  const openEditor = async (candidate: Candidate) => {
    if (locked) {
      if (state.candidateListSubmitted) {
        notify("候选名单已提交，评分只读。", "warning");
        return;
      }
      if (state.frozenAt) {
        notify("正式名单已冻结，评分只读。", "warning");
        return;
      }
      const switched = await setStage("interview");
      if (!switched) return;
    }
    setEditing(candidate);
  };

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow={<>评分队列 · {unit.code} · 第 {stage.number} 阶段</>}
        title="逐人评分，留下证据。"
        description="评分范围为 0 到 100 分。评语需具体、可核对，便于后续复核。"
        actions={<StatusBadge tone={pending ? "coral" : "sage"}>{scored} / {state.candidates.length} 已评分</StatusBadge>}
      />

      {locked && (
        <Callout
          tone="info"
          title="当前评分只读"
          action={!state.candidateListSubmitted && !state.frozenAt ? (
            <button type="button" className="btn btn-primary btn-small" onClick={() => void setStage("interview")}>
              切换到面试阶段
            </button>
          ) : undefined}
        >
          {state.candidateListSubmitted ? "候选名单已提交。" : "点“切换到面试阶段”，或直接点评分按钮，系统会自动开放评分。"}
        </Callout>
      )}

      <div className="list-tools">
        <label className="search-field">
          <Search aria-hidden="true" />
          <span className="sr-only">搜索候选人</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名、学号或专业" />
        </label>
        <StatusBadge tone={locked ? "neutral" : "sage"}>{locked ? "只读" : "服务器校验通过"}</StatusBadge>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Search aria-hidden="true" />} title="没有匹配候选人" description="调整搜索词后重试。" />
      ) : (
        <div className="candidate-list">
          <div className="candidate-list-head"><span>学生</span><span>面试时间</span><span>评分</span><span>评语</span><span /></div>
          {visible.map((candidate) => (
            <article className="candidate-row" key={candidate.id}>
              <div className="candidate-person">
                <span className="mentor-avatar">{candidate.name.slice(0, 1)}</span>
                <span><strong>{candidate.name}</strong><small>{candidate.studentNo} · {candidate.major}</small></span>
              </div>
              <span className="candidate-time">{candidate.interviewAt}</span>
              <ScorePill score={candidate.score} />
              <p className="candidate-comment">{candidate.comment || "尚未填写评语"}</p>
              <button type="button" className={cn("btn", candidate.score === null ? "btn-primary" : "btn-secondary", "btn-small")} onClick={() => void openEditor(candidate)}>
                {candidate.score === null ? "评分" : "查看 / 修改"}
              </button>
            </article>
          ))}
        </div>
      )}

      <ScoreDialog candidate={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

export function InterviewerRecords() {
  const { state, unit, stage } = useInterviewerData();
  const { notify } = useApp();
  const scored = state.candidates.filter((candidate) => candidate.score !== null);

  return (
    <div className="role-portal">
      <PageHeader
        eyebrow={<>面试记录 · {unit.code} · 第 {stage.number} 阶段</>}
        title="评分写入之后，记录就应可追溯。"
        description="本页只读。记录来自数据库，包含评分、评语与面试时间。"
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              downloadCsv(`${unit.name}-面试评分.csv`, [
                ["姓名", "学号", "专业", "面试时间", "评分", "评语"],
                ...state.candidates.map((item) => [item.name, item.studentNo, item.major, item.interviewAt, item.score ?? "", item.comment]),
              ]);
              notify("评分记录已导出。", "success");
            }}
          >
            <Download aria-hidden="true" /> 导出
          </button>
        }
      />

      <section className="stats-grid stats-grid--three">
        <StatCard label="记录总数" value={state.candidates.length} hint="本实训室候选人" icon={<CalendarDays aria-hidden="true" />} tone="sky" />
        <StatCard label="已评分" value={scored.length} hint="可进入候选评审" icon={<Check aria-hidden="true" />} tone="sage" />
        <StatCard label="未评分" value={state.candidates.length - scored.length} hint="评分队列仍需处理" icon={<Gauge aria-hidden="true" />} tone="coral" />
      </section>

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>候选人</th><th>面试时间</th><th>评分</th><th>评语</th></tr></thead>
          <tbody>
            {state.candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td><strong>{candidate.name}</strong><small className="cell-sub">{candidate.studentNo} · {candidate.major}</small></td>
                <td>{candidate.interviewAt}</td>
                <td><ScorePill score={candidate.score} /></td>
                <td>{candidate.comment || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
