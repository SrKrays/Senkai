import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, PageHeader, Tag } from "../components/ui";
import { Plus, Minus } from "lucide-react";
import { fireConfetti } from "../utils/confetti";
import { notifyPR } from "../utils/notify";
import { useWorkoutSession } from "../context/WorkoutSessionContext";

function fmtClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function newClientToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

const STATUS_LABEL = { pending: "Pendiente", in_progress: "En curso", completed: "Completado", skipped: "Salteado" };

// Pantalla de resumen (Fase 5) — se muestra al terminar la sesión en vez de
// navegar directo a Rutinas, con los totales finales y los PRs logrados.
function SessionSummary({ summary, onDone }) {
  const prSets = summary.exercises.flatMap((e) =>
    e.sets.filter((s) => s.isNewRecord).map((s) => ({ ...s, exerciseName: e.exerciseName }))
  );
  return (
    <div>
      <PageHeader
        eyebrow={summary.perfect ? "¡Sesión perfecta! 🔥" : "Sesión completada"}
        title={summary.routineName}
        description="Estos son los números finales de esta sesión."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="eyebrow mb-1">Volumen total</p>
          <p className="font-mono text-2xl text-maroon">{summary.totalVolume ?? 0} kg</p>
        </Card>
        <Card>
          <p className="eyebrow mb-1">Series</p>
          <p className="font-mono text-2xl text-maroon">{summary.totalSets ?? 0}</p>
        </Card>
        <Card>
          <p className="eyebrow mb-1">Rendimiento</p>
          <p className="font-mono text-2xl text-maroon">{summary.performanceScore ?? 0}%</p>
        </Card>
        <Card>
          <p className="eyebrow mb-1">Poder ganado</p>
          <p className="font-mono text-2xl text-maroon">+{summary.powerGained ?? 0}</p>
        </Card>
      </div>

      {prSets.length > 0 && (
        <Card className="mt-6">
          <p className="eyebrow mb-3 text-maroon">Nuevos PR de esta sesión</p>
          <ul className="flex flex-col gap-1.5">
            {prSets.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span>{s.exerciseName}</span>
                <span className="font-mono text-maroon">
                  {s.weight}kg × {s.reps} reps
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <button
        onClick={onDone}
        className="mt-6 bg-maroon px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
      >
        Volver a Rutinas
      </button>
    </div>
  );
}

// Input numérico con +/- grandes — esta pantalla se usa con una sola mano,
// a media serie, a veces con las manos transpiradas. Tocar un botón de
// 44px+ para sumar/restar es mucho más confiable que apuntarle al teclado
// numérico del celular para escribir "82.5".
function NumberStepper({ label, value, onChange, step, min = 0, placeholder }) {
  function bump(delta) {
    const current = Number(value) || 0;
    const next = Math.max(min, Math.round((current + delta) * 100) / 100);
    onChange(String(next));
  }
  return (
    <div className="flex-1 min-w-[104px]">
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-muted">{label}</label>
      <div className="flex items-stretch border border-maroon/20">
        <button
          type="button"
          onClick={() => bump(-step)}
          aria-label={`Restar ${label}`}
          className="flex w-11 shrink-0 items-center justify-center text-maroon hover:bg-maroon/10 active:bg-maroon/20"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="w-full min-w-0 border-x border-maroon/20 bg-transparent px-1 py-3 text-center font-mono text-lg outline-none focus:bg-maroon/5"
        />
        <button
          type="button"
          onClick={() => bump(step)}
          aria-label={`Sumar ${label}`}
          className="flex w-11 shrink-0 items-center justify-center text-maroon hover:bg-maroon/10 active:bg-maroon/20"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

// Sesión guiada (Mecánica 2, Fase 3/4) — cada serie confirmada acá crea un
// ProgressMark REAL (misma tabla que Entrenamiento), así que todo lo demás
// (Rank, Objetivos, check-in de días, Power Level) se entera solo, sin que
// esta pantalla tenga que avisarle a nadie más.
export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, refreshSession, confirmSet, updateExerciseStatus, pauseSession, resumeSession, abandonSession, completeSession } =
    useWorkoutSession();

  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [isWarmup, setIsWarmup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const restTimer = useRef(null);
  // Sesión recién terminada (Fase 5) — se muestra una pantalla de resumen en
  // vez de navegar directo a Rutinas, con los totales y los PRs logrados.
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refreshSession(id)
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar la sesión.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Al cargar/recargar la sesión, saltamos directo al primer ejercicio sin
  // resolver (no completado ni salteado) en vez de siempre arrancar en el 0.
  useEffect(() => {
    if (!session) return;
    const firstPending = session.exercises.findIndex((e) => e.status !== "completed" && e.status !== "skipped");
    setActiveIdx((prev) => (prev < session.exercises.length ? prev : firstPending === -1 ? 0 : firstPending));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Timer de descanso — arranca cuando confirmás una serie no-calentamiento
  // que tiene restSeconds configurado. El truco de usar `restLeft > 0` como
  // única dependencia evita reiniciar el intervalo en cada tick; solo lo
  // crea una vez al pasar de 0 a >0 y lo limpia solo al llegar a 0.
  useEffect(() => {
    if (restLeft <= 0) return undefined;
    restTimer.current = setInterval(() => setRestLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(restTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restLeft > 0]);

  if (loading) return <p className="text-sm text-muted">Cargando sesión...</p>;
  if (summary) return <SessionSummary summary={summary} onDone={() => navigate("/rutinas")} />;
  if (!session) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="font-display text-3xl tracking-wide text-maroon">Sesión no encontrada</p>
        <button
          onClick={() => navigate("/rutinas")}
          className="mt-2 border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper"
        >
          Volver a Rutinas
        </button>
      </Card>
    );
  }

  const currentExercise = session.exercises[activeIdx];
  const isPaused = session.status === "paused";
  const isFinished = session.status === "completed" || session.status === "abandoned";
  const resolvedCount = session.exercises.filter((e) => e.status === "completed" || e.status === "skipped").length;

  // Orden obligatorio (#pedido): no se puede cargar una serie de un ejercicio
  // hasta completar (o saltear) todos los anteriores de la rutina. El
  // "desbloqueado" es siempre el primero sin resolver — el server aplica la
  // misma regla en /sets, esto es solo para no dejar ni intentar desde acá.
  const unlockedIdx = session.exercises.findIndex((e) => e.status !== "completed" && e.status !== "skipped");
  const isCurrentLocked = unlockedIdx !== -1 && activeIdx !== unlockedIdx;

  async function handleConfirmSet() {
    if (isCurrentLocked) return;
    const numWeight = Number(weight);
    const numReps = Number(reps);
    if (!(numWeight >= 0) || !(numReps > 0)) {
      toast.error("Cargá un peso válido y al menos 1 repetición.");
      return;
    }
    setSaving(true);
    try {
      const res = await confirmSet(session.id, {
        exerciseSessionId: currentExercise.id,
        weight: numWeight,
        reps: numReps,
        rpe: rpe ? Number(rpe) : null,
        rir: null,
        isWarmup,
        restAfterSeconds: currentExercise.restSeconds ?? null,
        notes: null,
        clientToken: newClientToken(),
      });
      if (res.isNewRecord) {
        notifyPR(currentExercise.exerciseName, `${numWeight}kg × ${numReps} reps`);
        fireConfetti();
      }
      setWeight("");
      setReps("");
      setRpe("");
      setIsWarmup(false);
      if (!isWarmup && currentExercise.restSeconds) setRestLeft(currentExercise.restSeconds);
    } catch {
      toast.error("No se pudo confirmar la serie.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExerciseStatus(status) {
    setBusyAction(true);
    try {
      await updateExerciseStatus(session.id, currentExercise.id, status);
      const nextIdx = session.exercises.findIndex(
        (e, i) => i > activeIdx && e.status !== "completed" && e.status !== "skipped"
      );
      if (nextIdx !== -1) setActiveIdx(nextIdx);
    } catch {
      toast.error("No se pudo actualizar el ejercicio.");
    } finally {
      setBusyAction(false);
    }
  }

  async function handlePauseResume() {
    setBusyAction(true);
    try {
      if (isPaused) await resumeSession(session.id);
      else await pauseSession(session.id);
    } catch {
      toast.error("No se pudo actualizar la sesión.");
    } finally {
      setBusyAction(false);
    }
  }

  async function handleAbandon() {
    if (!window.confirm("¿Abandonar la sesión? Las series ya confirmadas quedan guardadas, pero la sesión se cierra.")) return;
    setBusyAction(true);
    try {
      await abandonSession(session.id);
      toast("Sesión abandonada.");
      navigate("/rutinas");
    } catch {
      toast.error("No se pudo abandonar la sesión.");
    } finally {
      setBusyAction(false);
    }
  }

  async function handleComplete() {
    setBusyAction(true);
    try {
      const res = await completeSession(session.id);
      const perfect = res.performanceScore != null && res.performanceScore >= 95;
      if (perfect) fireConfetti();
      setSummary({ ...res, perfect });
    } catch (err) {
      toast.error(err?.message || "No se pudo terminar la sesión.");
    } finally {
      setBusyAction(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Sesión guiada · ${STATUS_LABEL[session.status] ?? session.status}`}
        title={session.routineName}
        description={`${resolvedCount}/${session.exercises.length} ejercicios resueltos`}
        action={
          !isFinished && (
            <div className="flex gap-2">
              <button
                onClick={handlePauseResume}
                disabled={busyAction}
                className="border border-maroon/40 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper disabled:opacity-50"
              >
                {isPaused ? "Reanudar" : "Pausar"}
              </button>
              <button
                onClick={handleAbandon}
                disabled={busyAction}
                className="border border-maroon/25 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-muted hover:bg-maroon/10 disabled:opacity-50"
              >
                Abandonar
              </button>
              <button
                onClick={handleComplete}
                disabled={busyAction}
                className="bg-maroon px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250 disabled:opacity-50"
              >
                Terminar sesión
              </button>
            </div>
          )
        }
      />

      {isFinished && (
        <Card className="mb-6">
          <p className="eyebrow mb-1 text-maroon">Esta sesión ya terminó</p>
          <p className="text-sm text-muted">Estado: {STATUS_LABEL[session.status] ?? session.status}.</p>
        </Card>
      )}

      {/* Tira de ejercicios de la rutina */}
      <div className="mb-6 flex flex-wrap gap-2">
        {session.exercises.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setActiveIdx(i)}
            className={`border px-3 py-2 font-mono text-xs uppercase tracking-widest2 ${
              i === activeIdx
                ? "border-maroon bg-maroon text-paper"
                : e.status === "completed"
                ? "border-maroon/30 text-maroon"
                : e.status === "skipped"
                ? "border-line text-muted line-through"
                : "border-maroon/20 text-muted hover:bg-maroon/10"
            }`}
          >
            {e.status === "completed" ? "✓ " : e.status === "skipped" ? "⊘ " : ""}
            {e.exerciseName}
          </button>
        ))}
      </div>

      {currentExercise && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <Card>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">{STATUS_LABEL[currentExercise.status] ?? currentExercise.status}</p>
                <h3 className="font-display text-3xl tracking-wide">{currentExercise.exerciseName}</h3>
                <p className="mt-1 font-mono text-xs text-muted">
                  Objetivo: {currentExercise.targetSets ?? "—"} series
                  {currentExercise.repRangeMin != null &&
                    ` × ${currentExercise.repRangeMin}${
                      currentExercise.repRangeMax && currentExercise.repRangeMax !== currentExercise.repRangeMin
                        ? `–${currentExercise.repRangeMax}`
                        : ""
                    } reps`}
                  {currentExercise.targetRpe != null && ` · RPE ${currentExercise.targetRpe}`}
                </p>
              </div>
              {!isFinished && !isCurrentLocked && (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleExerciseStatus("completed")}
                    disabled={busyAction}
                    className="border border-maroon/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper disabled:opacity-50"
                  >
                    Completar
                  </button>
                  <button
                    onClick={() => handleExerciseStatus("skipped")}
                    disabled={busyAction}
                    className="border border-maroon/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-muted hover:bg-maroon/10 disabled:opacity-50"
                  >
                    Saltar
                  </button>
                </div>
              )}
            </div>

            {/* Recomendación de peso + última sesión — deterministas, nada de IA */}
            <div className="mb-4 border border-maroon/15 bg-maroon/5 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-widest2 text-maroon">
                {currentExercise.recommendation.suggestedText
                  ? `Sugerencia: ${currentExercise.recommendation.suggestedText}`
                  : "Sin sugerencia de peso"}
              </p>
              <p className="mt-0.5 text-xs text-muted">{currentExercise.recommendation.reason}</p>
              {currentExercise.lastSessionSets.length > 0 && (
                <p className="mt-1 font-mono text-[10px] text-muted">
                  Última vez: {currentExercise.lastSessionSets.map((s) => `${s.weight}kg×${s.reps}`).join(" · ")}
                </p>
              )}
            </div>

            {restLeft > 0 && (
              <div className="mb-4 flex items-center justify-between border border-maroon/30 bg-maroon/10 px-3 py-2">
                <p className="font-mono text-xs uppercase tracking-widest2 text-maroon">Descanso · {fmtClock(restLeft)}</p>
                <button
                  onClick={() => setRestLeft(0)}
                  className="font-mono text-[10px] uppercase tracking-widest2 text-muted hover:text-maroon"
                >
                  Saltar descanso
                </button>
              </div>
            )}

            {/* Series ya confirmadas */}
            <ul className="mb-4 flex flex-col gap-1.5">
              {currentExercise.sets.length === 0 && (
                <li className="text-sm text-muted">Todavía no cargaste ninguna serie.</li>
              )}
              {currentExercise.sets.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between border-b border-ink/10 pb-1.5 text-sm last:border-none"
                >
                  <span>
                    Serie {s.setNumber} — {s.weight}kg × {s.reps} reps
                    {s.rpe != null && ` · RPE ${s.rpe}`}
                    {s.isWarmup && " · calentamiento"}
                  </span>
                  {s.isNewRecord && <Tag>PR</Tag>}
                </li>
              ))}
            </ul>

            {!isFinished && isCurrentLocked && (
              <div className="border-t border-maroon/10 pt-4">
                <p className="border border-maroon/20 bg-maroon/5 px-3 py-2 text-sm text-muted">
                  Completá o salteá <strong className="text-maroon">{session.exercises[unlockedIdx].exerciseName}</strong> primero
                  para poder cargar series acá.
                </p>
                <button
                  onClick={() => setActiveIdx(unlockedIdx)}
                  className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:underline"
                >
                  Ir a {session.exercises[unlockedIdx].exerciseName} →
                </button>
              </div>
            )}

            {!isFinished && !isCurrentLocked && (
              <div className="border-t border-maroon/10 pt-4">
                <div className="flex flex-wrap gap-2">
                  <NumberStepper label="Peso (kg)" value={weight} onChange={setWeight} step={2.5} placeholder="0" />
                  <NumberStepper label="Reps" value={reps} onChange={setReps} step={1} placeholder="0" />
                  <NumberStepper label="RPE (opcional)" value={rpe} onChange={setRpe} step={0.5} min={0} placeholder="—" />
                </div>
                <label className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest2 text-muted">
                  <input type="checkbox" checked={isWarmup} onChange={(e) => setIsWarmup(e.target.checked)} className="h-4 w-4 accent-maroon" />
                  Calentamiento
                </label>
                <button
                  onClick={handleConfirmSet}
                  disabled={saving}
                  className="mt-3 w-full bg-maroon px-4 py-4 font-mono text-sm uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250 disabled:opacity-50 sm:w-auto sm:px-8"
                >
                  Confirmar serie
                </button>
              </div>
            )}
          </Card>

          <div>
            <p className="eyebrow mb-4">Resumen de la sesión</p>
            <Card className="flex flex-col gap-3">
              <div>
                <p className="eyebrow mb-1">Volumen total</p>
                <p className="font-mono text-lg text-maroon">{session.totalVolume ?? "—"} kg</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Series</p>
                <p className="font-mono text-lg text-maroon">{session.totalSets ?? "—"}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Rendimiento</p>
                <p className="font-mono text-lg text-maroon">{session.performanceScore != null ? `${session.performanceScore}%` : "—"}</p>
              </div>
              {session.powerGained ? (
                <div>
                  <p className="eyebrow mb-1">Poder ganado</p>
                  <p className="font-mono text-lg text-maroon">+{session.powerGained}</p>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
