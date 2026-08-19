import { useEffect, useState } from "react";

// Contador animado reutilizable — extraído de PowerReader para poder usarlo
// en cualquier stat numérica grande (racha, entrenos, PR, Power Level de
// grupo, etc.) y que todas "suban" al cargar en vez de aparecer de golpe.
export default function CountUp({ value, duration = 900, format = (n) => n.toLocaleString("es-AR"), className = "" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + eased * (value - from)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
