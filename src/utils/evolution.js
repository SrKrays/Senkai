// Combina el progreso del Tracker (hábitos + objetivos), Entrenamiento (marcas de
// peso/reps) y Nutrición (comidas registradas) en un único puntaje 0-100 que mueve
// la evolución de Vegeta. Se usa en Tracker, Entrenamiento y Nutrición para que las
// tres pantallas muestren siempre la misma etapa.
export function combinedEvolutionScore(...scores) {
  const flat = scores.flat().filter((s) => typeof s === "number" && !Number.isNaN(s));
  if (flat.length === 0) return 0;
  const avg = flat.reduce((sum, s) => sum + s, 0) / flat.length;
  return Math.round(avg * 100);
}

/** Etapa de `vegetaEvolution` (mockData) según un puntaje 0-100. */
export function getVegetaStage(score, vegetaEvolution) {
  let current = vegetaEvolution[0];
  let next = vegetaEvolution[1];
  for (let i = 0; i < vegetaEvolution.length; i++) {
    if (score >= vegetaEvolution[i].minScore) {
      current = vegetaEvolution[i];
      next = vegetaEvolution[i + 1] || null;
    }
  }
  const span = next ? next.minScore - current.minScore : 1;
  const into = next ? Math.min(1, (score - current.minScore) / span) : 1;
  return { current, next, progress: into };
}
