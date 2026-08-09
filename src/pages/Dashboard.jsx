import { Link } from "react-router-dom";
import { PageHeader, Card, StatPill, ProgressBar, Tag, CharacterArt } from "../components/ui";
import PowerReader from "../components/PowerReader";
import { useTraining } from "../context/TrainingContext";
import { useTracker } from "../context/TrackerContext";
import { usePoints } from "../context/PointsContext";
import { vegetaEvolution, groups, user } from "../data/mockData";
import { getVegetaStage } from "../utils/evolution";
import { currentStreak } from "../utils/date";

function exerciseGrowthPct(progressLog, exerciseId) {
  const marks = progressLog.filter((p) => p.exerciseId === exerciseId).sort((a, b) => a.date.localeCompare(b.date));
  if (marks.length < 2) return null;
  const first = marks[0];
  const last = marks[marks.length - 1];
  if (!first.weight) return null;
  return ((last.weight - first.weight) / first.weight) * 100;
}

const SECTIONS = [
  { to: "/tracker", label: "Tracker de Hábitos", icon: "✅" },
  { to: "/entrenamiento", label: "Entrenamiento", icon: "🏋️" },
  { to: "/rutinas", label: "Rutinas", icon: "🗓️" },
  { to: "/nutricion", label: "Nutrición", icon: "🍽️" },
  { to: "/suplementacion", label: "Suplementación", icon: "💊" },
  { to: "/estadisticas", label: "Objetivos y Estadísticas", icon: "📊" },
];

export default function Dashboard() {
  const { exercises, progressLog, benchKg } = useTraining();
  const { habits, today } = useTracker();
  const { powerLevel } = usePoints();

  const { current, next, progress } = getVegetaStage(powerLevel, vegetaEvolution);

  const gymHabit = habits.find((h) => h.id === "gym");
  const streak = gymHabit ? currentStreak(gymHabit.checksByDate, today) : 0;
  const totalWorkouts = progressLog.length;

  const bestExercises = exercises
    .map((ex) => ({ ...ex, growthPct: exerciseGrowthPct(progressLog, ex.id) }))
    .filter((ex) => ex.growthPct !== null)
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 3);

  const group = groups[0];
  const groupLeader = [...group.members].sort((a, b) => b.benchKg - a.benchKg)[0];

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={`Hola, ${user.name}`}
        description="Esta es la entrada a todo lo trabajado: tu Power Level, tu progreso real y tu grupo, todo en un solo lugar."
      />

      {/* Hero — Vegeta completo + Power Level, el punto de entrada visual */}
      <Card className="mb-6 flex flex-col gap-8 py-8 lg:flex-row lg:items-center">
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <CharacterArt src={current.img} alt={current.name} width={180} height={300} />
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
          <StatPill label="Racha activa" value={`${streak} días`} />
          <StatPill label="Entrenos totales" value={totalWorkouts} />
          <StatPill label="PR press banca" value={`${benchKg} kg`} />
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
              {bestExercises.map((ex) => (
                <li key={ex.id} className="flex items-center justify-between border-b border-ink/10 pb-3 last:border-none">
                  <div>
                    <p className="text-sm font-semibold">{ex.name}</p>
                    <p className="font-mono text-xs text-muted">{ex.muscle}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-teal-dark">
                    +{Math.round(ex.growthPct)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* En qué grupo estoy */}
        <Card>
          <p className="eyebrow mb-4">Tu grupo — {group.name}</p>
          <p className="text-sm font-semibold">{group.goal.title}</p>
          <p className="mb-3 font-mono text-xs text-muted">
            Premio: {group.goal.prize} · meta {group.goal.targetKg}kg en banca
          </p>
          <ProgressBar progress={Math.min(1, groupLeader.benchKg / group.goal.targetKg)} />
          <p className="mt-4 eyebrow mb-2">Va ganando</p>
          <p className="text-sm">
            <span className="font-semibold text-maroon">{groupLeader.name}</span> con {groupLeader.benchKg}kg en banca
          </p>
          <Link to="/grupos" className="mt-4 inline-block font-mono text-xs uppercase tracking-widest2 text-maroon underline underline-offset-4">
            Ver grupo completo →
          </Link>
        </Card>
      </div>

      {/* Entrada rápida al resto de la web */}
      <p className="eyebrow mb-4">Ir a...</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="hud flex items-center gap-3 border border-maroon/20 bg-card px-4 py-3 text-sm hover:bg-maroon/5"
          >
            <span className="text-lg">{s.icon}</span>
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
