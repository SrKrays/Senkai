import { useEffect, useRef } from "react";
import gsap from "gsap";

// Genera el path de una estrella de 5 puntas centrada en (cx, cy) con radio
// exterior `r` — 10 puntos alternando radio exterior e interior cada 36°.
function starPath(cx, cy, r) {
  const inner = r * 0.42;
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

// Misma disposición que la Esfera de 4 estrellas de Goku: una más grande
// arriba (bien más grande, no solo un poco) y tres chicas apretadas en
// cluster justo debajo — el contraste de tamaño es lo que la hace
// reconocible como la esfera real en vez de "4 estrellas cualquiera".
const STARS = [
  { x: 50, y: 38, r: 10 },
  { x: 40, y: 60, r: 4.3 },
  { x: 50, y: 64, r: 4.3 },
  { x: 60, y: 60, r: 4.3 },
];

// Esfera del Dragón dibujada a mano en SVG (línea, no relleno) — el recurso
// visual que vimos de referencia en vin-path.vercel.app: un ícono grande de
// fondo que da identidad sin sumar una palabra de texto. Reconstruida con
// GSAP (a pedido): se "dibuja" sola con la técnica clásica de
// strokeDasharray/strokeDashoffset + getTotalLength, y después flota (y
// opcionalmente gira) en loop infinito. El color sale de `currentColor` —
// controlalo con una clase de texto (text-maroon, text-teal, etc.) desde
// donde se usa.
export default function DragonBallSvg({
  className = "",
  size = 220,
  rotate = false,
  floatDistance = 10,
  floatDuration = 5,
  delay = 0,
}) {
  const circleRef = useRef(null);
  const starRefs = useRef([]);
  const groupRef = useRef(null);

  useEffect(() => {
    const circle = circleRef.current;
    const stars = starRefs.current.filter(Boolean);
    const group = groupRef.current;
    if (!circle || !group) return undefined;

    const ctx = gsap.context(() => {
      const drawables = [circle, ...stars];
      drawables.forEach((el) => {
        const length = el.getTotalLength();
        gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
      });

      const tl = gsap.timeline({ delay });
      tl.to(circle, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out" });
      stars.forEach((el, i) => {
        tl.to(el, { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }, 0.4 + i * 0.15);
      });

      gsap.to(group, {
        y: -floatDistance,
        duration: floatDuration / 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay + 1.4,
      });

      if (rotate) {
        gsap.to(group, {
          rotate: 360,
          transformOrigin: "50% 50%",
          duration: floatDuration * 6,
          ease: "none",
          repeat: -1,
        });
      }
    });

    return () => ctx.revert();
  }, [rotate, floatDistance, floatDuration, delay]);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
      <g ref={groupRef}>
        <circle ref={circleRef} cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2" />
        {STARS.map((s, i) => (
          <path
            key={i}
            ref={(el) => (starRefs.current[i] = el)}
            d={starPath(s.x, s.y, s.r)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}
