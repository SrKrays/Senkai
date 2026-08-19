import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "./CountUp";

// Marco reutilizable para todo el arte de personajes (Vegeta, Goku, premios).
// Recorta con object-fit: cover a un punto focal fijo (por defecto, centrado y
// cargado hacia arriba, donde suele estar la cabeza) para que cualquier imagen
// de origen — sin importar su encuadre o relación de aspecto real — se vea
// consistente dentro del mismo marco, en vez de "flotar" con espacios vacíos
// (object-contain) o mostrar fondos/marcas de agua de más. Un degradado sutil
// abajo disimula recortes imperfectos del original.
// `focal` = CSS object-position (ej: "50% 10%"). Ajustable por imagen si hace
// falta corregir el encuadre de un personaje puntual.
export function CharacterArt({ src, alt, size = 224, width, height, focal = "50% 8%", fit = "cover" }) {
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
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.035 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="hud char-glow relative shrink-0 border border-line bg-cream/40"
      style={{ width: w, height: h }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
        <img
          src={src}
          alt={alt}
          onError={() => setBroken(true)}
          className="h-full w-full"
          style={{ objectFit: fit, objectPosition: focal }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-paper/80 to-transparent" />
      </div>
    </motion.div>
  );
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <p className="eyebrow mb-2 text-maroon">{eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl leading-none tracking-wide text-ink">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}

export function Card({ children, className = "", hud = true, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`${hud ? "hud" : ""} border border-line bg-card p-5 text-ink ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// `value` acepta un número (se anima con CountUp) o directamente un string
// ya formateado (se muestra tal cual, sin animar) — compatibilidad con
// llamadas existentes que arman el texto ellas mismas.
export function StatPill({ label, value, suffix = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="hud border border-line bg-card px-4 py-3 text-ink"
    >
      <p className="eyebrow mb-1">{label}</p>
      <p className="font-mono text-2xl font-semibold text-maroon">
        {typeof value === "number" ? (
          <>
            <CountUp value={value} />
            {suffix}
          </>
        ) : (
          value
        )}
      </p>
    </motion.div>
  );
}

export function ProgressBar({ progress, tone = "maroon" }) {
  const pct = Math.round(progress * 100);
  const barColor = tone === "teal" ? "bg-teal shadow-glow-teal" : "bg-maroon shadow-glow-sm";
  return (
    <div>
      <div className="h-2 w-full overflow-hidden bg-line/60">
        <motion.div
          className={`bar-shimmer h-2 ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
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
