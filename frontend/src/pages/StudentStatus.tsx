import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmOfferDialog } from "../components/ConfirmOfferDialog";
import { OfferCard } from "../components/OfferCard";
import { Callout, PageHeader, ScorePill, SectionTitle, StatusBadge } from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { useApp } from "../store";
import { cn } from "../utils";

export function StudentStatus() {
  const { state } = useApp();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const pending = state.offers.filter((offer) => offer.status === "pending");
  const confirmed = state.offers.find((offer) => offer.status === "confirmed");
  const superseded = state.offers.filter((offer) => offer.status === "superseded");
  const completed = state.interviews.filter((item) => item.status === "done").length;
  const average = Math.round(
    state.interviews.reduce((sum, item) => sum + (item.score ?? 0), 0) /
      Math.max(1, completed),
  );

  return (
    <div className="status-page">
      <PageHeader
        eyebrow={<>面试与结果 · 第 {stage.number} 阶段</>}
        title="每一步，都留下清楚的记录。"
        description="面试评分只对本人可见。若收到多个拟录取，你只能确认一个方向。"
        actions={
          <StatusBadge tone={confirmed ? "sage" : pending.length ? "coral" : "neutral"}>
            {confirmed ? "去向已确认" : pending.length ? `${pending.length} 个待确认` : "暂无待办"}
          </StatusBadge>
        }
      />

      {pending.length > 0 && !state.confirmedOfferId && (
        <Callout
          tone="warning"
          title={`有 ${pending.length} 个拟录取等待选择`}
          action={
            <span className="callout-hint">截止后未确认视为放弃。</span>
          }
        >
          确认一个方向后，其余拟录取立即失效，对应名额会释放给候补学生。本周期不能再次修改。
        </Callout>
      )}

      {confirmed && (
        <Callout
          tone="success"
          title="唯一去向已写入"
          action={
            <Link to="/student/results" className="btn btn-secondary btn-small">
              查看公示
              <ArrowRight aria-hidden="true" />
            </Link>
          }
        >
          你已确认 {UNITS.find((unit) => unit.id === confirmed.unitId)?.name}。学院校验完成后会生成公示名单。
        </Callout>
      )}

      <section className="status-summary">
        <div className="status-summary-main">
          <span className="eyebrow">我的面试</span>
          <h2>{completed} 场完成</h2>
          <p>平均评分 {average} 分 · 结果按实训室分别评定</p>
        </div>
        <dl className="status-facts">
          <div>
            <dt>平行意向</dt>
            <dd>{state.selectedUnitIds.length}</dd>
          </div>
          <div>
            <dt>拟录取</dt>
            <dd>{state.offers.length}</dd>
          </div>
          <div>
            <dt>当前阶段</dt>
            <dd>{stage.short}</dd>
          </div>
        </dl>
      </section>

      {(pending.length > 0 || confirmed) && (
        <section className="section-block">
          <SectionTitle
            title={confirmed ? "已确认去向" : "待确认拟录取"}
            description="单一拟录取会自动确认；多个拟录取必须手动选择，系统不会替你做决定。"
          />
          <div className="offer-grid">
            {pending.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onConfirm={setConfirmId} />
            ))}
            {confirmed && <OfferCard offer={confirmed} compact />}
          </div>
          {superseded.length > 0 && (
            <div className="superseded-note">
              <Info aria-hidden="true" />
              <span>另外 {superseded.length} 个拟录取已失效，名额已释放。记录仍保留，供你回看。</span>
            </div>
          )}
        </section>
      )}

      <section className="section-block">
        <SectionTitle
          title="面试记录"
          description="按面试时间排序。如有缺面或记录异常，请联系学院教务老师。"
        />
        <ol className="interview-timeline">
          {state.interviews.map((interview, index) => {
            const unit = UNITS.find((item) => item.id === interview.unitId);
            return (
              <li className="interview-row" key={interview.id}>
                <span className={cn("interview-index", interview.status === "done" && "is-done")}>
                  {interview.status === "done" ? <CheckCircle2 aria-hidden="true" /> : `0${index + 1}`}
                </span>
                <div className="interview-copy">
                  <div>
                    <strong>{unit?.name}</strong>
                    <StatusBadge tone={interview.status === "done" ? "sage" : "neutral"} dot={false}>
                      {interview.status === "done" ? "已完成" : "待进行"}
                    </StatusBadge>
                  </div>
                  <p>{unit?.direction} · 面试官 {interview.interviewer}</p>
                  <span>
                    <CalendarCheck2 aria-hidden="true" /> {interview.dateLabel} {interview.time}
                    <MapPin aria-hidden="true" /> {interview.location}
                  </span>
                </div>
                <div className="interview-result">
                  <ScorePill score={interview.score} />
                  <small>面试评分</small>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="section-grid rule-grid">
        <article className="rule-card">
          <span className="rule-icon"><Sparkles aria-hidden="true" /></span>
          <h3>单一拟录取</h3>
          <p>只有一个有效拟录取时，系统自动确认，并记录确认时间。学生仍可查看培养安排。</p>
        </article>
        <article className="rule-card">
          <span className="rule-icon"><Clock3 aria-hidden="true" /></span>
          <h3>多个拟录取</h3>
          <p>必须由学生手动选择一个方向。其他拟录取立即失效，不允许同时保留。</p>
        </article>
      </section>

      <ConfirmOfferDialog
        offerId={confirmId}
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
      />
    </div>
  );
}
