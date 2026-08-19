import { useMemo, useState } from "react";
import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import { goals as initialGoals } from "../data/mockData";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useNutrition } from "../context/NutritionContext";
import { useSupplementation } from "../context/SupplementationContext";
import { usePoints } from "../context/PointsContext";
import { useCharacter } from "../context/CharacterContext";
import { useRank } from "../context/RankContext";
import { toISO, startOfWeekMonday, monthLabel } from "../utils/date";

const LINE_COLORS = { gym: "#3AAEEC", comida: "#D9A441", suplemento: "#D7263D" };

function marksForExercise(progressLog, exerciseId) {
  return progressLog.filter((p) => p.exerciseId === exerciseId).sort((a, b) => a.date.localeCompare(b.date));
}

function exerciseGrowthPct(progressLog, exerciseId) {
  const marks = marksForExercise(progressLog, exerciseId);
  if (marks.length < 2) return null;
  const first = marks[0];
  const last = marks[marks.length - 1];
  if (!first.weight) return null;
  return ((last.weight - first.weight) / first.weight) * 100;
}

export default function Stats() {
  const { habits, notes, today, monthly, trackerScore } = useTracker();
  const { exercises, progressLog, trainingScore } = useTraining();
  const { mealSlots, mealLogsByDate, nutritionScore } = useNutrition();
  const { supplements, supplementationScore } = useSupplementation();
  const { powerLevel, gymPoints, suplementoPoints, alimentacionPoints, trackerPoints } = usePoints();

  const [objectives, setObjectives] = useState(
    initialGoals.map((g) => ({ ...g, progress: Math.round(g.progress * 100) }))
  );
  const [showNewObjective, setShowNewObjective] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newType, setNewType] = useState("individual");

  function addObjective() {
    if (!newTitle.trim()) return;
    setObjectives((prev) => [
      ...prev,
      { id: Date.now(), type: newType, title: newTitle.trim(), deadline: newDeadline || "sin fecha", progress: 0 },
    ]);
    setNewTitle("");
    setNewDeadline("");
    setShowNewObjective(false);
  }

  function updateObjectiveProgress(id, value) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, progress: Math.max(0, Math.min(100, value)) } : o)));
  }

  function deleteObjective(id) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }

  // El progreso de Vegeta combina Tracker + Entrenamiento + Nutrición + Suplementación,
  // igual que en el resto de la app.
  const { current, next, progress } = useCharacter();

  // Rango por ejercicio (Fase 9, Mecánica 1) — sistema paralelo a Power
  // Level, agrupado por músculo para mostrarlo ordenado.
  const { byMuscle, loading: ranksLoading } = useRank();
  const muscleGroups = Object.keys(byMuscle).sort();

  const gymHabit = habits.find((h) => h.type === "gym");

  // Agrupamos los días transcurridos del mes en semanas (lunes a domingo) y sacamos
  // el % diario promedio de GYM / Comida / Suplemento por semana — así se ve en qué
  // semana aflojaste y en cuál metiste todo.
  const weeklyStats = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const elapsed = today.getDate();
    const weeksMap = new Map();

    for (let d = 1; d <= elapsed; d++) {
      const day = new Date(year, month, d);
      const key = toISO(startOfWeekMonday(day));
      if (!weeksMap.has(key)) weeksMap.set(key, []);
      weeksMap.get(key).push(day);
    }

    const weeks = Array.from(weeksMap.entries()).map(([key, days], i) => {
      let gymSum = 0;
      let comidaSum = 0;
      let suplementoSum = 0;

      for (const day of days) {
        const iso = toISO(day);
        gymSum += gymHabit?.checksByDate?.[iso] ? 1 : 0;

        const dayLogs = mealLogsByDate[iso] || {};
        comidaSum += mealSlots.length ? mealSlots.filter((s) => dayLogs[s.id]).length / mealSlots.length : 0;

        const suplChecked = supplements.filter((s) => s.checksByDate[iso]).length;
        suplementoSum += supplements.length ? suplChecked / supplements.length : 0;
      }

      const n = days.length;
      const gym = n ? gymSum / n : 0;
      const comida = n ? comidaSum / n : 0;
      const suplemento = n ? suplementoSum / n : 0;
      const avg = (gym + comida + suplemento) / 3;

      return { key, label: `S${i + 1}`, gym, comida, suplemento, avg };
    });

    return weeks;
  }, [today, gymHabit, mealLogsByDate, mealSlots, supplements]);

  const bestWeek = weeklyStats.length
    ? weeklyStats.reduce((a, b) => (b.avg > a.avg ? b : a))
    : null;
  const worstWeek = weeklyStats.length
    ? weeklyStats.reduce((a, b) => (b.avg < a.avg ? b : a))
    : null;
  const deltaPts =
    weeklyStats.length >= 2
      ? Math.round((weeklyStats[weeklyStats.length - 1].avg - weeklyStats[weeklyStats.length - 2].avg) * 100)
      : 0;

  // Ejercicios con mejor y peor crecimiento de peso (primera marca vs. última).
  const rankedExercises = exercises
    .map((ex) => ({ ...ex, growthPct: exerciseGrowthPct(progressLog, ex.id) }))
    .sort((a, b) => (b.growthPct ?? -999) - (a.growthPct ?? -999));
  const bestExercises = rankedExercises.filter((e) => e.growthPct !== null).slice(0, 5);
  const worstExercises = [...rankedExercises].reverse().filter((e) => e.growthPct !== null).slice(0, 3);

  const pendingHabits = habits.filter((h) => !h.checksByDate[toISO(today)]);
  const pendingNotes = notes.filter((n) => !n.done);

  // --- Gráfico de líneas (SVG) ---
  const chartW = 600;
  const chartH = 200;
  const padL = 34;
  const padR = 10;
  const padT = 10;
  const padB = 24;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const xFor = (i) => padL + (weeklyStats.length > 1 ? (i / (weeklyStats.length - 1)) * plotW : plotW / 2);
  const yFor = (v) => padT + plotH - v * plotH;

  function linePoints(key) {
    return weeklyStats.map((w, i) => `${xFor(i)},${yFor(w[key])}`).join(" ");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Objetivos y Estadísticas"
        title="Panel general"
        description="Todos tus objetivos activos, el pulso del mes y el estado de Vegeta, en un solo lugar."
      />

      {/* Objetivos — fila horizontal, se auto-ajusta al agregar o quitar */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow">Objetivos activos</p>
          <button
            onClick={() => setShowNewObjective((v) => !v)}
            className="border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper"
          >
            + Nuevo objetivo
          </button>
        </div>

        {showNewObjective && (
          <Card className="mb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título del objetivo"
                className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
              />
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
              />
              <div className="flex gap-2">
                {["individual", "grupal"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`px-2.5 py-2 font-mono text-[10px] uppercase tracking-widest2 ${
                      newType === t ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={addObjective}
                className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
              >
                Agregar
              </button>
            </div>
          </Card>
        )}

        {objectives.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-display text-2xl tracking-wide text-maroon">Sin objetivos cargados</p>
            <p className="max-w-sm text-sm text-muted">Agregá el primero con "+ Nuevo objetivo".</p>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4">
            {objectives.map((o) => (
              <Card key={o.id} className="flex min-w-[230px] flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{o.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest2 text-muted">vence {o.deadline}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Tag tone={o.type === "grupal" ? "teal" : "maroon"}>{o.type}</Tag>
                    <button
                      onClick={() => deleteObjective(o.id)}
                      aria-label={`Borrar ${o.title}`}
                      title="Borrar"
                      className="text-muted hover:text-maroon"
                    >
                      ✕
                    </button>
                  </span>
                </div>
                <ProgressBar progress={o.progress / 100} tone={o.type === "grupal" ? "teal" : "maroon"} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={o.progress}
                  onChange={(e) => updateObjectiveProgress(o.id, Number(e.target.value))}
                  className="accent-maroon"
                />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rango por ejercicio — paralelo a Power Level, ratio peso levantado / peso
          corporal contra 14 ejercicios curados, agrupados por músculo. */}
      <div className="mb-10">
        <p className="eyebrow mb-4">Rango por ejercicio</p>
        {ranksLoading ? (
          <p className="text-sm text-muted">Cargando...</p>
        ) : muscleGroups.length === 0 ? (
          <Card className="text-sm text-muted">No se pudo cargar el catálogo de ejercicios.</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {muscleGroups.map((muscle) => (
              <Card key={muscle} className="flex flex-col gap-3">
                <p className="eyebrow text-maroon">{muscle}</p>
                {byMuscle[muscle].map((r) => (
                  <div key={r.slug} className="border-t border-line pt-3 first:border-none first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{r.name}</p>
                      {r.tierName ? <Tag tone="teal">{r.tierName}</Tag> : <Tag>Sin marca</Tag>}
                    </div>
                    {r.prKg ? (
                      <>
                        <p className="font-mono text-xs text-muted">
                          PR {r.prKg}kg · ratio {r.ratio?.toFixed(2)}x tu peso
                        </p>
                        <div className="mt-2">
                          <ProgressBar progress={r.progressToNext} />
                        </div>
                      </>
                    ) : (
                      <p className="font-mono text-xs text-muted">
                        Cargá una marca en Entrenamiento para verlo acá.
                      </p>
                    )}
                  </div>
                ))}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Columna izquierda: gráfico mensual + pendientes del Tracker */}
        <div>
          <Card className="mb-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="eyebrow mb-1 text-maroon">Pulso del mes</p>
                <h3 className="font-display text-2xl tracking-wide">{monthLabel(today)}</h3>
              </div>
              <p className="font-mono text-xs text-muted">
                {deltaPts >= 0 ? "▲" : "▼"} {Math.abs(deltaPts)} pts vs. semana anterior
              </p>
            </div>

            {weeklyStats.length === 0 ? (
              <p className="text-sm text-muted">Todavía no hay datos este mes.</p>
            ) : (
              <>
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
                  {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                    <g key={g}>
                      <line
                        x1={padL}
                        x2={chartW - padR}
                        y1={yFor(g)}
                        y2={yFor(g)}
                        stroke="#241014"
                        strokeOpacity="0.1"
                      />
                      <text x={4} y={yFor(g) + 3} fontSize="9" fill="#8A7A6E" fontFamily="monospace">
                        {Math.round(g * 100)}
                      </text>
                    </g>
                  ))}
                  {weeklyStats.map((w, i) => (
                    <text
                      key={w.key}
                      x={xFor(i)}
                      y={chartH - 6}
                      fontSize="10"
                      textAnchor="middle"
                      fill="#8A7A6E"
                      fontFamily="monospace"
                    >
                      {w.label}
                    </text>
                  ))}
                  {["gym", "comida", "suplemento"].map((key) => (
                    <g key={key}>
                      <polyline points={linePoints(key)} fill="none" stroke={LINE_COLORS[key]} strokeWidth="2.5" />
                      {weeklyStats.map((w, i) => (
                        <circle key={i} cx={xFor(i)} cy={yFor(w[key])} r="4" fill={LINE_COLORS[key]} />
                      ))}
                    </g>
                  ))}
                </svg>

                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2" style={{ background: LINE_COLORS.gym }} /> Gym
                  </span>
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2" style={{ background: LINE_COLORS.comida }} /> Comida
                  </span>
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2" style={{ background: LINE_COLORS.suplemento }} /> Suplemento
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 border-t border-maroon/10 pt-3">
                  {worstWeek && (
                    <p className="font-mono text-[10px] text-muted">
                      Aflojaste en <span className="text-maroon">{worstWeek.label}</span> (
                      {Math.round(worstWeek.avg * 100)}%)
                    </p>
                  )}
                  {bestWeek && (
                    <p className="font-mono text-[10px] text-muted">
                      Metiste todo en <span className="text-maroon">{bestWeek.label}</span> (
                      {Math.round(bestWeek.avg * 100)}%)
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>

          {/* Pendientes del Tracker, al costado del gráfico */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="eyebrow mb-3 text-maroon">Hábitos sin marcar hoy</p>
              {pendingHabits.length === 0 ? (
                <p className="text-sm text-muted">Marcaste todo hoy. Bien ahí.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {pendingHabits.map((h) => (
                    <li key={h.id} className="flex items-center gap-2 text-sm">
                      <span>{h.icon}</span>
                      {h.name}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <p className="eyebrow mb-3 text-maroon">Objetivos del Tracker sin cumplir</p>
              {pendingNotes.length === 0 ? (
                <p className="text-sm text-muted">No hay objetivos pendientes en el Tracker.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {pendingNotes.map((n) => (
                    <li key={n.id} className="text-sm">
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* Vegeta — estado general, un poco esquinado a la derecha */}
        <div className="xl:mt-10">
          <p className="eyebrow mb-4">Vegeta — estado general</p>
          <Card className="sticky top-24 flex flex-col gap-5 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <CharacterArt src={current.img} alt={current.name} width={160} height={260} />
              <div>
                <p className="eyebrow mb-1">Power Level {powerLevel.toLocaleString("es-AR")}</p>
                <h3 className="font-display text-2xl tracking-wide text-maroon">{current.name}</h3>
                <Tag tone="teal">{current.tag}</Tag>
              </div>
            </div>

            <div>
              <p className="mb-1 font-mono text-[10px] text-muted">
                {next
                  ? `Próxima: ${next.name} · faltan ${(next.minScore - powerLevel).toLocaleString("es-AR")} pts`
                  : "Nivel máximo alcanzado"}
              </p>
              <ProgressBar progress={progress} tone="teal" />
            </div>

            <p className="text-center font-mono text-[10px] text-muted">
              {deltaPts >= 0 ? "Subiste" : "Bajaste"} {Math.abs(deltaPts)} pts esta semana
            </p>

            <div className="grid grid-cols-2 gap-3 border-t border-maroon/10 pt-4 text-center">
              <div>
                <p className="font-mono text-base font-semibold text-maroon">{gymPoints.toLocaleString("es-AR")}</p>
                <p className="eyebrow">Pts Gym</p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-maroon">
                  {alimentacionPoints.toLocaleString("es-AR")}
                </p>
                <p className="eyebrow">Pts Comida</p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-maroon">
                  {suplementoPoints.toLocaleString("es-AR")}
                </p>
                <p className="eyebrow">Pts Suplem.</p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-maroon">
                  {trackerPoints.toLocaleString("es-AR")}
                </p>
                <p className="eyebrow">Pts Tracker</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-maroon/10 pt-4 text-center">
              <div>
                <p className="font-mono text-base font-semibold text-maroon">{Math.round(monthly.daysComponent * 100)}%</p>
                <p className="eyebrow">Hábitos</p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-maroon">
                  {Math.round(monthly.objectivesComponent * 100)}%
                </p>
                <p className="eyebrow">Objetivos</p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-maroon">{Math.round(trainingScore * 100)}%</p>
                <p className="eyebrow">Entrenamiento</p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-maroon">{Math.round(nutritionScore * 100)}%</p>
                <p className="eyebrow">Nutrición</p>
              </div>
              <div className="col-span-2">
                <p className="font-mono text-base font-semibold text-maroon">
                  {Math.round(supplementationScore * 100)}%
                </p>
                <p className="eyebrow">Suplementos</p>
              </div>
            </div>

            <div className="border-t border-maroon/10 pt-4">
              <p className="eyebrow mb-2 text-maroon">5 mejores ejercicios</p>
              {bestExercises.length === 0 ? (
                <p className="text-xs text-muted">Todavía no hay suficientes marcas para rankear.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {bestExercises.map((ex) => (
                    <li key={ex.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{ex.name}</span>
                      <span className="font-mono text-teal-dark">
                        {ex.growthPct >= 0 ? "+" : ""}
                        {Math.round(ex.growthPct)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-maroon/10 pt-4">
              <p className="eyebrow mb-2 text-maroon">3 peores ejercicios</p>
              {worstExercises.length === 0 ? (
                <p className="text-xs text-muted">Todavía no hay suficientes marcas para rankear.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {worstExercises.map((ex) => (
                    <li key={ex.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{ex.name}</span>
                      <span className="font-mono text-maroon">
                        {ex.growthPct >= 0 ? "+" : ""}
                        {Math.round(ex.growthPct)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
