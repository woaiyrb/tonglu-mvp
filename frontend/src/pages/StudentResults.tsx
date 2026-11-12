import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileWarning,
  LockKeyhole,
  Megaphone,
  MessageSquareWarning,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Callout,
  EmptyState,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from "../components/Ui";
import { PUBLIC_RESULTS, STUDENT, UNITS } from "../data";
import { useApp } from "../store";
import { downloadCsv, formatDateTime } from "../utils";

export function StudentResults() {
  const { state, submitAppeal, notify } = useApp();
  const [content, setContent] = useState("");
  const finalUnit = UNITS.find((unit) => unit.id === state.finalUnitId);
  const frozen = Boolean(state.frozenAt);
  const myAppeal = state.appeals.find((appeal) => appeal.studentName === STUDENT.name);

  const rows = useMemo(() => {
    const base = PUBLIC_RESULTS.map((item) => ({ ...item }));
    if (finalUnit) {
      const exists = base.some((item) => item.studentNo === STUDENT.studentNo);
      if (!exists) {
        base.push({
          name: STUDENT.name,
          studentNo: STUDENT.studentNo,
          unitId: finalUnit.id,
          source: "本轮确认",
        });
      }
    }
    return base;
  }, [finalUnit]);

  const submit = async () => {
    if (await submitAppeal(content)) setContent("");
  };

  if (!state.published) {
    return (
      <div className="results-page">
        <PageHeader
          eyebrow="公示名单"
          title="名单还在路上。"
          description="学院会先校验唯一去向、名额和调剂授权，再生成公示快照。"
          actions={<StatusBadge tone="neutral">尚未公示</StatusBadge>}
        />
        <div className="publicity-wait">
          <span className="publicity-wait-icon"><Megaphone aria-hidden="true" /></span>
          <EmptyState
            icon={<FileWarning aria-hidden="true" />}
            title="当前没有可查看的公示名单"
            description={
              finalUnit
                ? `你已确认 ${finalUnit.name}。等待学院完成名额与唯一性校验后，这里会出现正式名单。`
                : "你还没有确认拟录取去向，因此不会进入本轮公示。请先到“面试与结果”选择一个方向。"
            }
            action={
              <Link to="/student/status" className="btn btn-primary">
                {finalUnit ? "查看确认记录" : "前往确认去向"}
                <ArrowRight aria-hidden="true" />
              </Link>
            }
          />
          <div className="publicity-checks">
            <div><span>01</span><p>拟录取确认</p></div>
            <div><span>02</span><p>唯一性与名额校验</p></div>
            <div><span>03</span><p>生成公示快照</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <PageHeader
        eyebrow={<>公示 V1 · {formatDateTime(state.publishedAt)}</>}
        title="去向已落定，静候入组。"
        description="公示期内如有异议，可提交说明。冻结后名单只读，修改必须走更正流程。"
        actions={
          <StatusBadge tone={frozen ? "sage" : "coral"}>
            {frozen ? "名单已冻结" : "公示进行中"}
          </StatusBadge>
        }
      />

      {finalUnit ? (
        <section className="my-result-banner">
          <div>
            <span className="eyebrow"><CheckCircle2 aria-hidden="true" /> 我的最终去向</span>
            <h2>{finalUnit.name}</h2>
            <p>{finalUnit.direction} · 导师 {finalUnit.mentor}</p>
          </div>
          <div className="my-result-meta">
            <span>{finalUnit.code}</span>
            <small>{finalUnit.schedule} · {finalUnit.location}</small>
          </div>
        </section>
      ) : (
        <Callout tone="warning" title="你不在本轮公示名单中">
          如已确认去向但仍未显示，请在公示期内提交异议。
        </Callout>
      )}

      <section className="section-block">
        <SectionTitle
          title="本轮公示名单"
          description={`共 ${rows.length} 人。姓名与学号经过脱敏校验，仅用于本次公示。`}
          action={
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                downloadCsv("2026-AUT-公示名单.csv", [
                  ["姓名", "学号", "实训室", "来源"],
                  ...rows.map((row) => [
                    row.name,
                    row.studentNo,
                    UNITS.find((unit) => unit.id === row.unitId)?.name ?? row.unitId,
                    row.source,
                  ]),
                ]);
                notify("公示名单已导出。", "success");
              }}
            >
              <Download aria-hidden="true" /> 导出 CSV
            </button>
          }
        />
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>学号</th>
                <th>实训室</th>
                <th>入围来源</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.studentNo} className={row.studentNo === STUDENT.studentNo ? "is-me" : ""}>
                  <td><strong>{row.name}</strong>{row.studentNo === STUDENT.studentNo && <span className="me-tag">我</span>}</td>
                  <td>{row.studentNo}</td>
                  <td>{UNITS.find((unit) => unit.id === row.unitId)?.name ?? row.unitId}</td>
                  <td><StatusBadge tone="sky" dot={false}>{row.source}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-grid section-grid--sidebar result-bottom">
        <div className="stack-24">
          <SectionTitle
            title="公示异议"
            description={frozen ? "公示已结束，异议入口已关闭。" : "请在公示结束前提交。说明应包含事实、时间和可核对材料。"}
          />
          {myAppeal ? (
            <div className="appeal-card">
              <div className="appeal-card-head">
                <StatusBadge tone={myAppeal.status === "已办结" ? "sage" : "coral"}>
                  {myAppeal.status}
                </StatusBadge>
                <small>{formatDateTime(myAppeal.createdAt)}</small>
              </div>
              <p>{myAppeal.content}</p>
              <span>学院会核对材料并记录处理结论。</span>
            </div>
          ) : (
            <div className="appeal-form">
              <label htmlFor="appeal-content">异议说明</label>
              <textarea
                id="appeal-content"
                rows={5}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="请写明需要核对的公示信息与理由，至少 8 个字。"
                disabled={frozen}
              />
              <div className="appeal-form-foot">
                <span>{content.trim().length} 字 · 提交后进入管理端队列</span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submit}
                  disabled={frozen || content.trim().length < 8}
                >
                  <Send aria-hidden="true" /> 提交异议
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="stack-24">
          <SectionTitle title="状态说明" description="公示期与冻结规则。" />
          <div className="info-list">
            <div>
              <Megaphone aria-hidden="true" />
              <span><strong>公示进行中</strong><small>名单可查看，异议可提交。</small></span>
            </div>
            <div>
              <LockKeyhole aria-hidden="true" />
              <span><strong>名单冻结</strong><small>{frozen ? formatDateTime(state.frozenAt) : "公示结束后自动冻结"}，正式名单只读。</small></span>
            </div>
            <div>
              <ShieldCheck aria-hidden="true" />
              <span><strong>更正流程</strong><small>冻结后的任何修改都需学院审批并留痕。</small></span>
            </div>
          </div>
          <div className="soft-note">
            <MessageSquareWarning aria-hidden="true" />
            <span>异议处理不改变其他学生的公示信息；涉及名单变化的，将生成新版本。</span>
          </div>
        </aside>
      </section>
    </div>
  );
}
