import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Dumbbell, Trophy, ChevronRight } from "lucide-react";
import { PageHeader, Card, ProgressBar, Tag, CharacterArt, Button } from "../components/ui";
import PowerReader from "../components/PowerReader";
import { useTraining } from "../context/TrainingContext";
import { useTracker } from "../context/TrackerContext";
import { usePoints } from "../context/PointsContext";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import { useCharacter } from "../context/CharacterContext";
import { useRoutines } from "../context/RoutineContext";
import { currentStreak, getWeekDates, isSameDay, DIAS_CORTOS } from "../utils/date";

function exerciseGrowthPct(progressLog, exerciseId) {
  const marks = progressLog.filter((p) => p.exerciseId === exerciseId).sort((a, b) => a.date.localeCompare(b.date));
  if (marks.length < 2) return null;
  const first = marks[0];
  const last = marks[marks.length - 1];
  if (!first.weight) return null;
  return ((last.weight - first.weight) / first.weight) * 100;
}

export default function Dashboard() {
  const { exercises, progressLog, benchKg } = useTraining();
  const { habits, today } = useTracker();
  const { powerLevel } = usePoints();
  const { user } = useAuth();
  const { group, loading: groupLoading, notInGroup } = useGroup();
  const { current, next, progress } = useCharacter();
  const { routines } = useRoutines();

  const gymHabit = habits.find((h) => h.type === "gym");
  const streak = gymHabit ? currentStreak(gymHabit.checksByDate, today) : 0;
  const totalWorkouts = progressLog.length;

  // Próxima misión — la primera rutina programada desde hoy en adelante
  // (hoy mismo si hay una, si no la más cercana en los próximos 6 días).
  // Mismo dato que ya usa Rutinas (r.daysOfWeek), solo mirado desde acá.
  const weekDates = getWeekDates(today);
  const todayIdx = weekDates.findIndex((d) => isSameDay(d, today));
  let nextMission = null;
  if (routines.length > 0 && todayIdx !== -1) {
    for (let offset = 0; offset < 7; offset++) {
      const dayIdx = (todayIdx + offset) % 7;
      const match = routines.find((r) => r.daysOfWeek.includes(dayIdx));
      if (match) {
        nextMission = { routine: match, isToday: offset === 0, dayLabel: DIAS_CORTOS[dayIdx] };
        break;
      }
    }
  }

  const bestExercises = exercises
    .map((ex) => ({ ...ex, growthPct: exerciseGrowthPct(progressLog, ex.id) }))
    .filter((ex) => ex.growthPct !== null)
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 3);

  const goal = group?.goal;
  const groupLeader = group && goal
    ? [...group.members].sort((a, b) => b[goal.exercise] - a[goal.exercise])[0]
    : null;

  return (
    <div>
      <PageHeader eyebrow="Dashboard" title={`Hola, ${user.name}`} description="Hoy es un gran día para mejorar." />

      {/* Hero — Vegeta completo + Power Level, el punto de entrada visual.
          Fase 0 P1: solo personaje + Power Level + CTA. Los números de
          resumen y la próxima misión pasan a ser sus propias secciones
          debajo, como en la referencia — no compiten con el hero. */}
      <Card className="relative mb-8 flex flex-col gap-8 overflow-hidden py-8 lg:flex-row lg:items-center">
        <div className="scanlines" />
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <div className="aura-pulse relative">
            <CharacterArt src={current.img} alt={current.name} width={180} height={300} />
          </div>
        </div>

        <div className="flex-1">
          <p className="eyebrow mb-2">Etapa actual</p>
          <h2 className="font-display text-5xl tracking-wide text-maroon">{current.name}</h2>
          <Tag tone="teal">{current.tag}</Tag>
          <p className="mt-3 font-mono text-xs text-muted">
            {next
              ? `Próxima etapa: ${next.name} · faltan ${(next.minScore - powerLevel).toLocaleString("es-AR")} pts`
              : "Nivel máximo alcanzado"}
          </p>
          <div className="mt-4 max-w-sm">
            <ProgressBar progress={progress} tone="teal" />
          </div>
          <div className="mt-6">
            <PowerReader value={powerLevel} />
          </div>
          <div className="mt-6">
            <Button to="/entrenamiento" size="lg">
              Entrenar ahora
            </Button>
          </div>
        </div>
      </Card>

      {/* FEATURE 1 — Próxima misión: la respuesta a "¿qué tengo que hacer?",
          por eso va primera después del hero. Sigue siendo Card (feature),
          no hero. */}
      {nextMission && (
        <div className="mb-6">
          <p className="eyebrow mb-3">Próxima misión</p>
          <Link to="/rutinas">
            <Card className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-display text-xl tracking-wide">{nextMission.routine.name}</p>
                  <Tag tone={nextMission.isToday ? "teal" : "maroon"}>
                    {nextMission.isToday ? "Hoy" : nextMission.dayLabel}
                  </Tag>
                </div>
                <p className="font-mono text-xs text-muted">
                  {nextMission.routine.focus} · {nextMission.routine.exercises.length} ejercicios
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </Card>
          </Link>
        </div>
      )}

      {/* FEATURE 2 — Resumen del día: "¿cómo estoy?" en un solo bloque en vez
          de 3 cards sueltas — Fase 0 P1 cierre visual, menos cajas, misma
          info. */}
      <div className="mb-10">
        <p className="eyebrow mb-3">Resumen del día</p>
        <Card className="grid grid-cols-3 divide-x divide-line/60">
          <div className="flex flex-col items-center gap-1 text-center">
            <Flame size={18} className="text-danger" />
            <p className="font-mono text-xl font-semibold text-ink">{streak}</p>
            <p className="eyebrow">Racha</p>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Trophy size={18} className="text-gold" />
            <p className="font-mono text-xl font-semibold text-ink">{benchKg}</p>
            <p className="eyebrow">PR banca</p>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Dumbbell size={18} className="text-teal" />
            <p className="font-mono text-xl font-semibold text-ink">{totalWorkouts}</p>
            <p className="eyebrow">Entrenos</p>
          </div>
        </Card>
      </div>

      {/* UTILITY — mejores ejercicios + grupo: información real pero
          secundaria frente al hero/features de arriba. Filas simples con
          separador, sin card pesada (sin fondo/borde/sombra propios). */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Mejores ejercicios</p>
          {bestExercises.length === 0 ? (
            <p className="text-sm text-muted">
              Todavía no hay suficientes marcas. Cargá progreso en{" "}
              <Link to="/entrenamiento" className="text-maroon underline underline-offset-4">
                Entrenamiento
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col">
              {bestExercises.map((ex, i) => (
                <motion.li
                  key={ex.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between border-b border-line/60 py-3 first:pt-0 last:border-none"
                >
                  <div>
                    <p className="text-sm font-semibold">{ex.name}</p>
                    <p className="font-mono text-xs text-muted">{ex.muscle}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-teal-dark">
                    +{Math.round(ex.growthPct)}%
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {groupLoading ? (
            <p className="text-sm text-muted">Cargando tu grupo...</p>
          ) : notInGroup || !group || !goal || !groupLeader ? (
            <p className="text-sm text-muted">Todavía no pertenecés a ningún grupo.</p>
          ) : (
            <>
              <p className="eyebrow mb-3">Tu grupo — {group.name}</p>
              <p className="text-sm font-semibold">{goal.title}</p>
              <p className="mb-3 font-mono text-xs text-muted">
                Premio: {goal.prize} · meta {goal.targetKg}kg en {goal.exerciseLabel.toLowerCase()}
              </p>
              <ProgressBar progress={goal.targetKg ? Math.min(1, groupLeader[goal.exercise] / goal.targetKg) : 0} />
              <p className="mt-4 eyebrow mb-1">Va ganando</p>
              <p className="text-sm">
                <span className="font-semibold text-maroon">{groupLeader.name}</span> con {groupLeader[goal.exercise]}kg en{" "}
                {goal.exerciseLabel.toLowerCase()}
              </p>
              <Link to="/grupos" className="mt-4 inline-block font-mono text-xs uppercase tracking-widest2 text-maroon underline underline-offset-4">
                Ver grupo completo →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
