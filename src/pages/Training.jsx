import { useEffect, useState } from "react";
import { PageHeader, Card, Tag, ProgressBar, CharacterArt } from "../components/ui";
import ExerciseGifPreview from "../components/ExerciseGifPreview";
import { useTraining } from "../context/TrainingContext";
import { useTracker } from "../context/TrackerContext";
import { useNutrition } from "../context/NutritionContext";
import { useSupplementation } from "../context/SupplementationContext";
import { usePoints } from "../context/PointsContext";
import { useAuth } from "../context/AuthContext";
import { useCharacter } from "../context/CharacterContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { apiFetch } from "../utils/apiClient";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Training() {
  const {
    exercises,
    progressLog,
    addExercise,
    deleteExercise,
    addProgress,
    updateProgress,
    deleteProgress,
    trainingScore,
  } = useTraining();
  const { trackerScore } = useTracker();
  const { nutritionScore } = useNutrition();
  const { supplementationScore } = useSupplementation();
  const { powerLevel } = usePoints();
  const { token } = useAuth();

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

  const { current, next, progress } = useCharacter();

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
      <PageHeader
        eyebrow="Entrenamiento"
        title="Progreso por ejercicio"
        description="Hacé click en un ejercicio para ver sus marcas y cargar, editar o borrar peso y repeticiones ahí mismo. El Press banca mueve tu escala de poder, y tus marcas + el Tracker mueven a Vegeta."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
        <div>
          {exercises.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="font-display text-3xl tracking-wide text-maroon">Sin ejercicios cargados</p>
              <p className="max-w-sm text-sm text-muted">Agregá al menos uno abajo para empezar a registrar marcas.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {exercises.map((ex) => {
                const isOpen = expandedId === ex.id;
                const marks = progressLog
                  .filter((p) => p.exerciseId === ex.id)
                  .sort((a, b) => b.date.localeCompare(a.date));

                return (
                  <Card
                    key={ex.id}
                    onClick={() => toggleExpand(ex.id)}
                    className={`flex cursor-pointer flex-col gap-3 ${isOpen ? "sm:col-span-2 xl:col-span-3" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{ex.name}</p>
                        <p className="font-mono text-xs text-muted">{ex.muscle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag>{ex.trend}</Tag>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteExercise(ex.id);
                          }}
                          aria-label={`Borrar ${ex.name}`}
                          title="Borrar ejercicio"
                          className="text-muted hover:text-maroon"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="font-display text-4xl">
                      {ex.pr}
                      <span className="ml-1 text-base font-body text-muted">{ex.unit}</span>
                    </p>

                    {isOpen && (
                      <div onClick={(e) => e.stopPropagation()} className="cursor-default border-t border-maroon/10 pt-4">
                        {/* Registrar marca para este ejercicio */}
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

                        {/* Marcas cargadas */}
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

          {/* Alta de ejercicio nuevo */}
          <Card className="mt-4">
            {!showNewExercise ? (
              <button
                onClick={() => setShowNewExercise(true)}
                className="font-mono text-xs uppercase tracking-widest2 text-maroon underline underline-offset-4"
              >
                + Agregar ejercicio a la biblioteca
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="eyebrow mb-1">Nuevo ejercicio</p>
                <p className="mb-1 text-xs text-muted">
                  Empezá a tipear el nombre y te sugerimos ejercicios reales (con gif) de la base de WorkoutX.
                </p>
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
                    <ExerciseGifPreview
                      exerciseId={selectedSuggestionId}
                      alt={newName}
                      className="h-20 w-20 border border-maroon/20"
                    />
                    <p className="text-xs text-muted">Vista previa de WorkoutX — se agrega junto al ejercicio.</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Todo lo registrado — una columna vertical por ejercicio, lado a lado */}
          <div className="mt-6">
            <p className="eyebrow mb-4">Todo lo registrado</p>
            {exercises.length === 0 ? (
              <p className="text-sm text-muted">Todavía no hay ejercicios ni marcas.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {exercises.map((ex) => {
                  const marks = progressLog
                    .filter((p) => p.exerciseId === ex.id)
                    .sort((a, b) => b.date.localeCompare(a.date));
                  return (
                    <Card key={ex.id} hud={false} className="flex flex-col gap-3 p-0">
                      <p className="border-b border-maroon/15 bg-maroon px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest2 text-paper">
                        {ex.name}
                      </p>
                      <div className="flex flex-col px-4 pb-4">
                        {marks.length === 0 ? (
                          <p className="py-2 text-xs text-muted">Sin marcas todavía.</p>
                        ) : (
                          marks.map((m) => (
                            <div key={m.id} className="border-b border-maroon/10 py-2.5 last:border-none">
                              <p className="font-mono text-[10px] uppercase tracking-widest2 text-maroon">{m.date}</p>
                              <p className="font-mono text-sm font-semibold">
                                {m.weight ? `${m.weight}kg` : "—"} × {m.reps ? `${m.reps} reps` : "—"}
                              </p>
                              {m.spotted && <Tag tone="maroon">espotada</Tag>}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Vegeta evolucionando — combina Tracker + Entrenamiento (peso y reps), imagen completa vertical */}
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
