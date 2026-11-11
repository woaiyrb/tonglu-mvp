import {
  MessageSquareText,
  Search,
  SlidersHorizontal,
  Star,
  UserRoundSearch,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Callout,
  EmptyState,
  PageHeader,
  ScorePill,
  StatCard,
  StatusBadge,
} from "../components/Ui";
import { ScoreDialog } from "../components/ScoreDialog";
import { STAGES } from "../data";
import { useApp } from "../store";
import type { Candidate } from "../types";
import { cn } from "../utils";

const filters = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待评分" },
  { key: "scored", label: "已评分" },
];

export function MentorInterviews() {
  const { state, notify, setStage } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Candidate | null>(null);
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const locked = stage.key !== "interview" || state.candidateListSubmitted || Boolean(state.frozenAt);
  const scored = state.candidates.filter((candidate) => candidate.score !== null).length;
  const average = Math.round(
    state.candidates.reduce((sum, candidate) => sum + (candidate.score ?? 0), 0) /
      Math.max(1, scored),
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.candidates.filter((candidate) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && candidate.score === null) ||
        (filter === "scored" && candidate.score !== null);
      const haystack = `${candidate.name} ${candidate.studentNo} ${candidate.major}`.toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, query, state.candidates]);

  const openEditor = async (candidate: Candidate) => {
    if (locked) {
      if (state.frozenAt) {
        notify("正式名单已冻结，评分只读。", "warning");
        return;
      }
      if (state.candidateListSubmitted) {
        notify("候选名单已提交，如需修改请先申请退回。", "warning");
        return;
      }
      const switched = await setStage("interview");
      if (!switched) return;
    }
    setEditing(candidate);
  };

  const switchToInterview = async () => {
    if (state.candidateListSubmitted) {
      notify(
        "候选名单已提交，如需修改请先申请退回。",
        "warning",
      );
      return;
    }
    if (state.frozenAt) {
      notify("正式名单已冻结，评分只读。", "warning");
      return;
    }
    await setStage("interview");
  };

  return (
    <div className="mentor-page">
      <PageHeader
        eyebrow={<>面试安排 · 第 {stage.number} 阶段</>}
        title="按同一把尺子，认真看每个人。"
        description="面试评分满分 100 分。评分与评语会进入候选择优记录。"
        actions={<StatusBadge tone={scored === state.candidates.length ? "sage" : "coral"}>{scored} / {state.candidates.length} 已评分</StatusBadge>}
      />

      {locked && (
        <Callout
          tone={state.candidateListSubmitted ? "info" : "warning"}
          title={state.candidateListSubmitted ? "候选名单已提交，评分只读" : `当前为“${stage.label}”，评分只读`}
          action={!state.candidateListSubmitted && !state.frozenAt ? (
            <button type="button" className="btn btn-primary btn-small" onClick={() => void switchToInterview()}>
              切换到面试阶段
            </button>
          ) : undefined}
        >
          {state.candidateListSubmitted
            ? "如需修改，请由学院退回候选名单。所有修改会生成新版本并保留原因。"
            : "点“切换到面试阶段”，或直接点任一评分按钮，系统会自动进入面试阶段。"}
        </Callout>
      )}

      <section className="stats-grid stats-grid--three">
        <StatCard label="面试学生" value={state.candidates.length} hint="全部进入本轮面试" icon={<UserRoundSearch aria-hidden="true" />} tone="sky" />
        <StatCard label="平均评分" value={scored ? average : "—"} hint={scored ? `基于 ${scored} 份已完成评分` : "尚无可计算评分"} icon={<Star aria-hidden="true" />} tone="sage" />
        <StatCard label="待评分" value={state.candidates.length - scored} hint="提交名单前必须清零" icon={<MessageSquareText aria-hidden="true" />} tone="coral" />
      </section>

      <div className="list-tools">
        <label className="search-field">
          <Search aria-hidden="true" />
          <span className="sr-only">搜索学生</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名、学号或专业"
          />
        </label>
        <div className="filter-chips" role="group" aria-label="评分筛选">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn("filter-chip", filter === item.key && "is-active")}
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal aria-hidden="true" />}
          title="没有符合条件的学生"
          description="调整搜索词或筛选条件后再试。"
        />
      ) : (
        <div className="candidate-list">
          <div className="candidate-list-head">
            <span>学生</span><span>面试时间</span><span>评分</span><span>评语</span><span />
          </div>
          {visible.map((candidate) => (
            <article className="candidate-row" key={candidate.id}>
              <div className="candidate-person">
                <span className="mentor-avatar">{candidate.name.slice(0, 1)}</span>
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.studentNo} · {candidate.major}</small>
                </span>
              </div>
              <span className="candidate-time">{candidate.interviewAt}</span>
              <ScorePill score={candidate.score} />
              <p className="candidate-comment">{candidate.comment || "尚未填写评语"}</p>
              <button
                type="button"
                className={cn("btn", candidate.score === null ? "btn-primary" : "btn-secondary", "btn-small")}
                onClick={() => void openEditor(candidate)}
              >
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
