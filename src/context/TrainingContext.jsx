import { createContext, useContext, useMemo, useState } from "react";
import {
  exercises as initialExercises,
  progressLog as initialProgressLog,
  powerScale,
} from "../data/mockData";

// El bench press (Press banca) es el ejercicio que mueve la escala de poder —
// coincide con la escala definida en mockData ("≥Xkg banca"). Si se borra
// este ejercicio, la escala simplemente cae a 0kg / Guerrero Base.
const POWER_EXERCISE_ID = "bench";

// Cuánto tiene que crecer el peso o las reps respecto al primer registro
// para "llenar" el 100% de su aporte al puntaje de entrenamiento.
const GROWTH_TARGET = 0.2; // 20%

const TrainingContext = createContext(null);

/** Etapa de la escala de poder según los kg actuales (misma lógica que el Tracker, pero por kg). */
function getPowerStage(kg) {
  let stageIndex = 0;
  for (let i = 0; i < powerScale.length; i++) {
    if (kg >= powerScale[i].threshold) stageIndex = i;
  }
  const stage = powerScale[stageIndex];
  const next = powerScale[stageIndex + 1] || null;
  const span = next ? next.threshold - stage.threshold : 1;
  const progressToNext = next ? Math.min(1, (kg - stage.threshold) / span) : 1;
  return { stageIndex, stage, next, progressToNext };
}

function clampGrowth(first, last) {
  if (!first) return 0;
  return Math.max(0, Math.min(1, (last - first) / (first * GROWTH_TARGET)));
}

export function TrainingProvider({ children }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [progressLog, setProgressLog] = useState(initialProgressLog);

  function marksFor(list, exerciseId) {
    return list.filter((p) => p.exerciseId === exerciseId).sort((a, b) => a.date.localeCompare(b.date));
  }

  function recomputeExercise(list, exerciseId, unit) {
    const marks = marksFor(list, exerciseId);
    if (marks.length === 0) return { pr: 0, trend: "Sin marcas" };
    const pr = Math.max(...marks.map((m) => m.weight));
    const last = marks[marks.length - 1];
    const prev = marks[marks.length - 2];
    const trend = prev
      ? `${last.weight - prev.weight >= 0 ? "+" : ""}${last.weight - prev.weight}${unit ?? ""} última marca`
      : "Primera marca";
    return { pr, trend };
  }

  function recomputeAffected(nextLog, exerciseIds) {
    setExercises((prevEx) =>
      prevEx.map((e) => {
        if (!exerciseIds.has(e.id)) return e;
        const { pr, trend } = recomputeExercise(nextLog, e.id, e.unit);
        return { ...e, pr, trend };
      })
    );
  }

  function addExercise({ name, muscle, unit }) {
    if (!name.trim()) return;
    const id = `ex-${Date.now()}`;
    setExercises((prev) => [
      ...prev,
      { id, name: name.trim(), muscle: muscle.trim() || "General", unit: unit.trim() || "kg", pr: 0, trend: "Sin marcas" },
    ]);
    return id;
  }

  function deleteExercise(id) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    setProgressLog((prev) => prev.filter((p) => p.exerciseId !== id));
  }

  function addProgress({ exerciseId, weight, reps, date, spotted }) {
    const numWeight = Number(weight) || 0;
    const numReps = Number(reps) || 0;
    if (!exerciseId || (numWeight <= 0 && numReps <= 0)) return;
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    const entry = {
      id: Date.now(),
      date: date || new Date().toISOString().slice(0, 10),
      exerciseId,
      exercise: exercise.name,
      muscle: exercise.muscle,
      weight: numWeight,
      reps: numReps,
      spotted: !!spotted,
    };
    setProgressLog((prev) => {
      const nextLog = [...prev, entry];
      recomputeAffected(nextLog, new Set([exerciseId]));
      return nextLog;
    });
  }

  function updateProgress(id, patch) {
    setProgressLog((prev) => {
      const old = prev.find((p) => p.id === id);
      if (!old) return prev;
      const merged = { ...old, ...patch };
      if (patch.weight !== undefined) merged.weight = Number(patch.weight) || 0;
      if (patch.reps !== undefined) merged.reps = Number(patch.reps) || 0;
      if (patch.exerciseId && patch.exerciseId !== old.exerciseId) {
        const ex = exercises.find((e) => e.id === patch.exerciseId);
        if (ex) {
          merged.exercise = ex.name;
          merged.muscle = ex.muscle;
        }
      }
      const nextLog = prev.map((p) => (p.id === id ? merged : p));
      recomputeAffected(nextLog, new Set([old.exerciseId, merged.exerciseId]));
      return nextLog;
    });
  }

  function deleteProgress(id) {
    setProgressLog((prev) => {
      const removed = prev.find((p) => p.id === id);
      const nextLog = prev.filter((p) => p.id !== id);
      if (removed) recomputeAffected(nextLog, new Set([removed.exerciseId]));
      return nextLog;
    });
  }

  const benchKg = exercises.find((e) => e.id === POWER_EXERCISE_ID)?.pr ?? 0;
  const power = useMemo(() => getPowerStage(benchKg), [benchKg]);

  // Puntaje de entrenamiento (0-1): promedio, por ejercicio con ≥2 marcas, del
  // crecimiento de PESO y de REPETICIONES respecto al primer registro. Ambas
  // cosas suman — a medida que el usuario mejora peso o reps, sube el puntaje.
  const trainingScore = useMemo(() => {
    const withProgress = exercises.filter((e) => marksFor(progressLog, e.id).length >= 2);
    if (withProgress.length === 0) return 0;
    const total = withProgress.reduce((sum, e) => {
      const marks = marksFor(progressLog, e.id);
      const first = marks[0];
      const last = marks[marks.length - 1];
      const weightGrowth = clampGrowth(first.weight, last.weight);
      const repsGrowth = clampGrowth(first.reps, last.reps);
      return sum + (weightGrowth + repsGrowth) / 2;
    }, 0);
    return total / withProgress.length;
  }, [exercises, progressLog]);

  const value = {
    exercises,
    progressLog,
    addExercise,
    deleteExercise,
    addProgress,
    updateProgress,
    deleteProgress,
    benchKg,
    powerScale,
    trainingScore,
    ...power,
  };

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error("useTraining debe usarse dentro de <TrainingProvider>");
  return ctx;
}
