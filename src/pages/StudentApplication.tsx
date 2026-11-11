import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Info,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Callout,
  CheckLine,
  Modal,
  PageHeader,
  StatusBadge,
  UnitGlyph,
} from "../components/Ui";
import { STAGES, STUDENT, UNITS } from "../data";
import { useApp } from "../store";
import type { Unit } from "../types";
import { cn, formatDateTime } from "../utils";

export function StudentApplication() {
  const {
    state,
    setStage,
    toggleUnit,
    setAdjustment,
    setCommitment,
    submitApplication,
    notify,
  } = useApp();
  const [previewOpen, setPreviewOpen] = useState(false);
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const locked = state.stage !== "intent";
  const selectedUnits = state.selectedUnitIds
    .map((id) => UNITS.find((unit) => unit.id === id))
    .filter((unit): unit is Unit => Boolean(unit));

  const handleSubmit = async () => {
    if (await submitApplication()) setPreviewOpen(false);
  };

  return (
    <div className="application-page">
      <PageHeader
        eyebrow={<>申请单 · {state.application ? `v${state.application.version}` : "草稿"}</>}
        title="把想法写成清楚的申请。"
        description="3 个平行意向同等有效。你需要分别确认两类调剂授权，并保证材料真实。"
        actions={
          state.application ? (
            <StatusBadge tone="sage">已提交</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">未提交</StatusBadge>
          )
        }
      />

      {locked ? (
        <Callout
          tone="warning"
          title={`当前演示阶段为“${stage.label}”，申请单已锁定`}
          action={
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setStage("intent")}>
              切换到意向填报
            </button>
          }
        >
          真实系统中，申请只在意向填报阶段开放修改；截止后服务器会拒绝写入。
        </Callout>
      ) : state.application ? (
        <Callout tone="success" title={`已在 ${formatDateTime(state.application.submittedAt)} 提交 v${state.application.version}`}>
          本轮截止前可继续修改。每次提交会生成新版本，重复点击不会重复创建申请。
        </Callout>
      ) : (
        <Callout tone="info" title="申请尚未提交">
          你仍可调整意向和授权。提交前会展示完整预览。
        </Callout>
      )}

      <div className="form-layout">
        <div className="form-main">
          <section className="form-card">
            <div className="form-section-head">
              <div>
                <span className="section-index">01</span>
                <div>
                  <h2>平行意向</h2>
                  <p>最多 3 个，指向不同招生单元；不设置志愿顺序。</p>
                </div>
              </div>
              <StatusBadge tone={state.selectedUnitIds.length === 3 ? "sage" : "sky"}>
                {state.selectedUnitIds.length} / 3
              </StatusBadge>
            </div>

            <div className="application-slots">
              {selectedUnits.map((unit, index) => (
                <div className="application-slot" key={unit.id}>
                  <span className="application-slot-index">0{index + 1}</span>
                  <UnitGlyph glyph={unit.glyph} tone={unit.tone} size="md" />
                  <div className="application-slot-copy">
                    <div>
                      <h3>{unit.name}</h3>
                      <StatusBadge tone="sky" dot={false}>{unit.code}</StatusBadge>
                    </div>
                    <p>{unit.direction}</p>
                    <span>导师 {unit.mentor} · {unit.schedule} · {unit.location}</span>
                  </div>
                  <button
                    type="button"
                    className="icon-button icon-button--small"
                    onClick={() => toggleUnit(unit.id)}
                    disabled={locked}
                    aria-label={`移除 ${unit.name}`}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              ))}
              {selectedUnits.length < 3 && (
                <Link
                  to="/student/units"
                  className={cn("application-slot", "application-slot--add", locked && "is-disabled")}
                  aria-disabled={locked}
                  tabIndex={locked ? -1 : 0}
                >
                  <span className="add-circle">+</span>
                  <div className="application-slot-copy">
                    <h3>再选一个方向</h3>
                    <p>当前还可以添加 {3 - selectedUnits.length} 个平行意向。</p>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </div>
            <p className="form-help">
              <Info aria-hidden="true" />
              第 4 个意向、重复招生单元或超出截止时间的提交，都会被系统阻止。
            </p>
          </section>

          <section className="form-card">
            <div className="form-section-head">
              <div>
                <span className="section-index">02</span>
                <div>
                  <h2>调剂授权</h2>
                  <p>两项授权分别保存，默认不勾选。授权范围会进入调剂队列校验。</p>
                </div>
              </div>
            </div>

            <div className="consent-list">
              <label className={cn("consent-card", state.adjustments.internal && "is-checked")}>
                <input
                  type="checkbox"
                  checked={state.adjustments.internal}
                  onChange={(event) => setAdjustment("internal", event.target.checked)}
                  disabled={locked}
                />
                <span className="consent-control" aria-hidden="true">
                  {state.adjustments.internal && <Check />}
                </span>
                <span className="consent-copy">
                  <span className="consent-title">
                    <strong>服从实训室内调剂</strong>
                    <StatusBadge tone="sage" dot={false}>优先级 1</StatusBadge>
                  </span>
                  <span>未录取时，可被原实训室在其他招生方向内优先匹配。</span>
                </span>
              </label>

              <label className={cn("consent-card", state.adjustments.cross && "is-checked")}>
                <input
                  type="checkbox"
                  checked={state.adjustments.cross}
                  onChange={(event) => setAdjustment("cross", event.target.checked)}
                  disabled={locked}
                />
                <span className="consent-control" aria-hidden="true">
                  {state.adjustments.cross && <Check />}
                </span>
                <span className="consent-copy">
                  <span className="consent-title">
                    <strong>服从全院跨实训室调剂</strong>
                    <StatusBadge tone="sky" dot={false}>优先级 2</StatusBadge>
                  </span>
                  <span>未被任何意向录取时，可进入其他实训室剩余名额的调剂池。</span>
                </span>
              </label>
            </div>
            <p className="form-help">
              <ShieldCheck aria-hidden="true" />
              最终统筹安排如超出上述授权，必须经过学院明确审批，不能由系统自动突破。
            </p>
          </section>

          <section className="form-card">
            <div className="form-section-head">
              <div>
                <span className="section-index">03</span>
                <div>
                  <h2>材料与承诺</h2>
                  <p>材料仅用于选拔审核，学生之间不可互看。</p>
                </div>
              </div>
              <StatusBadge tone="sage">审核通过</StatusBadge>
            </div>

            <div className="file-list">
              {[
                { name: "个人简历_孙悦.pdf", size: "218 KB", type: "简历" },
                { name: "本科成绩单_2026.pdf", size: "1.2 MB", type: "成绩单" },
                { name: "作品集说明.pdf", size: "3.4 MB", type: "补充材料" },
              ].map((file) => (
                <div className="file-row" key={file.name}>
                  <span className="file-icon">
                    <FileText aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{file.name}</strong>
                    <span>{file.type} · {file.size}</span>
                  </div>
                  <span className="file-status">
                    <FileCheck2 aria-hidden="true" />
                    已校验
                  </span>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => notify("演示环境不执行真实文件上传。", "info")}
                  >
                    替换
                  </button>
                </div>
              ))}
            </div>

            <label className={cn("commitment-card", state.commitment && "is-checked")}>
              <input
                type="checkbox"
                checked={state.commitment}
                onChange={(event) => setCommitment(event.target.checked)}
                disabled={locked}
              />
              <span className="consent-control" aria-hidden="true">
                {state.commitment && <Check />}
              </span>
              <span>
                <strong>我确认以上信息与材料真实有效</strong>
                <span>我已阅读选拔规则，理解确认拟录取后只能保留一个去向，并同意按服务器时间执行阶段限制。</span>
              </span>
            </label>
          </section>
        </div>

        <aside className="submit-panel">
          <div className="submit-panel-head">
            <span className="eyebrow">提交摘要</span>
            <h2>本轮申请</h2>
            <p>{STUDENT.name} · {STUDENT.studentNo}</p>
          </div>

          <dl className="summary-list">
            <div>
              <dt>平行意向</dt>
              <dd>{state.selectedUnitIds.length} / 3</dd>
            </div>
            <div>
              <dt>调剂授权</dt>
              <dd>{Number(state.adjustments.internal) + Number(state.adjustments.cross)} / 2</dd>
            </div>
            <div>
              <dt>材料</dt>
              <dd>3 份</dd>
            </div>
            <div>
              <dt>当前版本</dt>
              <dd>{state.application ? `v${state.application.version}` : "草稿"}</dd>
            </div>
            <div>
              <dt>截止窗口</dt>
              <dd>11.02 12:00</dd>
            </div>
          </dl>

          <div className="submit-security">
            <LockKeyhole aria-hidden="true" />
            <span>提交接口带幂等键；服务器时间晚于截止时间会直接拒绝。</span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={locked}
            onClick={() => setPreviewOpen(true)}
          >
            {state.application ? "预览并提交新版本" : "预览并提交申请"}
            <Send aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            disabled={locked}
            onClick={() => notify("草稿已保存在本机浏览器。", "info")}
          >
            保存草稿
          </button>

          {state.application && (
            <div className="saved-version">
              <Clock3 aria-hidden="true" />
              <span>
                <strong>v{state.application.version} 已提交</strong>
                <small>{formatDateTime(state.application.submittedAt)}</small>
              </span>
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="提交前，再确认一次"
        description="提交后会立即生成本轮申请版本，并在截止前保持可修改。"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPreviewOpen(false)}>
              返回修改
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              <CheckCircle2 aria-hidden="true" />
              确认提交
            </button>
          </>
        }
      >
        <div className="preview-summary">
          <div className="preview-head">
            <span className="preview-icon">
              <Sparkles aria-hidden="true" />
            </span>
            <div>
              <h3>{STUDENT.name} 的第 3 阶段申请</h3>
              <p>{STUDENT.grade} · {STUDENT.major} · {STUDENT.studentNo}</p>
            </div>
          </div>
          <div className="preview-unit-list">
            {selectedUnits.map((unit, index) => (
              <div key={unit.id}>
                <span>0{index + 1}</span>
                <strong>{unit.name}</strong>
                <small>{unit.direction}</small>
              </div>
            ))}
          </div>
          <div className="preview-checks">
            <CheckLine>实训室内调剂：{state.adjustments.internal ? "已授权" : "未授权"}</CheckLine>
            <CheckLine>全院跨实训室调剂：{state.adjustments.cross ? "已授权" : "未授权"}</CheckLine>
            <CheckLine>材料真实性与承诺声明已确认</CheckLine>
          </div>
          <p className="preview-footnote">提交后，系统会保存本次意向组合、授权状态与版本号。</p>
        </div>
      </Modal>
    </div>
  );
}
