// Marca Senkai — insignia diamante roja con silueta de dragón (low-poly,
// trazo angular a propósito, para que combine con el resto del sistema HUD:
// "sin bordes redondeados, líneas finas"). No es ningún personaje registrado,
// es un dragón genérico hecho a medida para el logo.
const DRAGON_PATH =
  "M10 60 L24 54 L28 42 L32 54 L40 50 L44 38 L48 50 L50 36 L60 14 L56 34 L70 26 L92 42 L76 50 L88 60 L66 56 L46 68 L26 62 Z";

export function DragonMark({ size = 22, className = "" }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="currentColor">
      <path d={DRAGON_PATH} />
    </svg>
  );
}

// Insignia diamante — usar `badgeSize` para el tamaño del rombo y `iconSize`
// para el dragón adentro (se contra-rota para quedar derecho).
export function LogoBadge({ badgeSize = 36, iconSize, className = "" }) {
  const icon = iconSize ?? Math.round(badgeSize * 0.52);
  return (
    <span
      className={`flex shrink-0 rotate-45 items-center justify-center border border-maroon-light/40 bg-gradient-to-br from-maroon-light to-maroon-dark shadow-glow ${className}`}
      style={{ width: badgeSize, height: badgeSize, borderRadius: Math.max(4, badgeSize * 0.16) }}
    >
      <DragonMark size={icon} className="-rotate-45 text-paper" />
    </span>
  );
}

// Wordmark completo — insignia + "SENKAI" + subtítulo katakana. `stacked`
// controla si el texto va al lado (sidebar/header) o el logo solo (íconos chicos).
export default function Logo({ badgeSize = 36, textSize = "text-2xl", showSubtitle = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoBadge badgeSize={badgeSize} />
      <div>
        <span className={`block font-display leading-none tracking-widest2 text-maroon-light ${textSize}`}>
          SENKAI
        </span>
        {showSubtitle && <span className="block font-mono text-[9px] tracking-widest2 text-muted">センカイ</span>}
      </div>
    </div>
  );
}
