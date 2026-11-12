import { Check } from "lucide-react";
import { STAGES } from "../data";
import type { StageKey } from "../types";
import { cn } from "../utils";

export function StageRail({
  current,
  compact = false,
  onSelect,
}: {
  current: StageKey;
  compact?: boolean;
  onSelect?: (stage: StageKey) => void;
}) {
  const currentIndex = STAGES.findIndex((stage) => stage.key === current);
  return (
    <ol className={cn("stage-rail", compact && "stage-rail--compact")} aria-label="选拔流程">
      {STAGES.map((stage, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const content = (
          <>
            <span className="stage-dot" aria-hidden="true">
              {isDone ? <Check /> : stage.number}
            </span>
            <span className="stage-copy">
              <span>{stage.label}</span>
            </span>
          </>
        );
        return (
          <li
            key={stage.key}
            className={cn("stage-item", isDone && "is-done", isCurrent && "is-current")}
          >
            {onSelect ? (
              <button
                type="button"
                className="stage-button"
                onClick={() => onSelect(stage.key)}
                aria-current={isCurrent ? "step" : undefined}
              >
                {content}
              </button>
            ) : (
              <div className="stage-static" aria-current={isCurrent ? "step" : undefined}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
