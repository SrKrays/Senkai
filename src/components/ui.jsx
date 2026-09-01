import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="hud char-glow relative shrink-0 border border-line bg-cream/40"
      style={{ width: w, height: h }}
    >
      {/* Respiración sutil — la imagen ya cargada flota y escala apenas en
          loop infinito, así el personaje se siente "vivo" sin necesitar
          frames nuevos. Vive en un wrapper aparte del de arriba para que el
          fade-in de montaje (una vez) y el loop (infinito) no se pisen. */}
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-[inherit]"
        animate={{ y: [0, -4, 0], scale: [1, 1.015, 1] }}
        whileHover={{ scale: 1.04 }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={src}
          alt={alt}
          onError={() => setBroken(true)}
          className="h-full w-full"
          style={{ objectFit: fit, objectPosition: focal }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-paper/80 to-transparent" />
      </motion.div>
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
// `tone` — corrección de dirección (Fase 0 P1): antes CADA número de stat
// era lima sin importar qué representaba, así que nada se distinguía como
// "más importante" que el resto. Default ahora es "neutral" (blanco/ink,
// como pide el sistema semántico para "información principal, números
// importantes") — el lima queda reservado para cuando el número en
// cuestión de verdad representa una acción/energía destacada, y el resto
// de tonos para cuando el sitio de la llamada lo sepa explícitamente.
const STAT_TONE_CLS = {
  neutral: "text-ink",
  accent: "text-maroon",
  info: "text-teal",
  gold: "text-gold",
};
export function StatPill({ label, value, suffix = "", tone = "neutral" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="hud border border-line bg-card px-4 py-3 text-ink"
    >
      <p className="eyebrow mb-1">{label}</p>
      <p className={`font-mono text-2xl font-semibold ${STAT_TONE_CLS[tone] ?? STAT_TONE_CLS.neutral}`}>
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

// Título en `text-ink` (blanco), no en el acento — un estado vacío es un
// mensaje, no una acción; el lima queda para lo que sí se puede tocar.
export function EmptyState({ title, description }) {
  return (
    <div className="hud border border-dashed border-line px-6 py-14 text-center text-ink">
      <p className="font-display text-2xl tracking-wide">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}

// Tonos "gold" (logro/récord/rango) y "danger" (error/advertencia) sumados
// en la corrección de dirección — antes solo existían maroon/teal, así que
// no había forma de marcar un PR o un problema con su propio color.
const TAG_TONE_CLS = {
  maroon: "border-maroon/30 text-maroon",
  teal: "border-teal/40 text-teal-dark",
  gold: "border-gold/40 text-gold",
  danger: "border-danger/40 text-danger-light",
};
export function Tag({ children, tone = "maroon" }) {
  return (
    <span
      className={`border ${TAG_TONE_CLS[tone] ?? TAG_TONE_CLS.maroon} px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2`}
    >
      {children}
    </span>
  );
}

// ── Fase 0 — Parte 1 (Foundation) ────────────────────────────────────────
// Los cuatro elementos de abajo (Button, Input, Select, SectionHeader)
// existen para reemplazar patrones que hoy se repiten a mano, casi
// carácter por carácter, en 8-10 páginas distintas (el botón primario
// "bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2
// text-paper hover:opacity-90 hover:shadow-glow..." aparece así, copiado,
// más de 40 veces). Wireados acá no cambian ningún comportamiento — cuando
// se reemplacen los usos sueltos por estos componentes, cualquier ajuste de
// tamaño/padding/color futuro se hace en un solo lugar.

// `to` → renderiza <Link> (navegación) en vez de <button> (acción) con el
// mismo estilo — cubre el patrón que ya se repetía a mano en varios
// `action` de PageHeader (ej. "Editar mi personaje", "+ Nuevo grupo").
export function Button({
  children,
  variant = "primary", // "primary" | "secondary" | "toggle" | "danger"
  size = "md", // "sm" | "md" | "lg"
  active = false, // solo aplica a variant="toggle"
  to,
  className = "",
  ...rest
}) {
  const sizeCls =
    size === "sm" ? "px-2.5 py-1 text-[10px]" : size === "lg" ? "px-4 py-2.5 text-xs" : "px-3 py-2 text-[10px]";
  const variantCls =
    variant === "primary"
      ? "bg-maroon text-paper hover:opacity-90 hover:shadow-glow disabled:opacity-50"
      : variant === "toggle"
      ? active
        ? "bg-maroon text-paper"
        : "border border-maroon/25 text-maroon hover:bg-maroon/10"
      : variant === "danger"
      ? "border border-danger/40 text-danger-light hover:bg-danger/10 disabled:opacity-50"
      : "border border-maroon/25 text-maroon hover:bg-maroon/10 disabled:opacity-50";
  const cls = `font-mono uppercase tracking-widest2 transition-all duration-250 ${sizeCls} ${variantCls} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

// Input de texto con label visible opcional — regla 26 (accesibilidad) de
// Fase 0 Parte 1: la mayoría de los inputs de la app hoy solo tienen
// placeholder, sin label real, lo que complica entender un formulario para
// alguien que no se memorizó la app. El label es opcional a propósito —
// varios usos actuales (ej. filas de tabla) no tienen espacio para uno.
export function Input({ label, className = "", ...rest }) {
  const input = (
    <input
      className={`border border-maroon/20 bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-maroon ${className}`}
      {...rest}
    />
  );
  if (!label) return input;
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-muted">{label}</span>
      {input}
    </label>
  );
}

// Select — mismo estilo bg-paper/text-ink que ya se usaba a mano en Grupos
// y Rutinas (bg-transparent rompe el color de las opciones nativas del
// navegador sobre tema oscuro — ya lo habían resuelto ahí, esto lo
// centraliza).
export function Select({ label, className = "", children, ...rest }) {
  const select = (
    <select
      className={`border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
  if (!label) return select;
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-muted">{label}</span>
      {select}
    </label>
  );
}

// El `<p className="eyebrow mb-4">Título</p>` suelto que encabeza casi
// cada sub-sección de cada página, con un lugar central para ajustarlo.
export function SectionHeader({ children, className = "" }) {
  return <p className={`eyebrow mb-4 ${className}`}>{children}</p>;
}

// ── CharacterHero (Fase 0 P1 — corrección tras el chat con GPT) ──────────
// Cada sección con "mundo" propio (Nutrición=Goku, Rutinas=Vegeta, a futuro
// Entrenamiento=Piccolo) mostraba su personaje como una card más entre
// otras — en mobile, cuando esa card vivía en una columna lateral que solo
// aparece en xl, ni siquiera se veía sin scroll. Este componente la sube a
// ser lo primero de la pantalla, mismo lugar en todas las secciones. No
// reemplaza a CharacterArt/CharacterFlipbook (siguen siendo el render del
// arte en sí) — esto es el layout alrededor: nombre, tag, progreso y una
// acción, con `tone` controlando el acento de color de esa sección.
// `art` recibe el elemento ya armado (<CharacterFlipbook .../> o
// <CharacterArt .../>) para no acoplar este componente a una sola forma de
// mostrar el personaje.
const HERO_TONE_TEXT = {
  maroon: "text-maroon",
  teal: "text-teal",
  gold: "text-gold",
};
export function CharacterHero({ eyebrow, name, tag, art, tone = "maroon", progress, children }) {
  return (
    <Card className="relative mb-6 flex flex-col items-center gap-5 overflow-hidden py-7 text-center sm:flex-row sm:items-center sm:text-left">
      <div className="scanlines" />
      <div className="aura-pulse shrink-0">{art}</div>
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="font-display text-3xl tracking-wide text-ink sm:text-4xl">{name}</h2>
        {tag && (
          <span className={`mt-1 inline-block font-mono text-[11px] uppercase tracking-widest2 ${HERO_TONE_TEXT[tone] ?? HERO_TONE_TEXT.maroon}`}>
            {tag}
          </span>
        )}
        {progress != null && (
          <div className="mt-3 max-w-sm">
            <ProgressBar progress={progress} tone={tone === "teal" ? "teal" : "maroon"} />
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </Card>
  );
}
