// Celebraciones — ráfagas de confetti con los colores de la paleta Senkai.
// Se usan en momentos de logro real: nueva PR, objetivo cumplido, reto
// grupal ganado, y en el overlay de Level Up.
import confetti from "canvas-confetti";

const COLORS = ["#E51E3A", "#FF2448", "#D9A441", "#3AAEEC", "#F5F5F5"];

export function fireConfetti(opts = {}) {
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.65 },
    colors: COLORS,
    ...opts,
  });
}

// Ráfaga más grande, en dos tandas — reservada para el Level Up (cambio de
// transformación de Vegeta), el momento más importante de la app.
export function fireBigConfetti() {
  fireConfetti({ particleCount: 150, spread: 100, startVelocity: 48, origin: { y: 0.5 } });
  setTimeout(() => {
    fireConfetti({ particleCount: 90, spread: 130, startVelocity: 35, origin: { x: 0.2, y: 0.4 } });
    fireConfetti({ particleCount: 90, spread: 130, startVelocity: 35, origin: { x: 0.8, y: 0.4 } });
  }, 220);
}
