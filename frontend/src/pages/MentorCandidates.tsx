import {
  CheckCircle2,
  Download,
  LockKeyhole,
  Send,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { Callout, PageHeader, ScorePill, SectionTitle, StatusBadge } from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { useApp } from "../store";
import type { CandidateDecision } from "../types";
import { cn, downloadCsv, getUnitStats } from "../utils";

const decisions: Array<{ value: Exclude<CandidateDecision, null>; label: string }> = [
  { value: "offer", label: "拟录取" },
  { value: "waitlist", label: "候补" },
  { value: "reject", label: "未录取" },
];

export function MentorCandidates() {
  const { state, updateCandidateDecision, submitCandidateList, notify } = useApp();
  const unit = UNITS[0];
  const stats = getUnitStats(unit, state.offers);
  const locked = state.candidateListSubmitted;
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const stageOpen = state.stage === "interview";
  const editable = !locked && stageOpen;
  const counts = useMemo(
    () => ({
      offer: state.candidates.filter((item) => item.decision === "offer").length,
      waitlist: state.candidates.filter((item) => item.decision === "waitlist").length,
      reject: state.candidates.filter((item) => item.decision === "reject").length,
      pending: state.candidates.filter((item) => item.decision === null).length,
    }),
    [state.candidates],
  );
  const missingScore = state.candidates.filter((item) => item.score === null).length;
  const overQuota = counts.offer + stats.pending > unit.quota;

  const setDecision = (id: string, decision: Exclude<CandidateDecision, null>) => {
    if (locked) {
      notify("候选名单已提交，结论已锁定。", "warning");
      return;
    }
    if (!stageOpen) {
      notify(`候选结论仅在“面试考核”阶段开放，当前为“${stage.label}”阶段。`, "warning");
      return;
    }
    updateCandidateDecision(id, decision);
  };

  return (
    <div className="mentor-page">
      <PageHeader
        eyebrow={<>候选人评审 · {unit.code}</>}
        title="把合适的人，放进合适的位置。"
        description="结合评分与评语形成拟录取、候补和未录取结论。提交后名单锁定。"
        actions={<StatusBadge tone={locked ? "sage" : stageOpen ? "coral" : "neutral"}>{locked ? "已提交锁定" : stageOpen ? "编辑中" : "阶段未开放"}</StatusBadge>}
      />

      {locked ? (
        <Callout tone="success" title="候选名单已提交">
          本轮名单已锁定。若需更正，请等待学院退回；退回时需填写原因，修改后生成新版本。
        </Callout>
      ) : !stageOpen ? (
        <Callout tone="info" title={`${stage.label}：候选名单暂不可编辑`}>
          候选结论与名单提交仅在“面试考核”阶段开放。当前阶段可查看评分和名额，不能修改或提交结论。
        </Callout>
      ) : (
        <Callout
          tone={overQuota ? "warning" : "info"}
          title={overQuota ? "拟录取人数可能超过可用名额" : "名单尚未提交"}
          action={
            <span className="callout-hint">
              已确认 {stats.confirmed} · 待确认 {stats.pending}
            </span>
          }
        >
          提交前系统会检查全部评分。名单提交后，其他导师和管理端才能看到本轮结论。
        </Callout>
      )}

      <section className="decision-summary">
        <div><span>拟录取</span><strong>{counts.offer}</strong><small>计划名额 {unit.quota}</small></div>
        <div><span>候补</span><strong>{counts.waitlist}</strong><small>按评分排序</small></div>
        <div><span>未录取</span><strong>{counts.reject}</strong><small>保留评语</small></div>
        <div><span>待定</span><strong>{counts.pending}</strong><small>应清零</small></div>
      </section>

      <section className="section-block">
        <SectionTitle
          title="候选人名单"
          description="结论只代表本实训室。学生若收到多个拟录取，仍需本人确认唯一去向。"
          action={
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                downloadCsv("智能交互实验室-候选名单.csv", [
                  ["姓名", "学号", "专业", "面试时间", "评分", "结论", "评语"],
                  ...state.candidates.map((item) => [
                    item.name,
                    item.studentNo,
                    item.major,
                    item.interviewAt,
                    item.score ?? "",
                    item.decision === "offer" ? "拟录取" : item.decision === "waitlist" ? "候补" : item.decision === "reject" ? "未录取" : "待定",
                    item.comment,
                  ]),
                ]);
                notify("候选名单已导出。", "success");
              }}
            >
              <Download aria-hidden="true" /> 导出
            </button>
          }
        />

        <div className="decision-list">
          {state.candidates.map((candidate, index) => (
            <article className={cn("decision-row", editable === false && "is-locked")} key={candidate.id}>
              <span className="decision-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="candidate-person">
                <span className="mentor-avatar">{candidate.name.slice(0, 1)}</span>
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.major} · {candidate.studentNo}</small>
                </span>
              </div>
              <ScorePill score={candidate.score} />
              <p>{candidate.comment || "暂无评语"}</p>
              <div className="decision-switch" role="group" aria-label={`${candidate.name} 的结论`}>
                {decisions.map((decision) => (
                  <button
                    key={decision.value}
                    type="button"
                    className={cn(candidate.decision === decision.value && `is-active is-${decision.value}`)}
                    onClick={() => setDecision(candidate.id, decision.value)}
                    aria-pressed={candidate.decision === decision.value}
                    disabled={!editable}
                  >
                    {decision.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="submit-strip">
        <div>
          <strong>提交本轮候选名单</strong>
          <p>
            拟录取 {counts.offer} 人 · 候补 {counts.waitlist} 人
            {missingScore > 0 ? ` · 还有 ${missingScore} 人未评分` : " · 全部评分已完成"}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!editable}
          onClick={() => submitCandidateList()}
        >
          {locked ? <><LockKeyhole aria-hidden="true" /> 已锁定</> : !stageOpen ? <><LockKeyhole aria-hidden="true" /> 面试阶段开放</> : <><Send aria-hidden="true" /> 提交名单</>}
        </button>
      </section>

      <div className="rule-note">
        <ShieldCheck aria-hidden="true" />
        <span>
          <strong>规则校验</strong> 同一学生可被多个实训室拟录取，但最终只能确认一个方向。候补按评分依次递补，未录取记录保留评语。
        </span>
      </div>
    </div>
  );
}
