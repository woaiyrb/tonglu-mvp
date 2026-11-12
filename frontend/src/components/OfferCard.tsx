import { ArrowRight, CalendarClock, Check, MapPin } from "lucide-react";
import { UNITS } from "../data";
import { useApp } from "../store";
import type { Offer } from "../types";
import { cn, formatShortDate } from "../utils";
import { StatusBadge, UnitGlyph } from "./Ui";

const statusMap = {
  pending: { label: "待确认", tone: "coral" as const },
  confirmed: { label: "已确认", tone: "sage" as const },
  superseded: { label: "已失效", tone: "neutral" as const },
  declined: { label: "已拒绝", tone: "danger" as const },
  expired: { label: "已过期", tone: "neutral" as const },
};

export function OfferCard({
  offer,
  onConfirm,
  compact = false,
}: {
  offer: Offer;
  onConfirm?: (id: string) => void;
  compact?: boolean;
}) {
  const { state } = useApp();
  const unit = UNITS.find((item) => item.id === offer.unitId);
  if (!unit) return null;
  const meta = statusMap[offer.status];
  const isPending = offer.status === "pending" && !state.confirmedOfferId;

  return (
    <article className={cn("offer-card", `offer-card--${offer.status}`, compact && "offer-card--compact")}>
      <div className="offer-card-head">
        <UnitGlyph glyph={unit.glyph} tone={unit.tone} size="sm" />
        <div className="offer-card-title">
          <div>
            <strong>{unit.name}</strong>
            <span>{unit.direction}</span>
          </div>
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </div>
      </div>

      <div className="offer-card-body">
        <p>{offer.note}</p>
        <dl className="mini-facts">
          <div>
            <dt>导师</dt>
            <dd>{unit.mentor}</dd>
          </div>
          <div>
            <dt>面试评分</dt>
            <dd>{offer.score} 分</dd>
          </div>
          <div>
            <dt>截止时间</dt>
            <dd>{formatShortDate(offer.deadline)}</dd>
          </div>
        </dl>
        {!compact && (
          <div className="offer-meta-line">
            <span>
              <MapPin aria-hidden="true" /> {unit.location}
            </span>
            <span>
              <CalendarClock aria-hidden="true" /> 组会 {unit.schedule}
            </span>
          </div>
        )}
      </div>

      {isPending && onConfirm && (
        <button type="button" className="btn btn-primary offer-confirm" onClick={() => onConfirm(offer.id)}>
          选择这个去向
          <ArrowRight aria-hidden="true" />
        </button>
      )}
      {offer.status === "confirmed" && (
        <div className="offer-confirmed-note">
          <Check aria-hidden="true" />
          这是你的唯一确认去向
        </div>
      )}
    </article>
  );
}
