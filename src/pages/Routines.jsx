import { useEffect, useState } from "react";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";
import { Pencil, X } from "lucide-react";
import { PageHeader, Card, Tag, CharacterHero } from "../components/ui";
import CharacterFlipbook from "../components/CharacterFlipbook";
import { vegetaTraining } from "../data/mockData";
import { DIAS_CORTOS, getWeekDates, toISO, isSameDay } from "../utils/date";
import { useTrainingGoals } from "../context/TrainingGoalContext";
import { useRoutines } from "../context/RoutineContext";
import { useTraining } from "../context/TrainingContext";
import { useWorkoutSession } from "../context/WorkoutSessionContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { apiFetch } from "../utils/apiClient";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Mismo estilo que ya usa Groups.jsx para <select> — bg-paper + text-ink en
// vez de bg-transparent, porque el desplegable nativo del navegador toma el
// color de fondo del <select> para pintar sus opciones, y "transparent" cae
// al blanco del sistema (se veía roto sobre el tema oscuro).
const SELECT_CLS =
  "border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon";

function getVegetaTrainingStage(daysTrained) {
  const idx = Math.min(daysTrained, vegetaTraining.length - 1);
  return vegetaTraining[idx];
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const DAY_BTN_CLS = (active) =>
  `flex h-8 w-8 items-center justify-center font-mono text-[10px] uppercase ${
    active ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon hover:bg-maroon/10"
  }`;

// Mismo set cerrado que valida el backend (RoutinesController.ValidFocuses).
const FOCUS_OPTIONS = ["GENERAL", "STRENGTH", "HYPERTROPHY", "ENDURANCE", "POWER", "TECHNIQUE"];

function repsLabel(ex) {
  if (ex.repRangeMin == null && ex.repRangeMax == null) return "—";
  if (ex.repRangeMax == null || ex.repRangeMax === ex.repRangeMin) return String(ex.repRangeMin);
  return `${ex.repRangeMin}–${ex.repRangeMax}`;
}

// Insight determinista de rutina (Fase 5) — sin IA: compara las últimas dos
// sesiones completadas para la tendencia de volumen, y cuenta cuántas de las
// sesiones completadas de ESTA semana caen en los días programados de la
// rutina para la constancia. Todo calculado del lado del cliente a partir
// del historial real (GET /api/workout-sessions?routineId=), sin inventar
// un endpoint de "insights" aparte.
function computeRoutineInsight(routine, sessions, weekDates) {
  const completed = (sessions || [])
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const weekIsoSet = new Set(weekDates.map((d) => toISO(d)));
  const trainedThisWeek = completed.filter((s) => weekIsoSet.has(s.startedAt.slice(0, 10))).length;
  const scheduledDays = routine.daysOfWeek.length;

  let volumeTrend = null;
  if (completed.length >= 2 && completed[0].totalVolume != null && completed[1].totalVolume > 0) {
    const [latest, prev] = completed;
    const deltaPct = Math.round(((latest.totalVolume - prev.totalVolume) / prev.totalVolume) * 100);
    if (deltaPct >= 3) volumeTrend = `Volumen en alza — +${deltaPct}% respecto a la sesión anterior.`;
    else if (deltaPct <= -3) volumeTrend = `Volumen bajó ${Math.abs(deltaPct)}% respecto a la sesión anterior.`;
    else volumeTrend = "Volumen estable respecto a la sesión anterior.";
  }

  return { completed, trainedThisWeek, scheduledDays, volumeTrend };
}

export default function Routines() {
  const {
    routines,
    loading: routinesLoading,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    updateRoutineExercise,
    deleteRoutineExercise,
  } = useRoutines();
  const { exercises, addExercise: addTrainingExercise, addProgress } = useTraining();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { session: activeSession, checkActive, startSession, listSessions } = useWorkoutSession();
  const [startingId, setStartingId] = useState(null);
  // Historial por rutina (Fase 5), cargado bajo demanda al expandir una
  // rutina — clave = routineId, valor = lista de WorkoutSessionSummaryDto.
  const [routineHistory, setRoutineHistory] = useState({});

  const [expandedId, setExpandedId] = useState(null);
  // Dentro de una rutina expandida, "Historial y constancia" y "Agregar
  // ejercicio" arrancan colapsados — son las dos secciones más densas y no
  // hacen falta para el uso más común (mirar/editar los ejercicios ya
  // cargados). Solo puede haber una rutina expandida a la vez, así que este
  // estado vive a nivel página en vez de por card.
  const [showHistory, setShowHistory] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const [showNewRoutine, setShowNewRoutine] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFocus, setNewFocus] = useState("GENERAL");

  // Buscador de ejercicio para "Agregar ejercicio" — primero tu biblioteca,
  // después el catálogo de WorkoutX (mismo patrón que Training.jsx). Si lo
  // que elegís/tipeás no existe todavía en tu biblioteca, se crea solo al
  // agregarlo a la rutina — no hace falta ir a Entrenamiento antes.
  const [newExQuery, setNewExQuery] = useState("");
  const [newExSelectedId, setNewExSelectedId] = useState(null);
  const [newExMuscle, setNewExMuscle] = useState("");
  const [newExSuggestions, setNewExSuggestions] = useState([]);
  const [newExWeight, setNewExWeight] = useState("");
  const [newExSets, setNewExSets] = useState("");
  const [newExRepMin, setNewExRepMin] = useState("");
  const [newExRepMax, setNewExRepMax] = useState("");
  const debouncedExQuery = useDebouncedValue(newExQuery, 400);

  const ownMatches =
    newExQuery.trim().length > 0 && !newExSelectedId
      ? exercises.filter((e) => e.name.toLowerCase().includes(newExQuery.trim().toLowerCase())).slice(0, 5)
      : [];

  useEffect(() => {
    if (newExSelectedId || debouncedExQuery.trim().length < 2) {
      setNewExSuggestions([]);
      return;
    }
    let cancelled = false;
    apiFetch(`/api/external/exercises?q=${encodeURIComponent(debouncedExQuery.trim())}`, { token })
      .then((res) => {
        if (!cancelled) setNewExSuggestions(res);
      })
      .catch(() => {
        if (!cancelled) setNewExSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedExQuery, newExSelectedId, token]);

  function pickOwnExercise(e) {
    setNewExQuery(e.name);
    setNewExSelectedId(e.id);
    setNewExMuscle(e.muscle);
    setNewExSuggestions([]);
  }

  function pickWorkoutXSuggestion(s) {
    setNewExQuery(s.name);
    setNewExSelectedId(null);
    setNewExMuscle(s.target || s.bodyPart || "");
    setNewExSuggestions([]);
  }

  function resetExercisePicker() {
    setNewExQuery("");
    setNewExSelectedId(null);
    setNewExMuscle("");
    setNewExSuggestions([]);
    setNewExWeight("");
    setNewExSets("");
    setNewExRepMin("");
    setNewExRepMax("");
  }

  const [editingExId, setEditingExId] = useState(null);
  const [editExSets, setEditExSets] = useState("");
  const [editExRepMin, setEditExRepMin] = useState("");
  const [editExRepMax, setEditExRepMax] = useState("");

  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [editRoutineName, setEditRoutineName] = useState("");
  const [editRoutineFocus, setEditRoutineFocus] = useState("GENERAL");

  const { checkedInToday, weekCheckIns, checkInToday, refresh: refreshTrainingGoals } = useTrainingGoals();
  const [checkingIn, setCheckingIn] = useState(false);

  // Recién llegado a Rutinas, refrescamos los check-ins reales — así si
  // volviste de cargar una marca en Entrenamiento (que ahora hace check-in
  // automático), el Vegeta de la semana ya lo refleja sin recargar la página.
  useEffect(() => {
    refreshTrainingGoals();
    checkActive().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Empezar (o retomar) una sesión guiada de esta rutina — si ya hay una
  // sesión activa (de esta rutina o de otra), el backend devuelve esa misma
  // en vez de crear una nueva, así que nunca se pierde una sesión a medias.
  async function handleStartSession(routineId) {
    setStartingId(routineId);
    try {
      const res = await startSession(routineId);
      navigate(`/rutinas/sesion/${res.id}`);
    } catch {
      toast.error("No se pudo empezar la sesión.");
    } finally {
      setStartingId(null);
    }
  }

  async function handleCheckIn() {
    if (checkedInToday || checkingIn) return;
    setCheckingIn(true);
    try {
      await checkInToday();
      toast.success("Entreno de hoy confirmado — suma a los objetivos grupales de días entrenados.");
    } catch {
      toast.error("No se pudo confirmar el entreno de hoy.");
    } finally {
      setCheckingIn(false);
    }
  }

  const today = new Date();
  const weekDates = getWeekDates(today);
  const todayIdx = weekDates.findIndex((d) => isSameDay(d, today));
  // Calendario de la semana (nuevo formato): la tira de arriba solo dice
  // "qué día es" y "hay algo ese día sí/no" — el detalle completo (nombre
  // de la rutina) vive aparte, en un renglón grande debajo, así nunca
  // dependemos de que un nombre largo entre en una celda angosta.
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx === -1 ? 0 : todayIdx);
  const [emblaRef] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });

  // Vegeta de la semana (Mecánica 2) — se mueve con días REALMENTE
  // entrenados (check-in manual o automático por marca), no con el Tracker
  // de hábitos, que queda como función aparte y aislada.
  const weekCheckInSet = new Set(weekCheckIns);
  const daysTrainedThisWeek = weekDates.filter((d) => weekCheckInSet.has(toISO(d))).length;
  const vegetaStage = getVegetaTrainingStage(daysTrainedThisWeek);
  const weekProgress = Math.min(1, daysTrainedThisWeek / (vegetaTraining.length - 1));

  // CTA principal del Hero (brief Fase 0 P1 cierre): "¿qué tengo que hacer
  // hoy?" tiene que responderse desde el Hero mismo, no solo escondido dentro
  // de cada card de rutina. Misma acción real (handleStartSession) que ya
  // usa el botón "Entrenar" de cada card — esto solo la sube de lugar para
  // la rutina de hoy, no crea un camino nuevo.
  const todaysRoutine = routines.find((r) => r.daysOfWeek.includes(todayIdx)) ?? null;

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingExId(null);
    setEditingRoutineId(null);
    setShowHistory(false);
    setShowAddExercise(false);
    resetExercisePicker();
  }

  // Historial de esta rutina, cargado la primera vez que se expande (Fase 5)
  // — de ahí sale el insight determinista de tendencia de volumen y la
  // constancia semanal, sin pedirlo de nuevo si ya lo tenemos en memoria.
  useEffect(() => {
    if (!expandedId || routineHistory[expandedId]) return;
    listSessions(expandedId, 8)
      .then((res) => setRoutineHistory((prev) => ({ ...prev, [expandedId]: res })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId]);

  async function addRoutine() {
    if (!newName.trim()) return;
    try {
      await createRoutine({ name: newName.trim(), focus: newFocus, description: null, daysOfWeek: [] });
      setNewName("");
      setNewFocus("GENERAL");
      setShowNewRoutine(false);
    } catch {
      toast.error("No se pudo crear la rutina.");
    }
  }

  async function deleteRoutineHandler(id) {
    try {
      await deleteRoutine(id);
      if (expandedId === id) setExpandedId(null);
    } catch {
      toast.error("No se pudo borrar la rutina.");
    }
  }

  function startEditRoutine(r) {
    setEditingRoutineId(r.id);
    setEditRoutineName(r.name);
    setEditRoutineFocus(r.focus);
  }

  function cancelEditRoutine() {
    setEditingRoutineId(null);
  }

  async function saveEditRoutine(r) {
    if (!editRoutineName.trim()) return;
    try {
      await updateRoutine(r.id, {
        name: editRoutineName.trim(),
        focus: editRoutineFocus,
        description: r.description ?? null,
        daysOfWeek: r.daysOfWeek,
        isActive: r.isActive,
      });
      setEditingRoutineId(null);
    } catch {
      toast.error("No se pudo editar la rutina.");
    }
  }

  async function toggleDay(r, dayIndex) {
    const daysOfWeek = r.daysOfWeek.includes(dayIndex)
      ? r.daysOfWeek.filter((d) => d !== dayIndex)
      : [...r.daysOfWeek, dayIndex].sort();
    try {
      await updateRoutine(r.id, {
        name: r.name,
        focus: r.focus,
        description: r.description ?? null,
        daysOfWeek,
        isActive: r.isActive,
      });
    } catch {
      toast.error("No se pudo actualizar el día.");
    }
  }

  async function addExercise(routineId) {
    if (!newExQuery.trim()) return;
    try {
      // Si no elegiste uno de tu biblioteca, se crea acá mismo — con el
      // grupo muscular de la sugerencia de WorkoutX si venís de ahí, o "General"
      // si tipeaste un nombre totalmente libre.
      let exerciseId = newExSelectedId;
      if (!exerciseId) {
        exerciseId = await addTrainingExercise({ name: newExQuery.trim(), muscle: newExMuscle || "General", unit: "kg" });
        if (!exerciseId) throw new Error("no se pudo crear el ejercicio");
      }

      await addExerciseToRoutine(routineId, {
        exerciseId,
        order: (routines.find((r) => r.id === routineId)?.exercises.length) ?? 0,
        targetSets: newExSets ? Number(newExSets) : null,
        repRangeMin: newExRepMin ? Number(newExRepMin) : null,
        repRangeMax: newExRepMax ? Number(newExRepMax) : null,
        targetRpe: null,
        restSeconds: null,
        tempo: null,
        warmupSets: null,
        isOptional: false,
        notes: null,
      });

      // Peso base opcional (#pedido: "primeras marcas registradas") — crea
      // una marca REAL en Entrenamiento, mismo camino que usa Training.jsx
      // (addProgress), nada paralelo. Reps = arriba del rango objetivo si lo
      // cargaste, si no 1 rep por defecto (no se inventa un número de reps).
      if (newExWeight && Number(newExWeight) > 0) {
        const baselineReps = newExRepMax || newExRepMin || 1;
        await addProgress({ exerciseId, weight: newExWeight, reps: baselineReps, date: todayISO(), spotted: false });
      }

      resetExercisePicker();
    } catch {
      toast.error("No se pudo agregar el ejercicio.");
    }
  }

  function startEditExercise(ex) {
    setEditingExId(ex.id);
    setEditExSets(String(ex.targetSets ?? ""));
    setEditExRepMin(String(ex.repRangeMin ?? ""));
    setEditExRepMax(String(ex.repRangeMax ?? ""));
  }

  function cancelEditExercise() {
    setEditingExId(null);
  }

  async function saveEditExercise(routineId, ex) {
    try {
      await updateRoutineExercise(routineId, ex.id, {
        order: ex.order,
        targetSets: editExSets ? Number(editExSets) : null,
        repRangeMin: editExRepMin ? Number(editExRepMin) : null,
        repRangeMax: editExRepMax ? Number(editExRepMax) : null,
        targetRpe: ex.targetRpe ?? null,
        restSeconds: ex.restSeconds ?? null,
        tempo: ex.tempo ?? null,
        warmupSets: ex.warmupSets ?? null,
        isOptional: ex.isOptional ?? false,
        notes: ex.notes ?? null,
      });
      setEditingExId(null);
    } catch {
      toast.error("No se pudo editar el ejercicio.");
    }
  }

  async function deleteExercise(routineId, exId) {
    try {
      await deleteRoutineExercise(routineId, exId);
      if (editingExId === exId) setEditingExId(null);
    } catch {
      toast.error("No se pudo borrar el ejercicio.");
    }
  }

  const weeklyDaysUsed = new Set(routines.flatMap((r) => r.daysOfWeek)).size;

  return (
    <div>
      <PageHeader
        eyebrow="Rutinas"
        title="Biblioteca de rutinas"
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
            <select value={newFocus} onChange={(e) => setNewFocus(e.target.value)} className={SELECT_CLS}>
              {FOCUS_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
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

      {/* Hero — Vegeta, primero en el DOM (antes vivía en una columna
          lateral que en mobile quedaba al fondo de la pantalla). La rutina
          de hoy y su CTA real viven acá adentro — es la respuesta a
          "¿qué tengo que hacer ahora?", no algo que haya que buscar dentro
          de una card de rutina entre varias. */}
      <CharacterHero
        eyebrow={`${daysTrainedThisWeek} día(s) entrenados esta semana`}
        name={vegetaStage.tag}
        tone="teal"
        progress={weekProgress}
        art={<CharacterFlipbook frames={vegetaTraining.map((s) => s.img)} alt="Vegeta entrenando" width={140} height={140} />}
      >
        {todaysRoutine ? (
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="font-mono text-xs text-muted">
              Hoy toca: <span className="text-ink">{todaysRoutine.name}</span> · {todaysRoutine.exercises.length} ejercicios
            </p>
            <button
              onClick={() => handleStartSession(todaysRoutine.id)}
              disabled={startingId === todaysRoutine.id || (activeSession && activeSession.routineId !== todaysRoutine.id)}
              className="bg-maroon px-4 py-2.5 font-mono text-xs uppercase tracking-widest2 text-paper transition-all duration-250 hover:opacity-90 hover:shadow-glow disabled:opacity-50"
            >
              {activeSession && activeSession.routineId === todaysRoutine.id
                ? "Continuar sesión"
                : startingId === todaysRoutine.id
                ? "..."
                : "Comenzar entrenamiento"}
            </button>
          </div>
        ) : (
          <p className="font-mono text-xs text-muted">Sin rutina programada para hoy.</p>
        )}
      </CharacterHero>

      {/* Confirmación de entreno del día — independiente de si cargaste una
          marca nueva en Entrenamiento (no todo día de gym deja un PR). Suma
          a los objetivos grupales de "días entrenados" en Estadísticas. */}
      <Card className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow mb-1 text-maroon">Check-in del día</p>
          <p className="text-sm text-muted">
            {checkedInToday ? "Ya confirmaste que entrenaste hoy." : "Confirmá tu entreno de hoy."}
          </p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkedInToday || checkingIn}
          className="shrink-0 border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon transition-all duration-250 hover:bg-maroon hover:text-paper hover:shadow-glow disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-maroon"
        >
          {checkedInToday ? "✓ Entrenaste hoy" : "Confirmar entreno de hoy"}
        </button>
      </Card>

      {/* Sesión guiada en curso o pausada — para no perderla al navegar */}
      {activeSession && (
        <Card className="mb-6 flex flex-col items-start gap-2 border-maroon/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow mb-1 text-maroon">Sesión en curso</p>
            <p className="text-sm text-muted">
              {activeSession.routineName} — {activeSession.status === "paused" ? "pausada" : "en curso"}.
            </p>
          </div>
          <button
            onClick={() => navigate(`/rutinas/sesion/${activeSession.id}`)}
            className="shrink-0 bg-maroon px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
          >
            Continuar sesión
          </button>
        </Card>
      )}

      {/* Calendario semanal — rediseñado: la tira de arriba solo tiene que
          decir "qué día es" y "hay algo ese día", así nunca depende de que
          un nombre de rutina largo entre en una celda de 45px. El detalle
          (qué rutina toca) se muestra aparte, en un renglón grande abajo,
          para el día que tengas seleccionado (por default, hoy). El
          carrusel usa embla-carousel-react para el swipe táctil — misma
          librería que usa shadcn/ui, la sumamos liviana solo para esto. */}
      {/* UTILITY (brief: "calendario, historial y detalles") — deja de ser
          Card propia, es información de apoyo, no un feature. */}
      <div className="mb-8 border-t border-line pt-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow text-maroon">Calendario de la semana</p>
          <p className="font-mono text-xs text-muted">Entrenás {weeklyDaysUsed} día(s) por semana</p>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-2">
            {weekDates.map((d, i) => {
              const dayRoutines = routines.filter((r) => r.daysOfWeek.includes(i));
              const isToday = isSameDay(d, today);
              const isSelected = selectedDayIdx === i;
              return (
                <button
                  key={toISO(d)}
                  onClick={() => setSelectedDayIdx(i)}
                  className={`flex w-16 shrink-0 flex-col items-center gap-1.5 border py-3 transition-colors duration-150 ${
                    isSelected ? "border-maroon bg-maroon/10" : "border-maroon/15 hover:border-maroon/30"
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase tracking-widest2 text-muted">
                    {DIAS_CORTOS[i]}
                  </span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm ${
                      isToday ? "bg-maroon text-paper" : "text-ink"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {dayRoutines.length === 0 ? (
                      <span className="h-1 w-1 rounded-full bg-muted/40" />
                    ) : (
                      dayRoutines
                        .slice(0, 3)
                        .map((r) => <span key={r.id} className="h-1.5 w-1.5 rounded-full bg-maroon" />)
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle del día seleccionado — acá sí entra el nombre completo
            de la rutina sin apretar nada. */}
        {(() => {
          const d = weekDates[selectedDayIdx];
          if (!d) return null;
          const dayRoutines = routines.filter((r) => r.daysOfWeek.includes(selectedDayIdx));
          const isToday = isSameDay(d, today);
          return (
            <div className="mt-4 border-t border-maroon/10 pt-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest2 text-muted">
                {isToday ? "Hoy" : DAY_NAMES[selectedDayIdx]} · {d.getDate()}/{d.getMonth() + 1}
              </p>
              {dayRoutines.length === 0 ? (
                <p className="text-sm text-muted">Día de descanso — no tenés rutinas programadas.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {dayRoutines.map((r) => (
                    <span
                      key={r.id}
                      className="bg-maroon px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-paper"
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Rutinas — clickeables, se expanden para editar días y ejercicios */}
      {routinesLoading ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : routines.length === 0 ? (
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
                    <select value={editRoutineFocus} onChange={(e) => setEditRoutineFocus(e.target.value)} className={SELECT_CLS}>
                      {FOCUS_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEditRoutine(r)}
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
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartSession(r.id);
                        }}
                        disabled={startingId === r.id || (activeSession && activeSession.routineId !== r.id)}
                        title={
                          activeSession && activeSession.routineId !== r.id
                            ? "Ya hay una sesión en curso de otra rutina"
                            : "Empezar sesión guiada"
                        }
                        className="border border-maroon/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper disabled:opacity-40"
                      >
                        {activeSession && activeSession.routineId === r.id
                          ? "Continuar"
                          : startingId === r.id
                          ? "..."
                          : "Entrenar"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditRoutine(r);
                        }}
                        aria-label={`Editar ${r.name}`}
                        title="Editar rutina"
                        className="text-muted hover:text-maroon"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoutineHandler(r.id);
                        }}
                        aria-label={`Borrar ${r.name}`}
                        title="Borrar rutina"
                        className="text-muted hover:text-maroon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Fase 0 P1: colapsada, la card solo dice lo esencial (foco +
                    cantidad de ejercicios, vía el Tag de abajo) — días de
                    entrenamiento y la lista completa de ejercicios solo se
                    ven al expandir, no compiten con el resto de las rutinas. */}
                {!isOpen && (
                  <p className="font-mono text-xs text-muted">
                    {r.daysOfWeek.length > 0
                      ? r.daysOfWeek.map((i) => DIAS_CORTOS[i]).join(" · ")
                      : "Sin días asignados"}
                  </p>
                )}

                {isOpen && (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="eyebrow mb-1.5">Días de entrenamiento · click para ajustar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_NAMES.map((label, i) => (
                      <button
                        key={label}
                        onClick={() => toggleDay(r, i)}
                        aria-label={label}
                        title={label}
                        className={DAY_BTN_CLS(r.daysOfWeek.includes(i))}
                      >
                        {DIAS_CORTOS[i]}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {isOpen && (
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
                          <span className="flex-1 text-sm">{ex.exerciseName}</span>
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
                            value={editExRepMin}
                            onChange={(e) => setEditExRepMin(e.target.value)}
                            placeholder="Reps min"
                            className="w-20 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                          />
                          <input
                            type="number"
                            value={editExRepMax}
                            onChange={(e) => setEditExRepMax(e.target.value)}
                            placeholder="Reps max"
                            className="w-20 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                          />
                          <button
                            onClick={() => saveEditExercise(r.id, ex)}
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
                          <span>{ex.exerciseName}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted">
                              {ex.targetSets || "—"}x{repsLabel(ex)}
                            </span>
                            {isOpen && (
                              <span className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => startEditExercise(ex)}
                                  aria-label="Editar ejercicio"
                                  title="Editar"
                                  className="text-muted hover:text-maroon"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => deleteExercise(r.id, ex.id)}
                                  aria-label="Borrar ejercicio"
                                  title="Borrar"
                                  className="text-muted hover:text-maroon"
                                >
                                  <X size={13} />
                                </button>
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                )}

                <Tag>{r.exercises.length} ejercicios</Tag>

                {isOpen && (
                  <div className="border-t border-maroon/10 pt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setShowHistory((v) => !v)}
                      className="flex w-full items-center justify-between text-left"
                      aria-expanded={showHistory}
                    >
                      <p className="eyebrow">Historial y constancia</p>
                      <span className="text-muted">{showHistory ? "▲" : "▼"}</span>
                    </button>
                    {showHistory && (() => {
                      const { completed, trainedThisWeek, scheduledDays, volumeTrend } = computeRoutineInsight(
                        r,
                        routineHistory[r.id],
                        weekDates
                      );
                      return (
                        <>
                          <p className="mb-2 mt-2 text-xs text-muted">
                            {scheduledDays > 0
                              ? `Constancia esta semana: ${trainedThisWeek}/${scheduledDays} día(s) programados.`
                              : "Configurá los días de esta rutina para ver tu constancia."}
                            {volumeTrend && ` ${volumeTrend}`}
                          </p>
                          {completed.length === 0 ? (
                            <p className="mb-2 text-xs text-muted/70">Todavía no completaste ninguna sesión de esta rutina.</p>
                          ) : (
                            <ul className="mb-2 flex flex-col gap-1">
                              {completed.slice(0, 5).map((s) => (
                                <li key={s.id} className="flex items-center justify-between font-mono text-[10px] text-muted">
                                  <span>{s.startedAt.slice(0, 10)}</span>
                                  <span>
                                    {s.totalVolume ?? "—"}kg · {s.totalSets ?? "—"} series ·{" "}
                                    {s.performanceScore != null ? `${s.performanceScore}%` : "—"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {isOpen && (
                  <div className="border-t border-maroon/10 pt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setShowAddExercise((v) => !v)}
                      className="flex w-full items-center justify-between text-left"
                      aria-expanded={showAddExercise}
                    >
                      <p className="eyebrow">Agregar ejercicio</p>
                      <span className="text-muted">{showAddExercise ? "▲" : "▼"}</span>
                    </button>
                    {showAddExercise && (
                    <>
                    <p className="mb-2 mt-2 text-xs text-muted">
                      Buscá en tu biblioteca o en WorkoutX — si no existe todavía, se crea solo al agregarlo.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative min-w-[220px] flex-1">
                        <input
                          value={newExQuery}
                          onChange={(e) => {
                            setNewExQuery(e.target.value);
                            setNewExSelectedId(null);
                          }}
                          placeholder="Nombre del ejercicio..."
                          className="w-full border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                        />
                        {(ownMatches.length > 0 || newExSuggestions.length > 0) && (
                          <div className="hud absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto border border-maroon/25 bg-card text-ink">
                            {ownMatches.map((e) => (
                              <button
                                key={e.id}
                                onClick={() => pickOwnExercise(e)}
                                className="flex w-full items-center justify-between gap-2 border-b border-maroon/10 px-3 py-2 text-left text-sm last:border-none hover:bg-maroon/10"
                              >
                                <span className="font-semibold">{e.name}</span>
                                <Tag>{e.muscle}</Tag>
                              </button>
                            ))}
                            {newExSuggestions.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => pickWorkoutXSuggestion(s)}
                                className="flex w-full flex-col items-start gap-0.5 border-b border-maroon/10 px-3 py-2 text-left text-sm last:border-none hover:bg-maroon/10"
                              >
                                <span className="font-semibold">{s.name}</span>
                                <span className="font-mono text-[10px] uppercase tracking-widest2 text-muted">
                                  {[s.bodyPart, s.target, s.equipment].filter(Boolean).join(" · ")} · WorkoutX
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        value={newExWeight}
                        onChange={(e) => setNewExWeight(e.target.value)}
                        placeholder="Peso base (kg)"
                        className="w-28 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
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
                        value={newExRepMin}
                        onChange={(e) => setNewExRepMin(e.target.value)}
                        placeholder="Reps min"
                        className="w-24 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <input
                        type="number"
                        value={newExRepMax}
                        onChange={(e) => setNewExRepMax(e.target.value)}
                        placeholder="Reps max"
                        className="w-24 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                      />
                      <button
                        onClick={() => addExercise(r.id)}
                        className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                      >
                        Agregar
                      </button>
                    </div>
                    {newExWeight && Number(newExWeight) > 0 && (
                      <p className="mt-2 font-mono text-[10px] text-muted">
                        Va a quedar una marca real de {newExWeight}kg × {newExRepMax || newExRepMin || 1} reps hoy en
                        Entrenamiento.
                      </p>
                    )}
                    </>
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
