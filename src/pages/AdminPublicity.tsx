import {
  CheckCircle2,
  Download,
  LockKeyhole,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { Callout, PageHeader, SectionTitle, StatusBadge } from "../components/Ui";
import { PUBLIC_RESULTS, STUDENT, UNITS } from "../data";
import { useApp } from "../store";
import { cn, downloadCsv, formatDateTime } from "../utils";

export function AdminPublicity() {
  const { state, publishResults, freezeResults, resolveAppeal, notify } = useApp();
  const frozen = Boolean(state.frozenAt);
  const unscored = state.candidates.filter((candidate) => candidate.score === null).length;
  const unauthorized = state.adjustmentQueue.filter((item) => !item.authorized && item.status !== "已生成").length;
  const finalUnit = UNITS.find((unit) => unit.id === state.finalUnitId);
  const checks = [
    { label: "学生已确认唯一去向", ok: Boolean(state.confirmedOfferId), detail: finalUnit ? `${finalUnit.name}` : "尚未确认，不能发布" },
    { label: "全部面试评分完成", ok: unscored === 0, detail: unscored ? `${unscored} 人未评分` : "评分完整" },
    { label: "调剂授权已核对", ok: unauthorized === 0, detail: unauthorized ? `${unauthorized} 条待审批` : "授权完整" },
    { label: "候选名单已提交", ok: state.candidateListSubmitted, detail: state.candidateListSubmitted ? "已锁定" : "导师仍在编辑" },
  ];
  const blockers = checks.filter((item) => !item.ok);

  const rows = useMemo(() => {
    const base = PUBLIC_RESULTS.map((item) => ({ ...item }));
    if (finalUnit && !base.some((item) => item.studentNo === STUDENT.studentNo)) {
      base.push({ name: STUDENT.name, studentNo: STUDENT.studentNo, unitId: finalUnit.id, source: "本轮确认" });
    }
    return base;
  }, [finalUnit]);

  const publish = () => {
    if (blockers.length > 0) {
      notify(`发布前校验未通过：${blockers.map((item) => item.label).join("、")}。`, "warning");
      return;
    }
    publishResults();
  };

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="公示管理"
        title="先校验，再公示，最后冻结。"
        description="公示名单必须来自已确认的唯一去向。冻结后进入只读，后续修改走更正流程。"
        actions={<StatusBadge tone={frozen ? "sage" : state.published ? "coral" : "neutral"}>{frozen ? "已冻结" : state.published ? "公示中" : "未发布"}</StatusBadge>}
      />

      {!state.confirmedOfferId && (
        <Callout tone="danger" title="缺少学生唯一去向确认">
          当前不能生成公示名单。请学生先在“面试与结果”中选择一个拟录取方向。
        </Callout>
      )}

      <section className="section-grid section-grid--sidebar publicity-layout">
        <div className="stack-24">
          <SectionTitle title="发布前校验" description="每一项都必须通过，发布动作才会生成快照。" />
          <div className="checklist-card">
            {checks.map((check) => (
              <div className={cn("checklist-row", check.ok ? "is-ok" : "is-blocked")} key={check.label}>
                <span>{check.ok ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}</span>
                <div><strong>{check.label}</strong><small>{check.detail}</small></div>
                <StatusBadge tone={check.ok ? "sage" : "coral"} dot={false}>{check.ok ? "通过" : "未通过"}</StatusBadge>
              </div>
            ))}
          </div>

          <div className="publish-actions">
            <div>
              <strong>{state.published ? `公示 V1 已生成` : "生成公示快照"}</strong>
              <p>{state.published ? `发布于 ${formatDateTime(state.publishedAt)}` : "生成后学生端立即可见，与当前名额和候选记录绑定。"}</p>
            </div>
            {!state.published ? (
              <button type="button" className="btn btn-primary" disabled={blockers.length > 0} onClick={publish}>
                <Megaphone aria-hidden="true" /> 生成公示名单
              </button>
            ) : (
              <button type="button" className="btn btn-primary" disabled={frozen} onClick={() => freezeResults()}>
                {frozen ? <><LockKeyhole aria-hidden="true" /> 已冻结</> : <><ShieldCheck aria-hidden="true" /> 冻结正式名单</>}
              </button>
            )}
          </div>

          {state.published && (
            <section className="section-block">
              <SectionTitle
                title="公示快照"
                description={frozen ? `冻结于 ${formatDateTime(state.frozenAt)}，当前只读。` : `生成于 ${formatDateTime(state.publishedAt)}，公示期内可处理异议。`}
                action={
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      downloadCsv("2026-AUT-正式公示.csv", [
                        ["姓名", "学号", "实训室", "来源"],
                        ...rows.map((row) => [row.name, row.studentNo, UNITS.find((unit) => unit.id === row.unitId)?.name ?? row.unitId, row.source]),
                      ]);
                      notify("公示名单已导出。", "success");
                    }}
                  >
                    <Download aria-hidden="true" /> CSV
                  </button>
                }
              />
              <div className="table-card">
                <table className="data-table">
                  <thead><tr><th>姓名</th><th>学号</th><th>实训室</th><th>来源</th></tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.studentNo}>
                        <td><strong>{row.name}</strong></td>
                        <td>{row.studentNo}</td>
                        <td>{UNITS.find((unit) => unit.id === row.unitId)?.name ?? row.unitId}</td>
                        <td>{row.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="stack-24">
          <SectionTitle title="公示异议" description="逐条核对并办结。" />
          {state.appeals.length === 0 ? (
            <div className="empty-mini">
              <MessageSquareWarning aria-hidden="true" />
              <strong>暂无异议</strong>
              <p>学生提交后会出现在这里。</p>
            </div>
          ) : (
            <div className="appeal-queue">
              {state.appeals.map((appeal) => (
                <article key={appeal.id}>
                  <div><StatusBadge tone={appeal.status === "已办结" ? "sage" : "coral"}>{appeal.status}</StatusBadge><small>{formatDateTime(appeal.createdAt)}</small></div>
                  <strong>{appeal.studentName}</strong>
                  <p>{appeal.content}</p>
                  {appeal.status === "待处理" && (
                    <button type="button" className="btn btn-secondary btn-small" onClick={() => resolveAppeal(appeal.id)}>办结异议</button>
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="soft-note">
            <ShieldCheck aria-hidden="true" />
            <span>异议处理与名单修改分开记录。涉及名单变化时必须生成新版本，不能覆盖旧公示。</span>
          </div>
        </aside>
      </section>
    </div>
  );
}
