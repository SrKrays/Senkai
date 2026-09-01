import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader, Card, StatPill, ProgressBar, Tag, CharacterArt } from "../components/ui";
import PowerReader from "../components/PowerReader";
import { useTraining } from "../context/TrainingContext";
import { useTracker } from "../context/TrackerContext";
import { usePoints } from "../context/PointsContext";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import { useCharacter } from "../context/CharacterContext";
import { useProfile } from "../context/ProfileContext";
import { currentStreak } from "../utils/date";

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
  const { heightCm, latestWeightKg, weightLog } = useProfile();

  const gymHabit = habits.find((h) => h.type === "gym");
  const streak = gymHabit ? currentStreak(gymHabit.checksByDate, today) : 0;
  const totalWorkouts = progressLog.length;

  // Evolución de peso: delta entre el primer y el último registro cargado —
  // null si todavía no hay al menos dos para comparar.
  const weightGrowthKg =
    weightLog.length >= 2
      ? Number((weightLog[weightLog.length - 1].weightKg - weightLog[0].weightKg).toFixed(1))
      : null;

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
      <PageHeader
        eyebrow="Dashboard"
        title={`Hola, ${user.name}`}
        description="Esta es la entrada a todo lo trabajado: tu Power Level, tu progreso real y tu grupo, todo en un solo lugar."
      />

      {/* Hero — Vegeta completo + Power Level, el punto de entrada visual */}
      <Card className="relative mb-6 flex flex-col gap-8 overflow-hidden py-8 lg:flex-row lg:items-center">
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
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1 lg:w-56">
          <StatPill label="Racha activa" value={streak} suffix=" días" />
          <StatPill label="Entrenos totales" value={totalWorkouts} />
          <StatPill label="PR press banca" value={benchKg} suffix=" kg" />
          <StatPill label="Peso corporal" value={latestWeightKg ?? "Sin datos"} suffix={latestWeightKg ? " kg" : ""} />
          <StatPill label="Altura" value={heightCm ?? "Sin datos"} suffix={heightCm ? " cm" : ""} />
          <StatPill
            label="Evolución de peso"
            value={weightGrowthKg === null ? "Sin datos" : weightGrowthKg > 0 ? `+${weightGrowthKg}` : `${weightGrowthKg}`}
            suffix={weightGrowthKg === null ? "" : " kg"}
          />
        </div>
      </Card>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        {/* Mejores ejercicios */}
        <Card>
          <p className="eyebrow mb-4">Mejores ejercicios</p>
          {bestExercises.length === 0 ? (
            <p className="text-sm text-muted">
              Todavía no hay suficientes marcas. Cargá progreso en{" "}
              <Link to="/entrenamiento" className="text-maroon underline underline-offset-4">
                Entrenamiento
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {bestExercises.map((ex, i) => (
                <motion.li
                  key={ex.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between border-b border-ink/10 pb-3 last:border-none"
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
        </Card>

        {/* En qué grupo estoy */}
        <Card>
          {groupLoading ? (
            <p className="text-sm text-muted">Cargando tu grupo...</p>
          ) : notInGroup || !group || !goal || !groupLeader ? (
            <p className="text-sm text-muted">Todavía no pertenecés a ningún grupo.</p>
          ) : (
            <>
              <p className="eyebrow mb-4">Tu grupo — {group.name}</p>
              <p className="text-sm font-semibold">{goal.title}</p>
              <p className="mb-3 font-mono text-xs text-muted">
                Premio: {goal.prize} · meta {goal.targetKg}kg en {goal.exerciseLabel.toLowerCase()}
              </p>
              <ProgressBar progress={goal.targetKg ? Math.min(1, groupLeader[goal.exercise] / goal.targetKg) : 0} />
              <p className="mt-4 eyebrow mb-2">Va ganando</p>
              <p className="text-sm">
                <span className="font-semibold text-maroon">{groupLeader.name}</span> con {groupLeader[goal.exercise]}kg en{" "}
                {goal.exerciseLabel.toLowerCase()}
              </p>
              <Link to="/grupos" className="mt-4 inline-block font-mono text-xs uppercase tracking-widest2 text-maroon underline underline-offset-4">
                Ver grupo completo →
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
