import { useMemo, useState } from "react";
import { CheckSquare, Target, Dumbbell, UtensilsCrossed, Pill, Pencil, X } from "lucide-react";
import { PageHeader, Card, ProgressBar, CharacterArt, CharacterHero } from "../components/ui";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useNutrition } from "../context/NutritionContext";
import { useSupplementation } from "../context/SupplementationContext";
import { usePoints } from "../context/PointsContext";
import { useCharacter } from "../context/CharacterContext";
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
  const { current, next, progress } = useCharacter();

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
        description="La constancia gana más que la intensidad. Es individual, no se comparte."
      />

      {/* Hero — mismo patrón que el resto de las secciones (Nutrición,
          Rutinas, Entrenamiento, Suplementación), no ya el card grande a
          medida que tenía antes. El desglose de los 5 componentes del Power
          Level pasa a su propia fila de abajo (íconos, no texto largo
          apilado) — eso era lo que se pisaba en mobile. */}
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

      {/* UTILITY — de qué se compone el Power Level. Info de apoyo, no
          feature: un solo bloque sin chrome por ítem (antes eran 5 cards
          sueltas, la típica pila "card card card card card"). */}
      <div className="surface-utility mb-8 grid grid-cols-3 gap-4 sm:grid-cols-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <CheckSquare size={18} className="text-maroon" />
          <p className="font-mono text-lg font-semibold text-ink">{Math.round(monthly.daysComponent * 100)}%</p>
          <p className="eyebrow">Hábitos</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Target size={18} className="text-gold" />
          <p className="font-mono text-lg font-semibold text-ink">{Math.round(monthly.objectivesComponent * 100)}%</p>
          <p className="eyebrow">Objetivos</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Dumbbell size={18} className="text-teal" />
          <p className="font-mono text-lg font-semibold text-ink">{Math.round(trainingScore * 100)}%</p>
          <p className="eyebrow">Entreno</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <UtensilsCrossed size={18} className="text-maroon" />
          <p className="font-mono text-lg font-semibold text-ink">{Math.round(nutritionScore * 100)}%</p>
          <p className="eyebrow">Nutrición</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Pill size={18} className="text-gold" />
          <p className="font-mono text-lg font-semibold text-ink">{Math.round(supplementationScore * 100)}%</p>
          <p className="eyebrow">Suplementos</p>
        </div>
      </div>

      {/* FEATURE — Contador mensual: barra grande, 0 a 100% semana a semana + objetivos */}
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

      {/* Grilla de hábitos — antes vivía en un split xl:grid-cols-[1fr_320px]
          con "Objetivos y notas" al lado; en mobile eso hacía que esa
          sección (que tiene alta/edición/borrado, no es un dato de paso)
          cayera hasta el final de la página. Ahora todo fluye en una sola
          columna, hábitos primero por ser lo que se usa a diario. */}
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
            // FEATURE — de tabla HTML a lista táctil — cada hábito es su
            // propia fila con una tira de 7 círculos grandes (mejor target
            // en el celular que una celda de tabla de 24px), alineada bajo
            // un único encabezado de días arriba (no repetido por fila).
            // Cierre visual: las filas dejaron de ser N cards sueltas, ahora
            // viven en un único contenedor con divisores (mismo patrón que
            // Entrenamiento) — es una lista, no una pila de cajas.
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-[1fr_repeat(7,2.25rem)] items-center gap-1 px-1 pb-1 sm:grid-cols-[1fr_repeat(7,2.5rem)]">
                <span />
                {weekDates.map((d, i) => {
                  const isToday = isSameDay(d, today);
                  return (
                    <span
                      key={i}
                      className={`text-center font-mono text-[9px] uppercase tracking-widest2 ${
                        isToday ? "text-teal" : "text-muted"
                      }`}
                    >
                      {isToday ? "HOY" : DIAS_CORTOS[i]}
                    </span>
                  );
                })}
              </div>

              <div className="hud divide-y divide-line/70 border border-line">
              {visibleHabits.map((h) => (
                <div key={h.id} className="p-3">
                  {editingHabitId === h.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          value={editingHabitIcon}
                          onChange={(e) => setEditingHabitIcon(e.target.value)}
                          aria-label="Ícono del hábito"
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
                          aria-label="Nombre del hábito"
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
                    <div className="grid grid-cols-[1fr_repeat(7,2.25rem)] items-center gap-1 sm:grid-cols-[1fr_repeat(7,2.5rem)]">
                      <div className="flex min-w-0 items-center justify-between gap-2 pr-2">
                        <span className="truncate text-sm">
                          <span className="mr-1.5">{h.icon}</span>
                          {h.name}
                        </span>
                        <span className="flex shrink-0 gap-1.5">
                          <button
                            onClick={() => startEditHabit(h)}
                            aria-label="Editar hábito"
                            className="text-muted hover:text-maroon"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(h.id)}
                            aria-label="Borrar hábito"
                            className="text-muted hover:text-maroon"
                            title="Borrar"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      </div>
                      {weekDates.map((d) => {
                        const dateISO = toISO(d);
                        const checked = !!h.checksByDate[dateISO];
                        return (
                          <button
                            key={dateISO}
                            onClick={() => toggleCheck(h.id, dateISO)}
                            aria-label={`${h.name} — ${dateISO}`}
                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all ${
                              checked
                                ? "animate-pop border-maroon bg-maroon text-paper"
                                : "border-maroon/25 bg-transparent text-transparent hover:border-maroon/50"
                            }`}
                          >
                            ✓
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          {/* Alta de hábito nuevo */}
          <Card className="mt-4">
            <p className="eyebrow mb-3">Nuevo hábito</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={newHabitIcon}
                onChange={(e) => setNewHabitIcon(e.target.value)}
                placeholder="🔥"
                aria-label="Ícono del nuevo hábito"
                className="w-14 border border-maroon/20 bg-transparent px-2 py-2 text-center text-sm outline-none focus:border-maroon"
              />
              <input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
                placeholder="Nombre del hábito..."
                aria-label="Nombre del nuevo hábito"
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
                        aria-label="Editar objetivo o aclaración"
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
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        aria-label="Borrar objetivo"
                        className="text-muted hover:text-maroon"
                        title="Borrar"
                      >
                        <X size={14} />
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
                aria-label="Nuevo objetivo o aclaración"
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
  );
}
