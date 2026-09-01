import { useEffect, useRef, useState } from "react";

// Animación tipo "flipbook" — cicla un array de frames ya generados (ej: los
// 6 recortes de Goku comiendo, los 6 de Vegeta entrenando) en loop continuo.
// No depende de canvas ni de ninguna librería nueva: solo cambia el `src`
// de una <img> a intervalos regulares. Precarga todos los frames al montar
// para que el loop no titile esperando la red la primera vuelta.
export default function SpriteLoop({
  frames,
  intervalMs = 450,
  width = 64,
  height = 64,
  alt = "",
  className = "",
}) {
  const [index, setIndex] = useState(0);
  const framesRef = useRef(frames);
  framesRef.current = frames;

  useEffect(() => {
    frames.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [frames]);

  useEffect(() => {
    if (framesRef.current.length <= 1) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % framesRef.current.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  if (!frames || frames.length === 0) return null;

  return (
    <img
      src={frames[index % frames.length]}
      alt={alt}
      width={width}
      height={height}
      draggable={false}
      className={`select-none object-contain ${className}`}
      style={{ width, height }}
    />
  );
}
