import { Check, Info, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { UNITS } from "../data";
import { useApp } from "../store";
import { formatShortDate } from "../utils";
import { CheckLine, Modal, StatusBadge, UnitGlyph } from "./Ui";

export function ConfirmOfferDialog({
  offerId,
  open,
  onClose,
}: {
  offerId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state, confirmOffer } = useApp();
  const offer = state.offers.find((item) => item.id === offerId);
  const unit = UNITS.find((item) => item.id === offer?.unitId);
  const otherPending = useMemo(
    () => state.offers.filter((item) => item.status === "pending" && item.id !== offerId),
    [offerId, state.offers],
  );

  if (!offer || !unit) return null;

  const handleConfirm = async () => {
    if (await confirmOffer(offer.id)) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`确认去向：${unit.name}`}
      description="请核对方向、导师与培养安排。确认后将写入唯一去向。"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            再想想
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            <Check aria-hidden="true" />
            确认这个去向
          </button>
        </>
      }
    >
      <div className="confirm-unit">
        <UnitGlyph glyph={unit.glyph} tone={unit.tone} size="lg" />
        <div>
          <div className="confirm-unit-title">
            <h3>{unit.direction}</h3>
            <StatusBadge tone="coral">待确认</StatusBadge>
          </div>
          <p>
            {unit.mentor} · {unit.mentorTitle}
          </p>
          <span>面试评分 {offer.score} 分 · 截止 {formatShortDate(offer.deadline)}</span>
        </div>
      </div>

      <div className="confirm-facts">
        <CheckLine>{unit.training}</CheckLine>
        <CheckLine>{unit.assessment}</CheckLine>
        <CheckLine>确认后仍可查看面试记录与最终公示信息。</CheckLine>
      </div>

      {otherPending.length > 0 && (
        <div className="confirm-warning">
          <Info aria-hidden="true" />
          <div>
            <strong>另外 {otherPending.length} 个拟录取会立即失效</strong>
            <p>对应实训室名额将释放给候补学生。本周期内不能再次修改已确认去向。</p>
          </div>
        </div>
      )}

      <div className="confirm-security">
        <ShieldCheck aria-hidden="true" />
        正式系统会在同一事务中校验名额、唯一性和截止时间，并拦截并发重复确认。
      </div>
    </Modal>
  );
}
