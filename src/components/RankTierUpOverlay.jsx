import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTraining } from "../context/TrainingContext";
import { fireBigConfetti } from "../utils/confetti";

// Tier-up de rango por ejercicio (Fase 9 v2, Capa 9) — mismo lenguaje visual
// que LevelUpOverlay (fullscreen, scanlines, blur, neón) pero con la data del
// rango: ejercicio, transformación anterior → nueva, PR y ritmo de mejora.
// Vive aparte de LevelUpOverlay porque dispara por otro evento (subir de
// etapa en UN ejercicio, no el Power Level global) y puede convivir con él.
export default function RankTierUpOverlay() {
  const { pendingTierUp, clearTierUp } = useTraining();

  useEffect(() => {
    if (pendingTierUp) fireBigConfetti();
  }, [pendingTierUp]);

  return (
    <AnimatePresence>
      {pendingTierUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={clearTierUp}
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
              Rango superado — {pendingTierUp.exerciseName}
            </motion.p>

            <div className="aura-pulse relative flex flex-col items-center gap-2">
              {pendingTierUp.previousTierName && (
                <span className="font-mono text-sm uppercase tracking-widest2 text-ink/40 line-through">
                  {pendingTierUp.previousTierName}
                </span>
              )}
              <h2 className="neon-text font-display text-5xl tracking-wide text-maroon-light">
                {pendingTierUp.tierName}
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs uppercase tracking-widest2 text-teal-light">
              {pendingTierUp.prKg != null && <span>PR: {pendingTierUp.prKg}kg</span>}
              {pendingTierUp.growthPct != null && (
                <span>
                  Ritmo: {pendingTierUp.growthPct >= 0 ? "+" : ""}
                  {pendingTierUp.growthPct.toFixed(1)}%
                </span>
              )}
            </div>

            <button
              onClick={clearTierUp}
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
