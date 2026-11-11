export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark brand-mark--small" : "brand-mark"} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M8 24V12.5A4.5 4.5 0 0 1 12.5 8H25" />
        <path d="M8 16h10" />
        <path d="m20.5 4.5 4 3.5-4 3.5" />
        <path d="m10.5 21.5 4 3.5-4 3.5" />
        <path d="M19 28h6" />
      </svg>
    </span>
  );
}

export function CloudField({ dense = false }: { dense?: boolean }) {
  return (
    <div className={dense ? "cloud-field cloud-field--dense" : "cloud-field"} aria-hidden="true">
      <span className="cloud cloud--1" />
      <span className="cloud cloud--2" />
      <span className="cloud cloud--3" />
      <span className="cloud cloud--4" />
    </div>
  );
}
