import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, Tag, CharacterArt, ProgressBar } from "../components/ui";
import { routines as initialRoutines, vegetaTraining } from "../data/mockData";
import { DIAS_CORTOS, getWeekDates, toISO, isSameDay } from "../utils/date";
import { useTracker } from "../context/TrackerContext";

function getVegetaTrainingStage(daysTrained) {
  const idx = Math.min(daysTrained, vegetaTraining.length - 1);
  return vegetaTraining[idx];
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const DAY_BTN_CLS = (active) =>
  `flex h-8 w-8 items-center justify-center font-mono text-[10px] uppercase ${
    active ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon hover:bg-maroon/10"
  }`;

export default function Routines() {
  const [routines, setRoutines] = useState(initialRoutines);
  const [expandedId, setExpandedId] = useState(null);

  const [showNewRoutine, setShowNewRoutine] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFocus, setNewFocus] = useState("");

  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("");
  const [newExReps, setNewExReps] = useState("");

  const [editingExId, setEditingExId] = useState(null);
  const [editExName, setEditExName] = useState("");
  const [editExSets, setEditExSets] = useState("");
  const [editExReps, setEditExReps] = useState("");

  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [editRoutineName, setEditRoutineName] = useState("");
  const [editRoutineFocus, setEditRoutineFocus] = useState("");

  const { habits } = useTracker();

  const today = new Date();
  const weekDates = getWeekDates(today);

  const gymHabit = habits.find((h) => h.type === "gym");
  const daysTrainedThisWeek = weekDates.filter((d) => gymHabit?.checksByDate?.[toISO(d)]).length;
  const vegetaStage = getVegetaTrainingStage(daysTrainedThisWeek);
  const weekProgress = Math.min(1, daysTrainedThisWeek / (vegetaTraining.length - 1));

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingExId(null);
    setEditingRoutineId(null);
    setNewExName("");
    setNewExSets("");
    setNewExReps("");
  }

  function addRoutine() {
    if (!newName.trim()) return;
    setRoutines((prev) => [
      ...prev,
      { id: `routine-${Date.now()}`, name: newName.trim(), focus: newFocus.trim() || "General", days: [], exercises: [] },
    ]);
    setNewName("");
    setNewFocus("");
    setShowNewRoutine(false);
  }

  function deleteRoutine(id) {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function startEditRoutine(r) {
    setEditingRoutineId(r.id);
    setEditRoutineName(r.name);
    setEditRoutineFocus(r.focus);
  }

  function cancelEditRoutine() {
    setEditingRoutineId(null);
  }

  function saveEditRoutine() {
    if (!editRoutineName.trim()) return;
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === editingRoutineId
          ? { ...r, name: editRoutineName.trim(), focus: editRoutineFocus.trim() || "General" }
          : r
      )
    );
    setEditingRoutineId(null);
  }

  function toggleDay(routineId, dayIndex) {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.includes(dayIndex) ? r.days.filter((d) => d !== dayIndex) : [...r.days, dayIndex].sort(),
            }
          : r
      )
    );
  }

  function addExercise(routineId) {
    if (!newExName.trim()) return;
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId
          ? {
              ...r,
              exercises: [
                ...r.exercises,
                { id: `ex-${Date.now()}`, name: newExName.trim(), sets: Number(newExSets) || 0, reps: Number(newExReps) || 0 },
              ],
            }
          : r
      )
    );
    setNewExName("");
    setNewExSets("");
    setNewExReps("");
  }

  function startEditExercise(ex) {
    setEditingExId(ex.id);
    setEditExName(ex.name);
    setEditExSets(String(ex.sets ?? ""));
    setEditExReps(String(ex.reps ?? ""));
  }

  function cancelEditExercise() {
    setEditingExId(null);
  }

  function saveEditExercise(routineId) {
    if (!editExName.trim()) return;
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId
          ? {
              ...r,
              exercises: r.exercises.map((ex) =>
                ex.id === editingExId
                  ? { ...ex, name: editExName.trim(), sets: Number(editExSets) || 0, reps: Number(editExReps) || 0 }
                  : ex
              ),
            }
          : r
      )
    );
    setEditingExId(null);
  }

  function deleteExercise(routineId, exId) {
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, exercises: r.exercises.filter((ex) => ex.id !== exId) } : r))
    );
    if (editingExId === exId) setEditingExId(null);
  }

  const weeklyDaysUsed = new Set(routines.flatMap((r) => r.days)).size;

  return (
    <div>
      <PageHeader
        eyebrow="Rutinas"
        title="Biblioteca de rutinas"
        description="Armá tus rutinas, elegí qué días de la semana entrenás cada una, y cargá los ejercicios con series y repeticiones."
        action={
          <button
            onClick={() => setShowNewRoutine((v) => !v)}
            className="border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper"
          >
            + Nueva rutina
          </button>
        }
      />

      {showNewRoutine && (
        <Card className="mb-6">
          <p className="eyebrow mb-3">Nueva rutina</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre (ej: Día de Empuje)"
              className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            <input
              value={newFocus}
              onChange={(e) => setNewFocus(e.target.value)}
              placeholder="Grupos musculares"
              className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            <div className="flex gap-2">
              <button
                onClick={addRoutine}
                className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
              >
                Crear
              </button>
              <button
                onClick={() => setShowNewRoutine(false)}
                className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
      <div>

      {/* Recordatorios rápidos a las otras secciones */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/entrenamiento"
          className="hud flex items-center justify-between border border-maroon/25 bg-card px-4 py-3 text-sm hover:bg-maroon/5"
        >
          <span>
            <span className="mr-2">🏋️</span>No te olvides de registrar tu marca de hoy
          </span>
          <span className="font-mono text-xs text-maroon">Entrenamiento →</span>
        </Link>
        <Link
          to="/tracker"
          className="hud flex items-center justify-between border border-maroon/25 bg-card px-4 py-3 text-sm hover:bg-maroon/5"
        >
          <span>
            <span className="mr-2">✅</span>Marcá el día en el Tracker de hábitos
          </span>
          <span className="font-mono text-xs text-maroon">Tracker →</span>
        </Link>
      </div>

      {/* Calendario semanal — qué rutina toca cada día */}
      <Card className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow text-maroon">Calendario de la semana</p>
          <p className="font-mono text-xs text-muted">Entrenás {weeklyDaysUsed} día(s) por semana</p>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((d, i) => {
            const dayRoutines = routines.filter((r) => r.days.includes(i));
            const isToday = isSameDay(d, today);
            return (
              <div key={toISO(d)} className={`border p-2 text-center ${isToday ? "border-maroon bg-maroon/5" : "border-maroon/15"}`}>
                <p className="font-mono text-[10px] uppercase tracking-widest2 text-muted">
                  {isToday ? "Hoy" : DIAS_CORTOS[i]}
                </p>
                <p className="mb-2 font-mono text-xs text-muted">{d.getDate()}</p>
                <div className="flex flex-col gap-1">
                  {dayRoutines.length === 0 ? (
                    <span className="font-mono text-[10px] text-muted/60">Descanso</span>
                  ) : (
                    dayRoutines.map((r) => (
                      <span key={r.id} className="bg-maroon px-1.5 py-1 font-mono text-[9px] leading-tight text-paper">
                        {r.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Rutinas — clickeables, se expanden para editar días y ejercicios */}
      {routines.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-display text-3xl tracking-wide text-maroon">Sin rutinas cargadas</p>
          <p className="max-w-sm text-sm text-muted">Creá tu primera rutina con "+ Nueva rutina" arriba.</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {routines.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card
                key={r.id}
                onClick={() => toggleExpand(r.id)}
                className={`flex cursor-pointer flex-col gap-4 ${isOpen ? "lg:col-span-2 xl:col-span-3" : ""}`}
              >
                {editingRoutineId === r.id ? (
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={editRoutineName}
                      onChange={(e) => setEditRoutineName(e.target.value)}
                      placeholder="Nombre de la rutina"
                      className="border border-maroon/30 bg-transparent px-3 py-2 text-lg outline-none focus:border-maroon"
                    />
                    <input
                      value={editRoutineFocus}
                      onChange={(e) => setEditRoutineFocus(e.target.value)}
                      placeholder="Grupos musculares"
                      className="border border-maroon/30 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditRoutine}
                        className="bg-maroon px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEditRoutine}
                        className="border border-maroon/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="eyebrow mb-1">{r.focus}</p>
                      <h3 className="font-display text-3xl tracking-wide">{r.name}</h3>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditRoutine(r);
                        }}
                        aria-label={`Editar ${r.name}`}
                        title="Editar rutina"
                        className="text-muted hover:text-maroon"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoutine(r.id);
                        }}
                        aria-label={`Borrar ${r.name}`}
                        title="Borrar rutina"
                        className="text-muted hover:text-maroon"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div onClick={(e) => e.stopPropagation()}>
                  <p className="eyebrow mb-1.5">Días de entrenamiento · click para ajustar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_NAMES.map((label, i) => (
                      <button
                        key={label}
                        onClick={() => toggleDay(r.id, i)}
                        aria-label={label}
                        title={label}
                        className={DAY_BTN_CLS(r.days.includes(i))}
                      >
                        {DIAS_CORTOS[i]}
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="flex flex-col gap-2">
                  {r.exercises.map((ex) => (
                    <li key={ex.id} className="flex items-center gap-3 border-b border-ink/10 pb-2 text-sm last:border-none">
                      <span className="hud flex h-8 w-8 shrink-0 items-center justify-center border border-ink/20 text-[9px] font-mono text-muted">
                        VID
                      </span>
                      {isOpen && editingExId === ex.id ? (
                        <div
                          className="flex flex-1 flex-wrap items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            value={editExName}
                            onChange={(e) => setEditExName(e.target.value)}
                            className="flex-1 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                          />
                          <input
                            type="number"
                            value={editExSets}
                            onChange={(e) => setEditExSets(e.target.value)}
                            placeholder="Series"
                            className="w-16 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                          />
                          <span className="text-muted">×</span>
                          <input
                            type="number"
                            value={editExReps}
                            onChange={(e) => setEditExReps(e.target.value)}
                            placeholder="Reps"
                            className="w-16 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                          />
                          <button
                            onClick={() => saveEditExercise(r.id)}
                            className="bg-maroon px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEditExercise}
                            className="border border-maroon/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <span>{ex.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted">
                              {ex.sets || "—"}x{ex.reps || "—"}
                            </span>
                            {isOpen && (
                              <span className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => startEditExercise(ex)}
                                  aria-label="Editar ejercicio"
                                  title="Editar"
                                  className="text-muted hover:text-maroon"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => deleteExercise(r.id, ex.id)}
                                  aria-label="Borrar ejercicio"
                                  title="Borrar"
                                  className="text-muted hover:text-maroon"
                                >
                                  ✕
                                </button>
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <Tag>{r.exercises.length} ejercicios</Tag>

                {isOpen && (
                  <div className="border-t border-maroon/10 pt-4" onClick={(e) => e.stopPropagation()}>
                    <p className="eyebrow mb-2">Agregar ejercicio</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        placeholder="Nombre del ejercicio"
                        className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <input
                        type="number"
                        value={newExSets}
                        onChange={(e) => setNewExSets(e.target.value)}
                        placeholder="Series"
                        className="w-20 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <input
                        type="number"
                        value={newExReps}
                        onChange={(e) => setNewExReps(e.target.value)}
                        placeholder="Reps"
                        className="w-20 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <button
                        onClick={() => addExercise(r.id)}
                        className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      </div>

      {/* Vegeta entrenando — evoluciona según los días entrenados esta semana */}
      <div>
        <p className="eyebrow mb-4">Vegeta de la semana</p>
        <Card className="sticky top-24 flex flex-col items-center gap-4 py-8">
          <CharacterArt src={vegetaStage.img} alt={vegetaStage.tag} width={200} height={200} />
          <div className="text-center">
            <p className="eyebrow mb-1">{daysTrainedThisWeek} día(s) entrenados</p>
            <h3 className="font-display text-2xl tracking-wide text-maroon">{vegetaStage.tag}</h3>
          </div>
          <ProgressBar progress={weekProgress} />
          <p className="text-center text-xs text-muted">
            Cada día que marqués "Entrenar en el gimnasio" en el Tracker suma acá. Se reinicia cada semana.
          </p>
        </Card>
      </div>

      </div>
    </div>
  );
}
