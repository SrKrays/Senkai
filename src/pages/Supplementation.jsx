import { useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, GlassWater, Zap, Moon, Check } from "lucide-react";
import { PageHeader, Card, Tag, ProgressBar, CharacterArt, CharacterHero } from "../components/ui";
import { useSupplementPlan } from "../context/SupplementPlanContext";
import { useSupplementation } from "../context/SupplementationContext";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useNutrition } from "../context/NutritionContext";
import { usePoints } from "../context/PointsContext";
import { useCharacter } from "../context/CharacterContext";
import { DIAS_CORTOS, currentStreak, daysInMonth, monthLabel, toISO, getWeekDates } from "../utils/date";

// Ícono por categoría — catálogo cerrado de 4 keys reales (creatine/protein/
// caffeine/magnesium), nada inventado. Fallback a FlaskConical si algún día
// se suma una key nueva del lado del server sin actualizar esto.
const SUPPLEMENT_ICONS = {
  creatine: FlaskConical,
  protein: GlassWater,
  caffeine: Zap,
  magnesium: Moon,
};

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
    <div className="pt-1">
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

function RecommendationCard({ rec, busy, dayMap, today, onTaken, onSkip, onSnooze }) {
  const meta = STATUS_META[rec.status] ?? { tone: undefined, label: rec.status };
  const snoozeTime = rec.snoozeUntil
    ? new Date(rec.snoozeUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : null;
  // Historial/adherencia colapsado por default — son 4 cards en la grilla y
  // el calendario mensual de cada una ocupa bastante; se pide bajo demanda.
  const [showHistory, setShowHistory] = useState(false);
  const Icon = SUPPLEMENT_ICONS[rec.key] ?? FlaskConical;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="hud flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-maroon/25 bg-maroon/10">
          <Icon size={18} className="text-maroon" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{rec.label}</p>
          <Tag tone={meta.tone}>{meta.label}</Tag>
        </div>
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

      <button
        onClick={() => setShowHistory((v) => !v)}
        className="flex items-center justify-between border-t border-maroon/10 pt-3 text-left font-mono text-[10px] uppercase tracking-widest2 text-muted hover:text-maroon"
        aria-expanded={showHistory}
      >
        <span>Ver historial</span>
        <span>{showHistory ? "▲" : "▼"}</span>
      </button>
      {showHistory && <AdherencePanel dayMap={dayMap} today={today} />}
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

  // Cumplimiento semanal — semana actual (lunes a domingo), % de categorías
  // ACTIVAS marcadas "tomado" sobre el total posible de días ya transcurridos.
  // Pura lectura de logsByKey (ya fetcheado por el plan), sin llamadas nuevas.
  const enabledKeys = recommendations.filter((r) => prefsByKey[r.key] ?? true).map((r) => r.key);
  const weekDates = getWeekDates(planToday);
  let doneCount = 0;
  let possibleCount = 0;
  const weekDays = weekDates.map((d) => {
    const iso = toISO(d);
    if (d > planToday) return { iso, status: "future" };
    let takenCount = 0;
    for (const key of enabledKeys) {
      possibleCount += 1;
      if (logsByKey[key]?.[iso] === "taken") {
        takenCount += 1;
        doneCount += 1;
      }
    }
    const status = enabledKeys.length === 0 || takenCount === 0 ? "none" : takenCount === enabledKeys.length ? "full" : "partial";
    return { iso, status };
  });
  const weeklyPct = possibleCount ? doneCount / possibleCount : 0;
  const daysWithAnyTaken = weekDays.filter((d) => d.status === "full" || d.status === "partial").length;
  const daysElapsedInWeek = weekDays.filter((d) => d.status !== "future").length;

  return (
    <div>
      <PageHeader
        eyebrow="Suplementación"
        title={<span className="text-maroon">Plan de suplementación</span>}
        description="Nutrí tu cuerpo. Sumá constancia día a día — no es indicación médica, es un empujón de hábito."
      />

      {/* HERO — personaje, mismo patrón que Nutrición/Rutinas, Power Level
          combinado (Tracker + Entrenamiento + Nutrición + Suplementos).
          Va primero: es la respuesta a "cómo estoy hoy" antes que el detalle. */}
      <CharacterHero
        eyebrow={`Power Level ${powerLevel.toLocaleString("es-AR")}`}
        name={current.name}
        tag={current.tag}
        tone="maroon"
        progress={progress}
        art={<CharacterArt src={current.img} alt={current.name} width={110} height={150} />}
      >
        <p className="font-mono text-[10px] text-muted">
          {next
            ? `Próxima etapa: ${next.name} · faltan ${(next.minScore - powerLevel).toLocaleString("es-AR")} pts`
            : "Nivel máximo alcanzado"}
        </p>
      </CharacterHero>

      {/* UTILITY — cumplimiento semanal: referencia rápida, sin chrome de
          card (antes era una Card suelta arriba de todo). */}
      <div className="surface-utility mb-8 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Cumplimiento semanal</p>
          <p className="font-mono text-xs font-semibold text-maroon">{Math.round(weeklyPct * 100)}%</p>
        </div>
        <ProgressBar progress={weeklyPct} />
        <div className="mt-1 grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => (
            <div key={d.iso} className="flex flex-col items-center gap-1">
              <span className="font-mono text-[8px] uppercase text-muted">{DIAS_CORTOS[i]}</span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[10px] ${
                  d.status === "future"
                    ? "border-line/40 text-muted/30"
                    : d.status === "full"
                    ? "border-maroon bg-maroon text-paper"
                    : d.status === "partial"
                    ? "border-maroon/50 text-maroon"
                    : "border-line text-muted"
                }`}
              >
                {d.status === "full" ? <Check size={12} /> : new Date(d.iso).getDate()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE — Suplementos de hoy: las 4 categorías reales, con su
          recomendación contextual (ya entrenaste, falta proteína, cerca de
          dormir, etc.) — es la acción principal de esta pantalla. */}
      <div className="mb-8">
        <p className="eyebrow mb-4">Suplementos de hoy</p>
        {loading ? (
          <p className="text-sm text-muted">Cargando...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.key}
                rec={rec}
                busy={!!acting[rec.key]}
                dayMap={logsByKey[rec.key] || {}}
                today={planToday}
                onTaken={() => markTaken(rec.key)}
                onSkip={() => markSkipped(rec.key)}
                onSnooze={() => snooze(rec.key, 2)}
              />
            ))}
          </div>
        )}
      </div>

      {/* UTILITY — Categorías: activar/desactivar cada una, reubicado acá
          desde adentro de cada card (misma función setPreferenceEnabled,
          solo que ahora vive en un solo lugar en vez de repetida 4 veces). */}
      <div className="surface-utility mb-8">
        <p className="eyebrow mb-4">Categorías</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {preferences.map((p) => {
            const Icon = SUPPLEMENT_ICONS[p.key] ?? FlaskConical;
            return (
              <button
                key={p.key}
                onClick={() => setPreferenceEnabled(p.key, !p.enabled)}
                disabled={!!acting[p.key]}
                className={`hud flex flex-col items-center gap-2 border px-3 py-4 text-center transition-all duration-250 disabled:opacity-50 ${
                  p.enabled ? "border-maroon/40 bg-maroon/5" : "border-line"
                }`}
              >
                <Icon size={20} className={p.enabled ? "text-maroon" : "text-muted"} strokeWidth={1.75} />
                <span className={`font-mono text-[9px] uppercase tracking-widest2 ${p.enabled ? "text-ink" : "text-muted"}`}>
                  {p.label}
                </span>
                <span className="font-mono text-[8px] text-muted">{p.enabled ? "Activada" : "Desactivada"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* UTILITY — Historial + Evolución: mismos datos que antes vivían en
          la barra lateral (Fase 8 de esta mecánica), ahora fusionados en un
          solo bloque de dos columnas en vez de 2 cards sueltas. */}
      <div className="surface-utility grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Historial (7 días)</p>
          <p className="font-mono text-2xl font-semibold text-ink">
            {daysWithAnyTaken}
            <span className="text-sm text-muted">/{daysElapsedInWeek || 7}</span>
          </p>
          <p className="font-mono text-[10px] text-muted">días con al menos un suplemento tomado</p>
          <div className="mt-1 flex h-8 items-end gap-1.5">
            {weekDays.map((d) => (
              <div key={d.iso} className="flex h-full flex-1 items-end bg-line/40">
                <div
                  className={`w-full ${d.status === "future" ? "bg-transparent" : "bg-maroon"}`}
                  style={{ height: d.status === "full" ? "100%" : d.status === "partial" ? "50%" : "6%" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:border-l sm:border-line/60 sm:pl-6">
          <p className="eyebrow">Evolución combinada</p>
          <p className="font-mono text-2xl font-semibold text-maroon">{Math.round(progress * 100)}%</p>
          <p className="font-mono text-[10px] text-muted">hacia {next ? next.name : "nivel máximo"}</p>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-muted">
            <span>Tracker {Math.round(trackerScore * 100)}%</span>
            <span>Entrenamiento {Math.round(trainingScore * 100)}%</span>
            <span>Nutrición {Math.round(nutritionScore * 100)}%</span>
            <span>Suplementos {Math.round(supplementationScore * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
