import { useMemo, useState } from "react";
import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import { vegetaEvolution } from "../data/mockData";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useNutrition } from "../context/NutritionContext";
import { useSupplementation } from "../context/SupplementationContext";
import { usePoints } from "../context/PointsContext";
import { getVegetaStage } from "../utils/evolution";
import { DIAS_CORTOS, getWeekDates, addWeeks, toISO, isSameDay, monthLabel, monthStats } from "../utils/date";

const TYPE_BUTTON_CLS = (active) =>
  `px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 ${
    active ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
  }`;

export default function Tracker() {
  const {
    habits,
    notes,
    today,
    monthly,
    trackerScore,
    toggleCheck,
    addHabit,
    updateHabit,
    deleteHabit,
    addNote,
    toggleNote,
    updateNote,
    deleteNote,
  } = useTracker();
  const { trainingScore } = useTraining();
  const { nutritionScore } = useNutrition();
  const { supplementationScore } = useSupplementation();
  const { powerLevel } = usePoints();

  const [noteInput, setNoteInput] = useState("");
  const [filter, setFilter] = useState("todos");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("⭐");
  const [newHabitType, setNewHabitType] = useState("gym");
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editingHabitName, setEditingHabitName] = useState("");
  const [editingHabitIcon, setEditingHabitIcon] = useState("");
  const [editingHabitType, setEditingHabitType] = useState("gym");

  const viewedWeekAnchor = useMemo(() => addWeeks(today, weekOffset), [today, weekOffset]);
  const weekDates = useMemo(() => getWeekDates(viewedWeekAnchor), [viewedWeekAnchor]);

  // El progreso de Vegeta ahora sube por el Power Level real (Entrenamiento +
  // Suplementos + Alimentación + Tracker) — ver utils/points.js.
  const { current, next, progress } = getVegetaStage(powerLevel, vegetaEvolution);

  function handleAddHabit() {
    if (!newHabitName.trim()) return;
    addHabit({ name: newHabitName, icon: newHabitIcon, type: newHabitType });
    setNewHabitName("");
    setNewHabitIcon("⭐");
  }

  function startEditHabit(h) {
    setEditingHabitId(h.id);
    setEditingHabitName(h.name);
    setEditingHabitIcon(h.icon);
    setEditingHabitType(h.type);
  }

  function cancelEditHabit() {
    setEditingHabitId(null);
    setEditingHabitName("");
    setEditingHabitIcon("");
  }

  function saveEditHabit() {
    if (!editingHabitName.trim()) return;
    updateHabit(editingHabitId, {
      name: editingHabitName.trim(),
      icon: editingHabitIcon.trim() || "⭐",
      type: editingHabitType,
    });
    cancelEditHabit();
  }

  function handleDeleteHabit(id) {
    deleteHabit(id);
    if (editingHabitId === id) cancelEditHabit();
  }

  function handleAddNote() {
    if (!noteInput.trim()) return;
    addNote(noteInput);
    setNoteInput("");
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditingText(note.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  function saveEdit() {
    if (!editingText.trim()) return;
    updateNote(editingId, editingText);
    cancelEdit();
  }

  function handleDeleteNote(id) {
    deleteNote(id);
    if (editingId === id) cancelEdit();
  }

  const visibleHabits = habits.filter((h) => filter === "todos" || h.type === filter);

  return (
    <div>
      <PageHeader
        eyebrow="Tracker · Personal"
        title="Tracker de Hábitos"
        description="Marcá tus días, entrená seguido y mirá cómo evoluciona Vegeta con tu progreso. Es individual, no se comparte con nadie."
      />

      {/* Evolución de Vegeta — combina hábitos+objetivos (Tracker) y marcas (Entrenamiento) */}
      <Card className="mb-8 flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <CharacterArt src={current.img} alt={current.name} size={168} />
          <div>
            <p className="eyebrow mb-1">Etapa actual · Power Level {powerLevel.toLocaleString("es-AR")}</p>
            <h2 className="font-display text-5xl tracking-wide text-maroon">{current.name}</h2>
            <Tag tone="teal">{current.tag}</Tag>

            <div className="mt-5 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-5">
              <div>
                <p className="font-mono text-lg font-semibold text-maroon">
                  {Math.round(monthly.daysComponent * 100)}%
                </p>
                <p className="eyebrow">Hábitos</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-maroon">
                  {Math.round(monthly.objectivesComponent * 100)}%
                </p>
                <p className="eyebrow">Objetivos</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-maroon">{Math.round(trainingScore * 100)}%</p>
                <p className="eyebrow">Entrenamiento</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-maroon">{Math.round(nutritionScore * 100)}%</p>
                <p className="eyebrow">Nutrición</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-maroon">
                  {Math.round(supplementationScore * 100)}%
                </p>
                <p className="eyebrow">Suplementos</p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <p className="mb-2 font-mono text-xs text-muted">
            {next
              ? `Próxima: ${next.name} en ${(next.minScore - powerLevel).toLocaleString("es-AR")} pts`
              : "Nivel máximo alcanzado"}
          </p>
          <ProgressBar progress={progress} tone="teal" />
        </div>
      </Card>

      <p className="mb-8 text-xs text-muted">
        * El arte de cada etapa se sube en{" "}
        <span className="font-semibold text-maroon">Personalización</span> / carpeta{" "}
        <code className="font-mono">public/characters</code>. No podemos generar arte con personajes
        registrados de Dragon Ball.
      </p>

      {/* Contador mensual — barra grande, 0 a 100% semana a semana + objetivos */}
      <Card className="mb-8 py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1 text-maroon">Contador mensual</p>
            <h3 className="font-display text-3xl tracking-wide">{monthLabel(today)}</h3>
          </div>
          <p className="font-mono text-xs text-muted">
            Hábitos 70% · Objetivos cumplidos 30% · {monthly.weeksCount} semana(s) transcurrida(s)
          </p>
        </div>

        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-mono text-4xl font-semibold text-maroon">{Math.round(monthly.pct * 100)}%</span>
        </div>
        <ProgressBar progress={monthly.pct} tone="teal" />

        {habits.length > 0 && (
          <div className="mt-6 grid gap-2 border-t border-maroon/10 pt-4 sm:grid-cols-3">
            {habits.map((h) => {
              const m = monthStats(h.checksByDate, today);
              return (
                <div key={h.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    <span className="mr-1.5">{h.icon}</span>
                    {h.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {Math.round(m.pct * 100)}% · {m.checked}/{m.totalDays}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Grilla de hábitos estilo planilla — navegable semana a semana */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                aria-label="Semana anterior"
                className="border border-maroon/25 px-2 py-1 text-maroon hover:bg-maroon/10"
              >
                ‹
              </button>
              <p className="eyebrow">
                {weekOffset === 0 ? "Hoy — semana del " : "Semana del "}
                {toISO(weekDates[0]).slice(8)}/{toISO(weekDates[0]).slice(5, 7)} al{" "}
                {toISO(weekDates[6]).slice(8)}/{toISO(weekDates[6]).slice(5, 7)}
              </p>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                aria-label="Semana siguiente"
                className="border border-maroon/25 px-2 py-1 text-maroon hover:bg-maroon/10"
              >
                ›
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
                className={`font-mono text-[10px] uppercase tracking-widest2 underline underline-offset-4 ${
                  weekOffset === 0 ? "text-muted/40" : "text-muted hover:text-maroon"
                }`}
              >
                Volver a la actualidad
              </button>
            </div>
            <div className="flex gap-2">
              {["todos", "gym", "personal"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 ${
                    filter === f ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {habits.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="font-display text-3xl tracking-wide text-maroon">Ponte a Trabajar, Insecto</p>
              <p className="max-w-sm text-sm text-muted">
                Borraste todos los hábitos. Sin hábitos no hay progreso — cargá al menos uno abajo para
                que Vegeta empiece a subir de nivel.
              </p>
            </Card>
          ) : (
            <Card hud={false} className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b-2 border-maroon/20 bg-maroon px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest2 text-paper">
                      Hábito
                    </th>
                    {weekDates.map((d, i) => {
                      const isToday = isSameDay(d, today);
                      return (
                        <th
                          key={i}
                          className={`border-b-2 border-maroon/20 px-2 py-3 text-center font-mono text-[11px] uppercase tracking-widest2 text-paper ${
                            isToday ? "bg-teal-dark" : "bg-teal"
                          }`}
                        >
                          <div>{isToday ? "HOY" : DIAS_CORTOS[i]}</div>
                          <div className="text-[10px] opacity-80">{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visibleHabits.map((h, rowIdx) => (
                    <tr key={h.id} className={rowIdx % 2 === 0 ? "bg-card" : "bg-cream/50"}>
                      <td className="border-b border-maroon/10 px-4 py-3">
                        {editingHabitId === h.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                value={editingHabitIcon}
                                onChange={(e) => setEditingHabitIcon(e.target.value)}
                                className="w-12 border border-maroon/30 bg-transparent px-2 py-1 text-center text-sm outline-none focus:border-maroon"
                              />
                              <input
                                value={editingHabitName}
                                onChange={(e) => setEditingHabitName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditHabit();
                                  if (e.key === "Escape") cancelEditHabit();
                                }}
                                autoFocus
                                className="flex-1 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex gap-2">
                                {["gym", "personal"].map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => setEditingHabitType(t)}
                                    className={TYPE_BUTTON_CLS(editingHabitType === t)}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={saveEditHabit}
                                  className="bg-maroon px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={cancelEditHabit}
                                  className="border border-maroon/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span>
                              <span className="mr-2">{h.icon}</span>
                              {h.name}
                            </span>
                            <span className="flex shrink-0 gap-1.5">
                              <button
                                onClick={() => startEditHabit(h)}
                                aria-label="Editar hábito"
                                className="text-muted hover:text-maroon"
                                title="Editar"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDeleteHabit(h.id)}
                                aria-label="Borrar hábito"
                                className="text-muted hover:text-maroon"
                                title="Borrar"
                              >
                                ✕
                              </button>
                            </span>
                          </div>
                        )}
                      </td>
                      {editingHabitId === h.id
                        ? weekDates.map((d) => <td key={toISO(d)} className="border-b border-maroon/10 bg-cream/30" />)
                        : weekDates.map((d) => {
                            const dateISO = toISO(d);
                            const checked = !!h.checksByDate[dateISO];
                            return (
                              <td key={dateISO} className="border-b border-maroon/10 px-2 py-3 text-center">
                                <button
                                  onClick={() => toggleCheck(h.id, dateISO)}
                                  aria-label={`${h.name} — ${dateISO}`}
                                  className={`inline-flex h-6 w-6 items-center justify-center border transition-all ${
                                    checked
                                      ? "animate-pop border-maroon bg-maroon text-paper"
                                      : "border-maroon/25 bg-transparent text-transparent hover:border-maroon/50"
                                  }`}
                                >
                                  ✓
                                </button>
                              </td>
                            );
                          })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Alta de hábito nuevo */}
          <Card className="mt-4">
            <p className="eyebrow mb-3">Nuevo hábito</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={newHabitIcon}
                onChange={(e) => setNewHabitIcon(e.target.value)}
                placeholder="🔥"
                className="w-14 border border-maroon/20 bg-transparent px-2 py-2 text-center text-sm outline-none focus:border-maroon"
              />
              <input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
                placeholder="Nombre del hábito..."
                className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
              />
              <div className="flex gap-2">
                {["gym", "personal"].map((t) => (
                  <button key={t} onClick={() => setNewHabitType(t)} className={TYPE_BUTTON_CLS(newHabitType === t)}>
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddHabit}
                className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
              >
                Agregar hábito
              </button>
            </div>
          </Card>
        </div>

        {/* Panel de objetivos y aclaraciones — con alta / edición / borrado, sin categorías */}
        <div>
          <p className="eyebrow mb-4">Objetivos y notas</p>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {notes.length === 0 && (
                <p className="text-sm text-muted">Todavía no cargaste objetivos. Agregá uno abajo.</p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="border-b border-maroon/10 pb-2 text-sm last:border-none">
                  {editingId === n.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        className="border border-maroon/30 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-maroon"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="bg-maroon px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="border border-maroon/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={n.done}
                        onChange={() => toggleNote(n.id)}
                        className="mt-0.5 accent-maroon"
                      />
                      <span className={`flex-1 ${n.done ? "text-muted line-through" : ""}`}>{n.text}</span>
                      <button
                        onClick={() => startEdit(n)}
                        aria-label="Editar objetivo"
                        className="text-muted hover:text-maroon"
                        title="Editar"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        aria-label="Borrar objetivo"
                        className="text-muted hover:text-maroon"
                        title="Borrar"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-maroon/10 pt-4">
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="Nuevo objetivo o aclaración..."
                className="border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
              />
              <button
                onClick={handleAddNote}
                className="bg-maroon px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
              >
                Agregar
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
