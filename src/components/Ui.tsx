import {
  Check,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Compass,
  Code2,
  Cpu,
  Database,
  Eye,
  Info,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Unit } from "../types";
import { cn } from "../utils";

const glyphs = {
  spark: Sparkles,
  database: Database,
  eye: Eye,
  code: Code2,
  chip: Cpu,
  compass: Compass,
};

export function UnitGlyph({
  glyph,
  tone = "sage",
  size = "md",
}: {
  glyph: Unit["glyph"];
  tone?: Unit["tone"];
  size?: "sm" | "md" | "lg";
}) {
  const Icon = glyphs[glyph] ?? Sparkles;
  return (
    <span className={cn("unit-glyph", `unit-glyph--${tone}`, `unit-glyph--${size}`)}>
      <Icon aria-hidden="true" />
    </span>
  );
}

type BadgeTone = "sage" | "sky" | "coral" | "rose" | "leaf" | "neutral" | "danger";

export function StatusBadge({
  children,
  tone = "neutral",
  dot = true,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  return (
    <span className={cn("badge", `badge--${tone}`)}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function OverviewBoard<T extends string>({
  items,
  active,
  onChange,
  ariaLabel,
  children,
}: {
  items: Array<{ id: T; label: string; hint: string; icon: ReactNode; badge?: number }>;
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="role-overview">
      <nav className={cn("overview-tabs", items.length === 3 && "overview-tabs--three")} role="tablist" aria-label={ariaLabel}>
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              id={`overview-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`overview-panel-${item.id}`}
              className={cn("overview-tab", selected && "is-active")}
              onClick={() => onChange(item.id)}
            >
              <span className="overview-tab-icon">{item.icon}</span>
              <span className="overview-tab-copy">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              {item.badge ? <span className="overview-tab-badge">{item.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      <div
        id={`overview-panel-${active}`}
        className="overview-stage"
        role="tabpanel"
        aria-labelledby={`overview-tab-${active}`}
        tabIndex={0}
      >
        <div className="overview-module" key={active}>{children}</div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "sage",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "sage" | "sky" | "coral" | "rose" | "leaf";
}) {
  return (
    <div className={cn("stat-card", `stat-card--${tone}`)}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "sage",
  label,
}: {
  value: number;
  tone?: "sage" | "sky" | "coral" | "leaf" | "rose";
  label?: string;
}) {
  return (
    <div
      className={cn("progress", `progress--${tone}`)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "warning"
        ? TriangleAlert
        : tone === "danger"
          ? CircleAlert
          : Info;
  return (
    <div className={cn("callout", `callout--${tone}`)}>
      <Icon className="callout-icon" aria-hidden="true" />
      <div className="callout-copy">
        <strong>{title}</strong>
        {children && <div>{children}</div>}
      </div>
      {action && <div className="callout-action">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const autofocus = dialog?.querySelector<HTMLElement>("[data-autofocus]");
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    (autofocus ?? focusable?.[0])?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cn("modal", `modal--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭弹窗">
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon ?? <CircleHelp aria-hidden="true" />}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function CheckLine({ children }: { children: ReactNode }) {
  return (
    <div className="check-line">
      <span className="check-dot">
        <Check aria-hidden="true" />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function ScorePill({ score }: { score: number | null }) {
  return (
    <span
      className={cn(
        "score-pill",
        score === null && "score-pill--empty",
        score !== null && score >= 90 && "score-pill--high",
        score !== null && score >= 85 && score < 90 && "score-pill--mid",
        score !== null && score < 85 && "score-pill--low",
      )}
    >
      {score === null ? "未评分" : `${score} 分`}
    </span>
  );
}

export function Avatar({
  initials,
  name,
  size = "md",
}: {
  initials: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span className={cn("avatar", `avatar--${size}`)} aria-label={name} title={name}>
      {initials}
    </span>
  );
}
