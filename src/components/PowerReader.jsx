import { useEffect, useState } from "react";

/**
 * PowerReader — el elemento de firma de la app.
 * Un lector de poder tipo "scouter": número que hace count-up con
 * brackets tipo HUD. Se reutiliza en tamaño grande (hero) y chico (motivo).
 */
export default function PowerReader({ value, label = "POWER LEVEL", size = "lg" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const isLg = size === "lg";

  return (
    <div className={`hud shadow-glow inline-flex items-center gap-3 border border-maroon px-4 ${isLg ? "py-3" : "py-1.5"} text-maroon bg-card`}>
      <span className="h-1.5 w-1.5 shrink-0 animate-tick bg-teal" />
      <div className="flex flex-col">
        <span className={`eyebrow text-maroon/70 ${isLg ? "" : "text-[9px]"}`}>{label}</span>
        <span
          className={`font-mono tabular-nums leading-none ${
            isLg ? "text-4xl md:text-5xl font-semibold" : "text-lg font-semibold"
          }`}
        >
          {display.toLocaleString("es-AR")}
        </span>
      </div>
    </div>
  );
}
