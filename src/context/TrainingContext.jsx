import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { powerScale } from "../data/mockData";
import { notifyPR } from "../utils/notify";
import { fireConfetti } from "../utils/confetti";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

// El ejercicio que mueve la escala de poder se detecta por NOMBRE ("Press
// banca", sin importar mayúsculas/acentos) — no por un id fijo, porque los
// ids reales que da la API son Guids random. Mismo criterio que el mock
// original, sin necesitar UI nueva para "elegir" el ejercicio de poder.
const POWER_EXERCISE_NAME = "press banca";

// Cuánto tiene que crecer el peso o las reps respecto al primer registro
// para "llenar" el 100% de su aporte al puntaje de entrenamiento.
const GROWTH_TARGET = 0.2; // 20%

const TrainingContext = createContext(null);

function normalize(s) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

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

function fromExerciseDto(e) {
  return { id: e.id, name: e.name, muscle: e.muscle, unit: e.unit };
}

function fromMarkDto(m) {
  return { id: m.id, exerciseId: m.exerciseId, date: m.date, weight: m.weight, reps: m.reps, spotted: m.spotted };
}

// Si la marca recién cargada coincide con el ejercicio del objetivo grupal
// activo, el backend manda este aviso junto con la marca — festejamos según
// si ya se cumplió la meta o recién se está aportando.
function notifyGroupGoalProgress(gp) {
  if (!gp?.matches) return;
  if (gp.achieved) {
    toast.success(`¡Objetivo grupal cumplido! ${gp.groupName} llegó a ${gp.exerciseLabel} ${gp.currentKg}kg 🎉`);
    fireConfetti();
  } else {
    toast(`Sumaste al objetivo de ${gp.groupName} — ${gp.exerciseLabel}: ${gp.currentKg}/${gp.targetKg}kg`);
  }
}

export function TrainingProvider({ children }) {
  const { token } = useAuth();
  const [rawExercises, setRawExercises] = useState([]);
  const [progressLog, setProgressLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setRawExercises([]);
      setProgressLog([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([apiFetch("/api/exercises", { token }), apiFetch("/api/progress-marks", { token })])
      .then(([exercisesRes, marksRes]) => {
        if (cancelled) return;
        setRawExercises(exercisesRes.map(fromExerciseDto));
        setProgressLog(marksRes.map(fromMarkDto));
      })
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar Entrenamiento.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

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

  // exercises "enriquecidos" con pr/trend, recalculados en cada render a
  // partir de rawExercises + progressLog (misma idea que antes, solo que
  // ahora se deriva en vez de guardarse aparte con setExercises).
  const exercises = useMemo(
    () =>
      rawExercises.map((e) => {
        const { pr, trend } = recomputeExercise(progressLog, e.id, e.unit);
        return { ...e, pr, trend };
      }),
    [rawExercises, progressLog]
  );

  async function addExercise({ name, muscle, unit }) {
    if (!name.trim()) return;
    try {
      const created = await apiFetch("/api/exercises", {
        method: "POST",
        token,
        body: { name, muscle, unit },
      });
      setRawExercises((prev) => [...prev, fromExerciseDto(created)]);
      return created.id;
    } catch {
      toast.error("No se pudo crear el ejercicio.");
    }
  }

  async function deleteExercise(id) {
    const prevExercises = rawExercises;
    const prevLog = progressLog;
    setRawExercises((prev) => prev.filter((e) => e.id !== id));
    setProgressLog((prev) => prev.filter((p) => p.exerciseId !== id));
    try {
      await apiFetch(`/api/exercises/${id}`, { method: "DELETE", token });
    } catch {
      setRawExercises(prevExercises);
      setProgressLog(prevLog);
      toast.error("No se pudo borrar el ejercicio.");
    }
  }

  async function addProgress({ exerciseId, weight, reps, date, spotted }) {
    const numWeight = Number(weight) || 0;
    const numReps = Number(reps) || 0;
    if (!exerciseId || (numWeight <= 0 && numReps <= 0)) return;
    const exercise = rawExercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    // Detectamos PR ANTES de insertar la marca, contra el máximo previo real
    // (misma regla que utils/points.js) — así el toast/confetti sale
    // exactamente cuando el Power Level también sube por esta marca.
    const priorMarks = marksFor(progressLog, exerciseId);
    const priorMaxWeight = priorMarks.length ? Math.max(...priorMarks.map((m) => m.weight)) : -Infinity;
    const priorMaxReps = priorMarks.length ? Math.max(...priorMarks.map((m) => m.reps)) : -Infinity;
    const isWeightPR = numWeight > priorMaxWeight && numWeight > 0;
    const isRepsPR = numReps > priorMaxReps && numReps > 0;

    try {
      const created = await apiFetch("/api/progress-marks", {
        method: "POST",
        token,
        body: {
          exerciseId,
          date: date || new Date().toISOString().slice(0, 10),
          weight: numWeight,
          reps: numReps,
          spotted: !!spotted,
        },
      });
      setProgressLog((prev) => [...prev, fromMarkDto(created)]);

      if (isWeightPR || isRepsPR) {
        const detail = isWeightPR && isRepsPR
          ? `${numWeight}${exercise.unit} × ${numReps} reps`
          : isWeightPR
          ? `${numWeight}${exercise.unit}`
          : `${numReps} reps`;
        notifyPR(exercise.name, detail);
        fireConfetti();
      }

      notifyGroupGoalProgress(created.groupProgress);
    } catch {
      toast.error("No se pudo guardar la marca.");
    }
  }

  async function updateProgress(id, patch) {
    const old = progressLog.find((p) => p.id === id);
    if (!old) return;
    const merged = { ...old, ...patch };
    if (patch.weight !== undefined) merged.weight = Number(patch.weight) || 0;
    if (patch.reps !== undefined) merged.reps = Number(patch.reps) || 0;

    try {
      const updated = await apiFetch(`/api/progress-marks/${id}`, {
        method: "PUT",
        token,
        body: { date: merged.date, weight: merged.weight, reps: merged.reps, spotted: !!merged.spotted },
      });
      setProgressLog((prev) => prev.map((p) => (p.id === id ? fromMarkDto(updated) : p)));
    } catch {
      toast.error("No se pudo editar la marca.");
    }
  }

  async function deleteProgress(id) {
    const prevLog = progressLog;
    setProgressLog((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiFetch(`/api/progress-marks/${id}`, { method: "DELETE", token });
    } catch {
      setProgressLog(prevLog);
      toast.error("No se pudo borrar la marca.");
    }
  }

  const powerExercise = rawExercises.find((e) => normalize(e.name) === POWER_EXERCISE_NAME);
  const benchKg = powerExercise ? recomputeExercise(progressLog, powerExercise.id, powerExercise.unit).pr : 0;
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
    loading,
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
