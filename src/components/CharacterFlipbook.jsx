import { useEffect, useRef } from "react";
import gsap from "gsap";

// Versión "animada de verdad" de CharacterArt: en vez de una sola imagen que
// respira, cicla el array completo de frames reales (los 6 de Goku
// comiendo, los 6 de Vegeta entrenando) con un crossfade GSAP en loop
// infinito — el efecto "cuadro por cuadro" que se pidió, no un movimiento
// simulado. Mismo look (borde HUD, glow, degradado inferior) que
// CharacterArt para que no se sienta un elemento distinto.
export default function CharacterFlipbook({
  frames,
  alt = "",
  width = 200,
  height = 200,
  holdMs = 650,
  fit = "cover",
  focal = "50% 8%",
}) {
  const imgRefs = useRef([]);

  useEffect(() => {
    const imgs = imgRefs.current.filter(Boolean);
    if (imgs.length === 0) return undefined;
    if (imgs.length === 1) {
      gsap.set(imgs[0], { opacity: 1 });
      return undefined;
    }

    const holdSec = holdMs / 1000;
    const fadeSec = 0.35;
    const ctx = gsap.context(() => {
      gsap.set(imgs, { opacity: 0 });
      gsap.set(imgs[0], { opacity: 1 });

      const tl = gsap.timeline({ repeat: -1 });
      imgs.forEach((_, i) => {
        const next = (i + 1) % imgs.length;
        tl.to({}, { duration: holdSec });
        tl.to(imgs[i], { opacity: 0, duration: fadeSec, ease: "power1.inOut" }, "<");
        tl.to(imgs[next], { opacity: 1, duration: fadeSec, ease: "power1.inOut" }, "<");
      });
    });

    return () => ctx.revert();
  }, [frames, holdMs]);

  return (
    <div
      className="hud char-glow relative shrink-0 overflow-hidden border border-line bg-cream/40"
      style={{ width, height }}
    >
      {frames.map((src, i) => (
        <img
          key={src}
          ref={(el) => (imgRefs.current[i] = el)}
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          fetchPriority={i === 0 ? "high" : "low"}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: fit, objectPosition: focal, opacity: i === 0 ? 1 : 0 }}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-paper/80 to-transparent" />
    </div>
  );
}
