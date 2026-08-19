import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CharacterArt } from "./ui";
import { usePoints } from "../context/PointsContext";
import { useCharacter } from "../context/CharacterContext";
import { fireBigConfetti } from "../utils/confetti";

// El momento más grande de la app — se dispara solo, desde cualquier
// pantalla, cuando el Power Level real cruza el umbral de la siguiente
// transformación (ver PointsContext). Fullscreen, con confetti y el
// personaje nuevo entrando en grande — usa el arte custom del usuario si lo
// tiene configurado, si no cae al Vegeta de esa etapa (CharacterContext).
export default function LevelUpOverlay() {
  const { levelUpLevel, clearLevelUp } = usePoints();
  const { stages } = useCharacter();
  const levelUpStage = levelUpLevel !== null ? stages[levelUpLevel] : null;

  useEffect(() => {
    if (levelUpStage) fireBigConfetti();
  }, [levelUpStage]);

  return (
    <AnimatePresence>
      {levelUpStage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={clearLevelUp}
          className="fixed inset-0 z-50 flex items-center justify-center bg-paper/90 backdrop-blur-sm"
        >
          <div className="scanlines" />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-5 px-6 text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="neon-text-gold font-mono text-xs uppercase tracking-widest2 text-gold"
            >
              Nueva transformación desbloqueada
            </motion.p>

            <div className="aura-pulse relative">
              <CharacterArt src={levelUpStage.img} alt={levelUpStage.name} width={220} height={340} focal="50% 8%" />
            </div>

            <div>
              <h2 className="neon-text font-display text-5xl tracking-wide text-maroon-light">
                {levelUpStage.name}
              </h2>
              <p className="mt-1 font-mono text-sm uppercase tracking-widest2 text-teal-light">
                {levelUpStage.tag}
              </p>
            </div>

            <button
              onClick={clearLevelUp}
              className="mt-2 border border-maroon/40 px-6 py-2.5 font-mono text-xs uppercase tracking-widest2 text-maroon transition-all duration-250 hover:bg-maroon hover:text-paper hover:shadow-glow"
            >
              Continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
