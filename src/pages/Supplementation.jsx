import { PageHeader, Card, Tag, ProgressBar, CharacterArt } from "../components/ui";
import { useSupplementPlan } from "../context/SupplementPlanContext";
import { useSupplementation } from "../context/SupplementationContext";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useNutrition } from "../context/NutritionContext";
import { usePoints } from "../context/PointsContext";
import { useCharacter } from "../context/CharacterContext";
import { Link } from "react-router-dom";
import { DIAS_CORTOS, currentStreak, daysInMonth, monthLabel, toISO } from "../utils/date";

// Fase 7 — historial/adherencia del mes en curso por categoría, a partir de
// los logs reales que ya devuelve /api/supplement-plan/logs (nada nuevo se
// calcula ni se inventa del lado del servidor para esto).
function AdherencePanel({ dayMap, today }) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const elapsed = today.getDate();
  const totalDays = daysInMonth(year, month);
  const monthDates = Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1));

  const takenMap = Object.fromEntries(Object.entries(dayMap).filter(([, v]) => v === "taken"));
  const takenCount = Object.keys(takenMap).length;
  const adherence = elapsed > 0 ? takenCount / elapsed : 0;
  const streak = currentStreak(takenMap, today);

  return (
    <div className="border-t border-maroon/10 pt-3">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="eyebrow text-maroon">{monthLabel(today)}</p>
        <p className="font-mono text-[10px] text-muted">
          {Math.round(adherence * 100)}% · racha {streak}d
        </p>
      </div>
      <ProgressBar progress={adherence} />
      <div className="mt-2 grid grid-cols-7 gap-1">
        {DIAS_CORTOS.map((d, i) => (
          <span key={i} className="text-center font-mono text-[9px] uppercase text-muted">
            {d}
          </span>
        ))}
        {Array.from({ length: (monthDates[0].getDay() + 6) % 7 }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {monthDates.map((d) => {
          const dateISO = toISO(d);
          const status = dayMap[dateISO];
          const isFuture = d > today;
          const cls = isFuture
            ? "text-muted/30"
            : status === "taken"
            ? "bg-maroon text-paper"
            : status === "skipped"
            ? "border border-maroon/30 text-muted"
            : status === "snoozed"
            ? "border border-dashed border-maroon/30 text-muted"
            : "border border-maroon/10 text-muted/50";
          return (
            <span
              key={dateISO}
              title={`${dateISO}${status ? ` · ${status}` : ""}`}
              className={`flex h-5 w-5 items-center justify-center text-[9px] font-mono ${cls}`}
            >
              {d.getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Estado → look del Tag + copy corto del badge. "taken"/"recommended" son los
// únicos dos estados "accionables desde acá"; el resto es informativo.
const STATUS_META = {
  taken: { tone: "teal", label: "Tomado hoy ✓" },
  recommended: { tone: "maroon", label: "Recomendado ahora" },
  not_now: { tone: undefined, label: "No corresponde ahora" },
  needs_setup: { tone: undefined, label: "Falta configurar" },
  snoozed: { tone: undefined, label: "Pospuesto" },
  disabled: { tone: undefined, label: "Desactivado" },
};

function RecommendationCard({ rec, enabled, busy, dayMap, today, onTaken, onSkip, onSnooze, onToggleEnabled }) {
  const meta = STATUS_META[rec.status] ?? { tone: undefined, label: rec.status };
  const snoozeTime = rec.snoozeUntil
    ? new Date(rec.snoozeUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{rec.label}</p>
        <Tag tone={meta.tone}>{meta.label}</Tag>
      </div>

      <p className="text-xs text-muted">
        {rec.reason}
        {snoozeTime ? ` (hasta las ${snoozeTime})` : ""}
      </p>

      {rec.status === "needs_setup" && (
        <Link
          to="/personalizacion"
          className="font-mono text-[10px] uppercase tracking-widest2 text-maroon underline underline-offset-4"
        >
          Ir a Personalización
        </Link>
      )}

      {(rec.status === "recommended" || rec.status === "not_now" || rec.status === "snoozed") && (
        <div className="flex flex-wrap gap-2 border-t border-maroon/10 pt-3">
          <button
            disabled={busy}
            onClick={onTaken}
            className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250 disabled:opacity-50"
          >
            {rec.status === "recommended" ? "Marcar tomado" : "Marqué tomado igual"}
          </button>
          {rec.status === "recommended" && (
            <>
              <button
                disabled={busy}
                onClick={onSkip}
                className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10 disabled:opacity-50"
              >
                Saltear hoy
              </button>
              <button
                disabled={busy}
                onClick={onSnooze}
                className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10 disabled:opacity-50"
              >
                Recordarme en 2h
              </button>
            </>
          )}
        </div>
      )}

      <AdherencePanel dayMap={dayMap} today={today} />

      <button
        disabled={busy}
        onClick={onToggleEnabled}
        className="text-left font-mono text-[10px] uppercase tracking-widest2 text-muted underline underline-offset-4 hover:text-maroon disabled:opacity-50"
      >
        {enabled ? "Desactivar esta categoría" : "Activar esta categoría"}
      </button>
    </Card>
  );
}

export default function Supplementation() {
  const {
    recommendations,
    preferences,
    loading,
    acting,
    today: planToday,
    logsByKey,
    markTaken,
    markSkipped,
    snooze,
    setPreferenceEnabled,
  } = useSupplementPlan();
  // supplementationScore viene del checklist libre viejo (frozen, ya no se
  // edita desde ninguna pantalla) — se sigue usando acá SOLO para no romper
  // el cálculo de evolución combinada de Vegeta, que es Fase 8 de esta
  // mecánica (todavía no tocada).
  const { supplementationScore } = useSupplementation();
  const { trackerScore } = useTracker();
  const { trainingScore } = useTraining();
  const { nutritionScore } = useNutrition();
  const { powerLevel } = usePoints();
  const { current, next, progress } = useCharacter();

  const prefsByKey = Object.fromEntries(preferences.map((p) => [p.key, p.enabled]));

  return (
    <div>
      <PageHeader
        eyebrow="Suplementación"
        title="Plan del día"
        description="Recomendaciones en base a tu entreno, tu proteína de hoy y tu hora de dormir — no es indicación médica, es un empujón de hábito."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
        <div>
          {loading ? (
            <p className="text-sm text-muted">Cargando...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.key}
                  rec={rec}
                  enabled={prefsByKey[rec.key] ?? true}
                  busy={!!acting[rec.key]}
                  dayMap={logsByKey[rec.key] || {}}
                  today={planToday}
                  onTaken={() => markTaken(rec.key)}
                  onSkip={() => markSkipped(rec.key)}
                  onSnooze={() => snooze(rec.key, 2)}
                  onToggleEnabled={() => setPreferenceEnabled(rec.key, !(prefsByKey[rec.key] ?? true))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vegeta evolucionando — mismo progreso combinado que Tracker/Entrenamiento/Nutrición */}
        <div>
          <p className="eyebrow mb-4">Evolución combinada</p>
          <Card className="sticky top-24 flex flex-col items-center gap-4 py-8">
            <CharacterArt src={current.img} alt={current.name} width={200} height={340} />
            <div className="text-center">
              <p className="eyebrow mb-1">Power Level {powerLevel.toLocaleString("es-AR")}</p>
              <h3 className="font-display text-2xl tracking-wide text-maroon">{current.name}</h3>
              <Tag tone="teal">{current.tag}</Tag>
            </div>
            <div className="w-full">
              <p className="mb-1 font-mono text-[10px] text-muted">
                {next
                  ? `Próxima: ${next.name} en ${(next.minScore - powerLevel).toLocaleString("es-AR")} pts`
                  : "Nivel máximo"}
              </p>
              <ProgressBar progress={progress} tone="teal" />
            </div>
            <p className="text-center font-mono text-[10px] text-muted">
              Tracker {Math.round(trackerScore * 100)}% · Entrenamiento {Math.round(trainingScore * 100)}% ·
              Nutrición {Math.round(nutritionScore * 100)}% · Suplementos {Math.round(supplementationScore * 100)}%
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
