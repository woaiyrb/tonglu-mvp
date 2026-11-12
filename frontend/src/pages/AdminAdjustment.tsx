import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Callout, PageHeader, SectionTitle, StatusBadge } from "../components/Ui";
import { useApp } from "../store";
import { cn } from "../utils";

const priorityCopy: Record<1 | 2 | 3, { title: string; detail: string }> = {
  1: { title: "实训室内调剂", detail: "同一实训室不同方向之间优先匹配。" },
  2: { title: "跨实训室调剂", detail: "仅在学生授权后进入匹配。" },
  3: { title: "最终统筹调剂", detail: "前两级未匹配时，由学院统一处理。" },
};

export function AdminAdjustment() {
  const { state, approveAdjustment } = useApp();
  const frozen = Boolean(state.frozenAt);
  const sorted = [...state.adjustmentQueue].sort((a, b) => a.priority - b.priority);
  const pending = sorted.filter((item) => item.status === "待处理").length;
  const generated = sorted.filter((item) => item.status === "已生成").length;
  const unauthorized = sorted.filter((item) => !item.authorized).length;

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="统筹调剂"
        title="先按授权，再按优先级。"
        description="调剂分三级顺序处理。未取得学生授权的跨实训室调剂，必须经学院审批后才能生成记录。"
        actions={<StatusBadge tone={pending ? "coral" : "sage"}>{pending} 条待处理</StatusBadge>}
      />

      {unauthorized > 0 && (
        <Callout
          tone="warning"
          title={`${unauthorized} 条调剂缺少学生授权`}
          action={<span className="callout-hint">需学院负责人审批</span>}
        >
          未经授权的调剂不能直接生效。点击“审批并调剂”后，系统会同时记录审批人与调剂结果。
        </Callout>
      )}

      <section className="adjustment-summary">
        <div><span className="summary-icon summary-icon--coral"><SlidersHorizontal aria-hidden="true" /></span><strong>{pending}</strong><small>待处理</small></div>
        <div><span className="summary-icon summary-icon--sage"><CheckCircle2 aria-hidden="true" /></span><strong>{generated}</strong><small>已生成</small></div>
        <div><span className="summary-icon summary-icon--sky"><ShieldCheck aria-hidden="true" /></span><strong>{state.adjustmentQueue.filter((item) => item.authorized).length}</strong><small>已授权</small></div>
        <div><span className="summary-icon summary-icon--rose"><ShieldAlert aria-hidden="true" /></span><strong>{unauthorized}</strong><small>需审批</small></div>
      </section>

      <section className="section-block">
        <SectionTitle title="三级匹配顺序" description="每一级处理完成后，再进入下一级。" />
        <div className="priority-grid">
          {([1, 2, 3] as const).map((priority) => (
            <div className="priority-card" key={priority}>
              <span>0{priority}</span>
              <strong>{priorityCopy[priority].title}</strong>
              <p>{priorityCopy[priority].detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <SectionTitle title="调剂队列" description="先处理优先级 1，再依次向下。已生成的记录不可重复提交。" />
        <div className="adjustment-list">
          {sorted.map((item) => (
            <article className={cn("adjustment-row", item.status === "已生成" && "is-done")} key={item.id}>
              <span className={cn("priority-badge", `priority-badge--${item.priority}`)}>P{item.priority}</span>
              <div className="adjustment-person">
                <strong>{item.studentName}</strong>
                <small>{item.studentNo}</small>
              </div>
              <div className="adjustment-route">
                <span>{item.source}</span>
                <ArrowRight aria-hidden="true" />
                <strong>{item.target}</strong>
              </div>
              <div className="adjustment-auth">
                <StatusBadge tone={item.authorized ? "sage" : "coral"} dot={false}>
                  {item.authorized ? "已授权" : "需审批"}
                </StatusBadge>
                <small>{item.note}</small>
              </div>
              <div className="adjustment-action">
                {item.status === "已生成" ? (
                  <span className="generated-label"><CheckCircle2 aria-hidden="true" /> 已生成</span>
                ) : (
                  <button
                    type="button"
                    className={cn("btn", item.authorized ? "btn-secondary" : "btn-primary", "btn-small")}
                    disabled={frozen}
                    onClick={() => approveAdjustment(item.id)}
                  >
                    {frozen ? <><LockKeyhole aria-hidden="true" /> 已冻结</> : item.authorized ? "生成调剂记录" : "审批并调剂"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="rule-note">
        <ShieldCheck aria-hidden="true" />
        <span><strong>不会跳过授权。</strong> 系统只把已授权学生放进自动匹配；未授权记录停留在“需审批”，审批人与理由写入审计日志。</span>
      </div>
    </div>
  );
}
