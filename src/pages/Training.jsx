import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, ChevronDown, Dumbbell } from "lucide-react";
import { PageHeader, Card, Tag, CharacterHero, CharacterArt } from "../components/ui";
import ExerciseGifPreview from "../components/ExerciseGifPreview";
import { useTraining } from "../context/TrainingContext";
import { useCharacter } from "../context/CharacterContext";
import { useRoutines } from "../context/RoutineContext";
import { useWorkoutSession } from "../context/WorkoutSessionContext";
import { useAuth } from "../context/AuthContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getWeekDates, isSameDay } from "../utils/date";
import { apiFetch } from "../utils/apiClient";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Fase 0 P1 — reescritura completa. La versión anterior mostraba: grid de
// ejercicios expandibles + una segunda sección "Todo lo registrado" que
// repetía exactamente los mismos datos en otro formato, + un panel lateral
// de Vegeta con 4 porcentajes — mucho para entender de una. Ahora: hero +
// "Sesión de hoy" (misma rutina que ya arma Rutinas, mirada desde acá, con
// el mismo botón real de empezar sesión guiada) + una lista de ejercicios
// que se expande de a uno para cargar/editar marcas, sin la sección
// duplicada. Ningún dato ni acción se perdió — la vista se reorganizó.
// Personaje: Vegeta como marcador temporal — Entrenamiento debería tener a
// Piccolo (así quedó hablado), pero no hay ningún asset suyo en el proyecto
// todavía. En cuanto exista, este es el único lugar que hay que tocar.
export default function Training() {
  const { exercises, progressLog, addExercise, deleteExercise, addProgress, updateProgress, deleteProgress } =
    useTraining();
  const { token } = useAuth();
  const { current } = useCharacter();
  const { routines } = useRoutines();
  const { session: activeSession, startSession } = useWorkoutSession();
  const navigate = useNavigate();

  const [startingSession, setStartingSession] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [newWeight, setNewWeight] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newDate, setNewDate] = useState(todayISO());
  const [newSpotted, setNewSpotted] = useState(false);

  const [editingMarkId, setEditingMarkId] = useState(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSpotted, setEditSpotted] = useState(false);

  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [newUnit, setNewUnit] = useState("kg");

  // Autocompletado de ejercicios (WorkoutX) — busca a medida que se tipea el
  // nombre, con debounce para no gastar cuota en cada tecla.
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState(null);
  const debouncedName = useDebouncedValue(newName, 400);

  useEffect(() => {
    if (!showNewExercise || debouncedName.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    apiFetch(`/api/external/exercises?q=${encodeURIComponent(debouncedName.trim())}`, { token })
      .then((res) => {
        if (!cancelled) setSuggestions(res);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedName, showNewExercise, token]);

  function selectSuggestion(s) {
    setNewName(s.name);
    setNewMuscle(s.target || s.bodyPart || "");
    setSelectedSuggestionId(s.id);
    setSuggestions([]);
  }

  // Si el ejercicio expandido se borra, cerramos el panel.
  useEffect(() => {
    if (expandedId && !exercises.some((ex) => ex.id === expandedId)) setExpandedId(null);
  }, [exercises, expandedId]);

  // Sesión de hoy — misma rutina que ya calcula el calendario de Rutinas,
  // mirada desde Entrenamiento (día de hoy, no "próxima" como en Dashboard).
  const today = new Date();
  const weekDates = getWeekDates(today);
  const todayIdx = weekDates.findIndex((d) => isSameDay(d, today));
  const todaysRoutine = todayIdx !== -1 ? routines.find((r) => r.daysOfWeek.includes(todayIdx)) : null;

  async function handleStartSession() {
    if (!todaysRoutine) return;
    setStartingSession(true);
    try {
      const res = await startSession(todaysRoutine.id);
      navigate(`/rutinas/sesion/${res.id}`);
    } catch {
      toast.error("No se pudo empezar la sesión.");
    } finally {
      setStartingSession(false);
    }
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingMarkId(null);
    setNewWeight("");
    setNewReps("");
    setNewDate(todayISO());
    setNewSpotted(false);
  }

  function handleAddMark(exerciseId) {
    if (!newWeight && !newReps) return;
    addProgress({ exerciseId, weight: newWeight, reps: newReps, date: newDate, spotted: newSpotted });
    setNewWeight("");
    setNewReps("");
    setNewSpotted(false);
  }

  function startEditMark(row) {
    setEditingMarkId(row.id);
    setEditWeight(String(row.weight ?? ""));
    setEditReps(String(row.reps ?? ""));
    setEditDate(row.date);
    setEditSpotted(!!row.spotted);
  }

  function cancelEditMark() {
    setEditingMarkId(null);
  }

  function saveEditMark() {
    if (!editWeight && !editReps) return;
    updateProgress(editingMarkId, { weight: editWeight, reps: editReps, date: editDate, spotted: editSpotted });
    setEditingMarkId(null);
  }

  function handleDeleteMark(id) {
    deleteProgress(id);
    if (editingMarkId === id) setEditingMarkId(null);
  }

  function handleAddExercise() {
    if (!newName.trim()) return;
    addExercise({ name: newName, muscle: newMuscle, unit: newUnit });
    setNewName("");
    setNewMuscle("");
    setNewUnit("kg");
    setSelectedSuggestionId(null);
    setSuggestions([]);
    setShowNewExercise(false);
  }

  function cancelNewExercise() {
    setNewName("");
    setNewMuscle("");
    setNewUnit("kg");
    setSelectedSuggestionId(null);
    setSuggestions([]);
    setShowNewExercise(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Entrenamiento" title="La disciplina de hoy es la fuerza de mañana." />

      {/* Hero — Vegeta como marcador temporal hasta tener a Piccolo (ver nota arriba) */}
      <CharacterHero
        eyebrow="Etapa actual"
        name={current.name}
        tag={current.tag}
        tone="teal"
        art={<CharacterArt src={current.img} alt={current.name} width={140} height={140} />}
      />

      {/* Sesión de hoy — misma rutina y mismo botón real de Rutinas */}
      <div className="mb-8">
        <p className="eyebrow mb-4">Sesión de hoy</p>
        {todaysRoutine ? (
          <Card>
            <p className="font-display text-2xl tracking-wide">{todaysRoutine.name}</p>
            <p className="font-mono text-xs text-muted">{todaysRoutine.focus}</p>
            <div className="my-4 grid grid-cols-3 gap-2 border-y border-line py-3 text-center">
              <div>
                <p className="font-mono text-lg font-semibold text-ink">{todaysRoutine.exercises.length}</p>
                <p className="eyebrow">Ejercicios</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-ink">
                  {todaysRoutine.exercises.reduce((s, e) => s + (e.targetSets || 0), 0)}
                </p>
                <p className="eyebrow">Series</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-ink">
                  {activeSession && activeSession.routineId === todaysRoutine.id ? "En curso" : "—"}
                </p>
                <p className="eyebrow">Estado</p>
              </div>
            </div>
            <button
              onClick={handleStartSession}
              disabled={startingSession || (activeSession && activeSession.routineId !== todaysRoutine.id)}
              className="w-full bg-maroon px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-paper transition-all duration-250 hover:opacity-90 hover:shadow-glow disabled:opacity-50"
            >
              {activeSession && activeSession.routineId === todaysRoutine.id
                ? "Continuar sesión"
                : startingSession
                ? "..."
                : "Comenzar sesión"}
            </button>
          </Card>
        ) : (
          <Card className="text-center">
            <p className="text-sm text-muted">Sin rutina programada para hoy.</p>
            <button
              onClick={() => navigate("/rutinas")}
              className="mt-2 font-mono text-xs uppercase tracking-widest2 text-maroon underline underline-offset-4"
            >
              Ver Rutinas →
            </button>
          </Card>
        )}
      </div>

      {/* Tus ejercicios — lista táctil, se expande de a uno para cargar o
          editar marcas. Antes esto vivía en un grid de cards + una segunda
          sección entera que repetía lo mismo ("Todo lo registrado"). */}
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow">Tus ejercicios</p>
        <button
          onClick={() => setShowNewExercise((v) => !v)}
          className="font-mono text-[10px] uppercase tracking-widest2 text-maroon underline underline-offset-4"
        >
          + Agregar ejercicio
        </button>
      </div>

      {showNewExercise && (
        <Card className="mb-4">
          <p className="eyebrow mb-1">Nuevo ejercicio</p>
          <p className="mb-2 text-xs text-muted">Tipeá el nombre y sugerimos ejercicios reales de WorkoutX.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setSelectedSuggestionId(null);
                }}
                placeholder="Nombre (ej: Curl bíceps)"
                className="w-full border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
              />
              {suggestions.length > 0 && (
                <div className="hud absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-maroon/25 bg-card text-ink">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectSuggestion(s)}
                      className="flex w-full flex-col items-start gap-0.5 border-b border-maroon/10 px-3 py-2 text-left text-sm last:border-none hover:bg-maroon/10"
                    >
                      <span className="font-semibold">{s.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest2 text-muted">
                        {[s.bodyPart, s.target, s.equipment].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              value={newMuscle}
              onChange={(e) => setNewMuscle(e.target.value)}
              placeholder="Grupo muscular"
              className="w-40 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            <input
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Unidad (kg)"
              className="w-24 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddExercise}
                className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
              >
                Agregar
              </button>
              <button
                onClick={cancelNewExercise}
                className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
              >
                Cancelar
              </button>
            </div>
          </div>
          {selectedSuggestionId && (
            <div className="mt-2 flex items-center gap-3 border-t border-maroon/10 pt-3">
              <ExerciseGifPreview exerciseId={selectedSuggestionId} alt={newName} className="h-20 w-20 border border-maroon/20" />
              <p className="text-xs text-muted">Vista previa de WorkoutX — se agrega junto al ejercicio.</p>
            </div>
          )}
        </Card>
      )}

      {exercises.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-display text-3xl tracking-wide text-maroon">Sin ejercicios cargados</p>
          <p className="max-w-sm text-sm text-muted">Agregá al menos uno arriba para empezar a registrar marcas.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {exercises.map((ex) => {
            const isOpen = expandedId === ex.id;
            const marks = progressLog.filter((p) => p.exerciseId === ex.id).sort((a, b) => b.date.localeCompare(a.date));
            const lastMark = marks[0];
            return (
              <Card key={ex.id} className="flex flex-col gap-0 !p-0">
                <button
                  onClick={() => toggleExpand(ex.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="hud flex h-9 w-9 shrink-0 items-center justify-center border border-line text-muted">
                    <Dumbbell size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{ex.name}</span>
                    <span className="block font-mono text-xs text-muted">
                      {lastMark
                        ? `Último: ${lastMark.weight ? `${lastMark.weight}${ex.unit}` : "—"}${
                            lastMark.reps ? ` × ${lastMark.reps}` : ""
                          }`
                        : "Sin marcas todavía"}
                    </span>
                  </span>
                  {ex.pr ? <Tag tone="gold">PR {ex.pr}{ex.unit}</Tag> : null}
                  {isOpen ? (
                    <ChevronDown size={18} className="shrink-0 text-muted" />
                  ) : (
                    <ChevronRight size={18} className="shrink-0 text-muted" />
                  )}
                </button>

                {isOpen && (
                  <div onClick={(e) => e.stopPropagation()} className="cursor-default border-t border-maroon/10 px-4 pb-4 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-mono text-xs text-muted">{ex.muscle}</p>
                      <button
                        onClick={() => deleteExercise(ex.id)}
                        className="font-mono text-[10px] uppercase tracking-widest2 text-muted underline underline-offset-4 hover:text-maroon"
                      >
                        Borrar ejercicio
                      </button>
                    </div>

                    <p className="eyebrow mb-2">Registrar marca</p>
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        placeholder="Peso (kg)"
                        className="w-28 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <input
                        type="number"
                        value={newReps}
                        onChange={(e) => setNewReps(e.target.value)}
                        placeholder="Reps"
                        className="w-24 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={newSpotted}
                          onChange={(e) => setNewSpotted(e.target.checked)}
                          className="accent-maroon"
                        />
                        Espotada
                      </label>
                      <button
                        onClick={() => handleAddMark(ex.id)}
                        className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                      >
                        Agregar
                      </button>
                    </div>

                    <p className="eyebrow mb-2">Marcas registradas</p>
                    {marks.length === 0 ? (
                      <p className="text-sm text-muted">Todavía no hay marcas para {ex.name}.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {marks.map((m) => (
                          <div key={m.id} className="border-b border-maroon/10 pb-2 text-sm last:border-none">
                            {editingMarkId === m.id ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="number"
                                  value={editWeight}
                                  onChange={(e) => setEditWeight(e.target.value)}
                                  className="w-24 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                                />
                                <input
                                  type="number"
                                  value={editReps}
                                  onChange={(e) => setEditReps(e.target.value)}
                                  className="w-20 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                                />
                                <input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                                />
                                <label className="flex items-center gap-1.5 text-xs text-muted">
                                  <input
                                    type="checkbox"
                                    checked={editSpotted}
                                    onChange={(e) => setEditSpotted(e.target.checked)}
                                    className="accent-maroon"
                                  />
                                  Espotada
                                </label>
                                <button
                                  onClick={saveEditMark}
                                  className="bg-maroon px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={cancelEditMark}
                                  className="border border-maroon/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-mono text-xs text-muted">{m.date}</span>
                                <span className="font-mono font-semibold">{m.weight ? `${m.weight}kg` : "—"}</span>
                                <span className="font-mono text-muted">×</span>
                                <span className="font-mono font-semibold">{m.reps ? `${m.reps} reps` : "—"}</span>
                                {m.spotted && <Tag tone="maroon">espotada</Tag>}
                                <span className="ml-auto flex gap-2">
                                  <button
                                    onClick={() => startEditMark(m)}
                                    aria-label="Editar marca"
                                    title="Editar"
                                    className="text-muted hover:text-maroon"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMark(m.id)}
                                    aria-label="Borrar marca"
                                    title="Borrar"
                                    className="text-muted hover:text-maroon"
                                  >
                                    ✕
                                  </button>
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
