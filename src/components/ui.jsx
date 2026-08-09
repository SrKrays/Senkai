import { useState } from "react";

export function CharacterArt({ src, alt, size = 224, width, height }) {
  const [broken, setBroken] = useState(false);
  const w = width ?? size;
  const h = height ?? size;
  if (!src || broken) {
    return (
      <div
        className="hud flex shrink-0 items-center justify-center border border-dashed border-line bg-cream/60 text-center"
        style={{ width: w, height: h }}
      >
        <span className="eyebrow px-3 leading-tight">
          Arte de
          <br />
          {alt}
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="hud char-glow shrink-0 border border-line bg-cream/40 object-contain"
      style={{ width: w, height: h }}
    />
  );
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="animate-fade-up mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="eyebrow mb-2 text-maroon">{eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl leading-none tracking-wide text-ink">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, className = "", hud = true, ...rest }) {
  return (
    <div
      className={`animate-fade-up ${hud ? "hud" : ""} border border-line bg-card p-5 text-ink ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function StatPill({ label, value }) {
  return (
    <div className="hud border border-line bg-card px-4 py-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className="font-mono text-2xl font-semibold text-maroon">{value}</p>
    </div>
  );
}

export function ProgressBar({ progress, tone = "maroon" }) {
  const pct = Math.round(progress * 100);
  const barColor = tone === "teal" ? "bg-teal shadow-glow-teal" : "bg-maroon shadow-glow-sm";
  return (
    <div>
      <div className="h-2 w-full overflow-hidden bg-line/60">
        <div
          className={`h-2 ${barColor} transition-[width] duration-[900ms] ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 font-mono text-xs text-muted">{pct}%</p>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="hud border border-dashed border-line px-6 py-14 text-center text-maroon">
      <p className="font-display text-2xl tracking-wide">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}

export function Tag({ children, tone = "maroon" }) {
  const cls = tone === "teal" ? "border-teal/40 text-teal-dark" : "border-maroon/30 text-maroon";
  return (
    <span className={`border ${cls} px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2`}>
      {children}
    </span>
  );
}
