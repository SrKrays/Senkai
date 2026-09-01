import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Crown, Medal, Copy, Check, Trophy, ChevronRight } from "lucide-react";
import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import CountUp from "../components/CountUp";
import ImagePrizeUploader from "../components/ImagePrizeUploader";
import { vegetaEvolution } from "../data/mockData";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { usePoints } from "../context/PointsContext";
import { useGroup } from "../context/GroupContext";
import { useCharacter } from "../context/CharacterContext";
import { useRank } from "../context/RankContext";
import { getVegetaStage } from "../utils/evolution";
import { currentStreak } from "../utils/date";

const EXERCISE_OPTIONS = [
  { key: "benchKg", label: "Banca" },
  { key: "squatKg", label: "Sentadilla" },
  { key: "deadliftKg", label: "Peso muerto" },
];

// Medallero del ranking — oro/plata/bronce para el podio, el resto queda con
// el badge neutro por defecto. `text-black` (no `text-paper`) a propósito:
// necesitamos el número bien negro y legible sobre fondos claros de medalla,
// sin depender de que el token de tema se haya recompilado.
const RANK_MEDALS = {
  1: { label: "Oro", icon: Crown, cls: "border-gold bg-gold text-black shadow-glow-gold" },
  2: { label: "Plata", icon: Medal, cls: "border-silver bg-silver text-black shadow-glow-silver" },
  3: { label: "Bronce", icon: Medal, cls: "border-bronze bg-bronze text-black shadow-glow-bronze" },
};

const DEFAULT_GOAL = {
  title: "¿Quién hace más peso en banca?",
  exercise: "benchKg",
  exerciseLabel: "Banca",
  prize: "Premio sorpresa",
  targetKg: 100,
};

// Unirse con un código de invitación o crear un grupo desde cero — cada
// amigo hace esto una sola vez, desde su propio teléfono, con su propia
// cuenta. Se usa tanto en la pantalla "sin grupo" como colgado del botón
// "+ Nuevo grupo" cuando ya estás en uno (y querés cambiarte).
function GroupSwitchPanel({ onDone, warnSwitch }) {
  const { createGroup, joinGroup } = useGroup();
  const [mode, setMode] = useState("join");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleJoin() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const g = await joinGroup(code.trim());
      toast.success(`¡Te sumaste a ${g.name}!`);
      onDone?.();
    } catch (err) {
      toast.error(err?.message || "No se pudo unir con ese código.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const g = await createGroup(name.trim());
      toast.success(`Grupo "${g.name}" creado — código ${g.inviteCode}`);
      onDone?.();
    } catch (err) {
      toast.error(err?.message || "No se pudo crear el grupo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-8">
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setMode("join")}
          className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 ${
            mode === "join" ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
          }`}
        >
          Unirme con código
        </button>
        <button
          onClick={() => setMode("create")}
          className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 ${
            mode === "create" ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
          }`}
        >
          Crear grupo nuevo
        </button>
      </div>

      {mode === "join" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código (ej: SAIYAN01)"
            className="flex-1 border border-line bg-paper px-3 py-2 font-mono text-sm uppercase tracking-widest text-ink outline-none focus:border-maroon"
          />
          <button
            onClick={handleJoin}
            disabled={busy}
            className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow disabled:opacity-50"
          >
            Unirme
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del grupo (ej: Guerreros Z)"
            className="flex-1 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
          />
          <button
            onClick={handleCreate}
            disabled={busy}
            className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow disabled:opacity-50"
          >
            Crear
          </button>
        </div>
      )}

      <p className="mt-3 font-mono text-[10px] text-muted">
        {warnSwitch
          ? "Ojo: unirte a otro grupo o crear uno nuevo te saca del grupo actual."
          : "Pedile el código a quien ya tenga un grupo creado, o armá uno nuevo y compartiselo."}
      </p>
    </Card>
  );
}

function Gauge({ label, value, progress, suffix = "" }) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="eyebrow">{label}</p>
      <p className="font-mono text-3xl font-semibold text-maroon">
        <CountUp value={value} />
        {suffix}
      </p>
      <div className="relative mt-1 h-[2px] w-full bg-line">
        <motion.div
          className="absolute inset-y-0 left-0 bg-maroon"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <motion.span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-maroon shadow-glow-sm"
          initial={{ left: 0 }}
          animate={{ left: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </Card>
  );
}

// Comparativa de grupo por ejercicio (Fase 9, Mecánica 1) — elegís uno de
// los 14 ejercicios curados y ves quién le gana a quién en TU grupo, por
// ratio (no por kg en bruto — dos personas de distinto peso no son
// comparables en kg directo).
function GroupRankPanel() {
  const { catalog, fetchGroupRank, groupCache } = useRank();
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChange(newSlug) {
    setSlug(newSlug);
    if (!newSlug || groupCache[newSlug]) return;
    setLoading(true);
    try {
      await fetchGroupRank(newSlug);
    } catch {
      // silencioso — el panel se queda vacío, no rompe el resto de Grupos
    } finally {
      setLoading(false);
    }
  }

  const data = slug ? groupCache[slug] : null;

  return (
    <div>
      <p className="eyebrow mb-4">Comparativa por ejercicio</p>
      <Card className="flex flex-col gap-3">
        <select
          value={slug}
          onChange={(e) => handleChange(e.target.value)}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
        >
          <option value="">Elegí un ejercicio...</option>
          {catalog.map((k) => (
            <option key={k.slug} value={k.slug}>
              {k.muscleGroup} · {k.name}
            </option>
          ))}
        </select>

        {loading && <p className="text-xs text-muted">Cargando...</p>}

        {data && (
          <ul className="flex flex-col gap-2">
            {data.entries.map((e, i) => (
              <li key={e.userId} className="flex items-center gap-3 border-t border-line pt-2 first:border-none first:pt-0">
                <span className="w-4 shrink-0 font-mono text-xs text-muted">{i + 1}</span>
                <span className="flex-1 truncate text-sm font-semibold">{e.userName}</span>
                {e.tierName ? <Tag tone="teal">{e.tierName}</Tag> : <Tag>Sin marca</Tag>}
                <span className="w-16 shrink-0 text-right font-mono text-xs text-maroon">
                  {e.prKg ? `${e.prKg}kg` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function Groups() {
  const { group, loading, notInGroup, createGoal } = useGroup();
  const { habits, today } = useTracker();
  const { progressLog } = useTraining();
  const { powerLevel } = usePoints();
  const { catalog: rankCatalog, fetchGroupRank, groupCache, groupGrowth, fetchGroupGrowth } = useRank();

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalMode, setGoalMode] = useState("kg"); // "kg" | "rank"
  const [goalExercise, setGoalExercise] = useState("benchKg");
  const [goalTarget, setGoalTarget] = useState("100");
  const [goalRankSlug, setGoalRankSlug] = useState("");
  const [goalTierLevel, setGoalTierLevel] = useState(6);
  const [goalPrize, setGoalPrize] = useState("");
  const [goalImage, setGoalImage] = useState(null);
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Si el reto activo es por rango (Fase 9), traemos la comparativa de ese
  // ejercicio para poder ordenar el ranking y calcular el progreso del premio.
  const activeRankSlug = group?.goal?.rankSlug;
  useEffect(() => {
    if (activeRankSlug && !groupCache[activeRankSlug]) {
      fetchGroupRank(activeRankSlug).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRankSlug]);

  // "Ritmo de mejora" del grupo (Fase 9) — quién mejoró más en su propia
  // ventana, no quién levanta más en total.
  useEffect(() => {
    if (group) fetchGroupGrowth().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id]);

  const gymHabit = habits.find((h) => h.type === "gym");
  const streak = gymHabit ? currentStreak(gymHabit.checksByDate, today) : 0;

  const monthlyWorkouts = progressLog.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }).length;

  const { progress: powerProgress } = useCharacter();

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Grupos" title="Cargando..." description="Trayendo los datos de tu escuadrón." />
      </div>
    );
  }

  if (notInGroup || !group) {
    return (
      <div>
        <PageHeader
          eyebrow="Grupos"
          title="Sin grupo todavía"
          description="Unite con el código que te pasó un amigo, o armá un grupo nuevo y compartiselo vos."
        />
        <GroupSwitchPanel />
      </div>
    );
  }

  const goal = group.goal || DEFAULT_GOAL;
  const members = group.members;
  const isRankGoal = !!goal.rankSlug;

  // Objetivo por rango (Fase 9): ordenamos por ratio (no por kg — dos
  // personas de distinto peso no son comparables en crudo), usando la
  // comparativa que ya trae RankContext para ese ejercicio.
  const rankData = isRankGoal ? groupCache[goal.rankSlug] : null;
  const rankByUser = rankData ? Object.fromEntries(rankData.entries.map((e) => [e.userId, e])) : null;

  const ranked = isRankGoal
    ? [...members].sort((a, b) => (rankByUser?.[b.userId]?.ratio ?? -1) - (rankByUser?.[a.userId]?.ratio ?? -1))
    : [...members].sort((a, b) => b[goal.exercise] - a[goal.exercise]);
  const leader = ranked[0];

  const leaderTierLevel = isRankGoal ? rankByUser?.[leader.userId]?.tierLevel ?? -1 : null;
  const prizeProgress = isRankGoal
    ? Math.min(1, Math.max(0, (leaderTierLevel + 1) / ((goal.targetTierLevel ?? 6) + 1)))
    : goal.targetKg
    ? Math.min(1, leader[goal.exercise] / goal.targetKg)
    : 0;
  const prizeMissing = isRankGoal ? 0 : Math.max(0, goal.targetKg - leader[goal.exercise]);
  const prizeAchieved = isRankGoal ? leaderTierLevel >= (goal.targetTierLevel ?? 6) : prizeMissing <= 0;

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCodeCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setCodeCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar el código.");
    }
  }

  async function handleCreateGoal() {
    try {
      if (goalMode === "rank") {
        if (!goalRankSlug) {
          toast.error("Elegí un ejercicio para el reto.");
          return;
        }
        await createGoal({
          rankSlug: goalRankSlug,
          targetTierLevel: goalTierLevel,
          prize: goalPrize.trim() || "Premio sorpresa",
          prizeImageDataUrl: goalImage,
        });
      } else {
        const opt = EXERCISE_OPTIONS.find((o) => o.key === goalExercise) || EXERCISE_OPTIONS[0];
        await createGoal({
          exercise: opt.key,
          exerciseLabel: opt.label,
          prize: goalPrize.trim() || "Premio sorpresa",
          targetKg: Number(goalTarget) || 0,
          prizeImageDataUrl: goalImage,
        });
      }
      setShowGoalForm(false);
      setGoalImage(null);
    } catch (err) {
      toast.error(err?.message || "No se pudo crear el reto grupal.");
    }
  }

  return (
    <div>
      {/* Identidad propia de Grupos: rojo (danger real), no el lima de
          "maroon" — es la sección de competencia/desafío, se lee distinto
          a propósito. Sin personaje fijo (a diferencia de Nutrición/
          Rutinas), así que el acento de color hace ese trabajo acá. */}
      <PageHeader
        eyebrow="Grupos"
        title={<span className="text-danger">{group.name}</span>}
        description="Compitiendo juntos, un entrenamiento a la vez."
        action={
          <button
            onClick={() => setShowSwitchPanel((v) => !v)}
            className="border border-danger/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-danger-light transition-all duration-250 hover:bg-danger hover:text-paper hover:shadow-glow-danger"
          >
            + Nuevo grupo
          </button>
        }
      />

      {showSwitchPanel && (
        <GroupSwitchPanel warnSwitch onDone={() => setShowSwitchPanel(false)} />
      )}

      {/* Ritmo de mejora del grupo — no es quién levanta más, es quién MEJORÓ
          más rápido en su propia ventana. Va arriba de todo a propósito, para
          que aparezca sin que haya que ir a buscarlo. */}
      {groupGrowth?.entries?.some((e) => e.scorePct !== null) && (
        <Card className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow mb-1 text-teal-dark">Evolution · Ritmo de mejora del grupo</p>
            {(() => {
              const top = groupGrowth.entries.find((e) => e.scorePct !== null);
              return top ? (
                <h3 className="font-display text-2xl tracking-wide">
                  <span className="text-maroon">{top.userName}</span> es quien más mejoró
                  {top.scorePct >= 0 ? " · +" : " · "}
                  {top.scorePct.toFixed(1)}%
                </h3>
              ) : null;
            })()}
          </div>
          <ul className="flex flex-wrap gap-3">
            {groupGrowth.entries.map((e) => (
              <li key={e.userId} className="font-mono text-xs text-muted">
                {e.userName}: {e.scorePct === null ? "—" : `${e.scorePct >= 0 ? "+" : ""}${e.scorePct.toFixed(1)}%`}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
          {/* Ranking — lista limpia (número, avatar, nombre, valor, flecha),
              sin barras de progreso por fila: eso ahora vive únicamente en
              Gran Premio, que es donde importa "cuánto falta". Acá lo que
              importa es el orden. */}
          <div className="mb-4 flex items-baseline justify-between">
            <p className="eyebrow text-danger-light">Ranking</p>
            <p className="font-mono text-xs text-muted">
              {isRankGoal ? `Meta: ${goal.targetTierName}` : `Meta: ${goal.targetKg}kg en ${goal.exerciseLabel.toLowerCase()}`}
            </p>
          </div>
          <Card className="mb-8 flex flex-col gap-1">
            {ranked.map((m, i) => {
              const { current: stage } = getVegetaStage(m.powerLevel, vegetaEvolution);
              const memberRank = isRankGoal ? rankByUser?.[m.userId] : null;
              const value = isRankGoal ? memberRank?.prKg ?? 0 : m[goal.exercise];
              const isLeader = m.userId === leader.userId;
              const medal = RANK_MEDALS[i + 1];
              return (
                <motion.div
                  layout
                  key={m.userId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut", layout: { duration: 0.5, ease: "easeInOut" } }}
                  className="flex items-center gap-3 border-b border-line py-3 first:pt-1 last:border-none last:pb-1"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                      medal ? medal.cls : "border border-line text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <img
                    src={stage.img}
                    alt={m.name}
                    className={`h-10 w-10 shrink-0 rounded-full border object-cover object-top ${
                      isLeader ? "border-danger shadow-glow-danger" : "border-line"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    {isLeader && <p className="font-mono text-[9px] uppercase tracking-widest2 text-danger-light">Líder</p>}
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-gold">
                    {isRankGoal ? (memberRank?.tierName ? memberRank.tierName : "Sin marca") : `${value}kg`}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted" />
                </motion.div>
              );
            })}
          </Card>

          {/* Gran Premio — el desafío en juego. Trofeo por defecto (no una
              foto genérica que puede no existir); si el grupo subió una
              imagen propia para el premio, esa gana. Layout horizontal +
              acento rojo, acorde a la identidad de Grupos. */}
          <div className="mb-8">
            <p className="eyebrow mb-4 text-danger-light">Gran Premio</p>
            <Card className="flex items-center gap-5 border-danger/25">
              <div className="min-w-0 flex-1">
                <p className="eyebrow mb-1">En juego: {goal.prize}</p>
                <h3 className="font-display text-2xl uppercase tracking-wide text-danger-light sm:text-3xl">
                  {isRankGoal ? goal.targetTierName : `${goal.targetKg}kg en ${goal.exerciseLabel}`}
                </h3>
                <div className="mt-3 max-w-xs">
                  <ProgressBar progress={prizeProgress} tone="danger" />
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  {prizeAchieved
                    ? "¡Desbloqueada!"
                    : isRankGoal
                    ? `Falta llegar a ${goal.targetTierName} en ${goal.exerciseLabel.toLowerCase()}`
                    : `Faltan ${prizeMissing}kg en ${goal.exerciseLabel.toLowerCase()}`}
                </p>
              </div>
              {goal.prizeImageDataUrl ? (
                <CharacterArt src={goal.prizeImageDataUrl} alt={goal.prize} width={96} height={112} />
              ) : (
                <div className="hud flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 shadow-glow-danger">
                  <Trophy size={40} className="text-danger-light" strokeWidth={1.5} />
                </div>
              )}
            </Card>
          </div>

          {!showGoalForm ? (
            <button
              onClick={() => setShowGoalForm(true)}
              className="mb-8 border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon transition-all duration-250 hover:bg-maroon hover:text-paper hover:shadow-glow"
            >
              + Nuevo objetivo
            </button>
          ) : (
            <Card className="mb-8">
              <p className="eyebrow mb-3">Nuevo objetivo grupal</p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setGoalMode("kg")}
                    className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 ${
                      goalMode === "kg" ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
                    }`}
                  >
                    Por kg
                  </button>
                  <button
                    onClick={() => setGoalMode("rank")}
                    className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 ${
                      goalMode === "rank" ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
                    }`}
                  >
                    Por rango
                  </button>
                </div>

                {goalMode === "kg" ? (
                  <>
                    <p className="eyebrow text-muted">Agregar ejercicio</p>
                    <div className="flex gap-2">
                      {EXERCISE_OPTIONS.map((o) => (
                        <button
                          key={o.key}
                          onClick={() => setGoalExercise(o.key)}
                          className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 ${
                            goalExercise === o.key ? "bg-maroon text-paper" : "border border-maroon/25 text-maroon"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="eyebrow text-muted">Ejercicio y etapa objetivo</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={goalRankSlug}
                        onChange={(e) => setGoalRankSlug(e.target.value)}
                        className="flex-1 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
                      >
                        <option value="">Elegí un ejercicio...</option>
                        {rankCatalog.map((k) => (
                          <option key={k.slug} value={k.slug}>
                            {k.muscleGroup} · {k.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={goalTierLevel}
                        onChange={(e) => setGoalTierLevel(Number(e.target.value))}
                        className="border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
                      >
                        {vegetaEvolution.map((s) => (
                          <option key={s.level} value={s.level}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {goalMode === "kg" && (
                    <input
                      type="number"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="Peso objetivo (kg)"
                      className="border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
                    />
                  )}
                  <input
                    value={goalPrize}
                    onChange={(e) => setGoalPrize(e.target.value)}
                    placeholder="Premio (ej: Lata de Monster)"
                    className="flex-1 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateGoal}
                      className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow"
                    >
                      Crear reto
                    </button>
                    <button
                      onClick={() => setShowGoalForm(false)}
                      className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
                <ImagePrizeUploader value={goalImage} onChange={setGoalImage} />
                <p className="font-mono text-[10px] text-muted">
                  El reto vale para todo el grupo apenas lo creás — cada integrante ya suma con sus propias marcas.
                </p>
              </div>
            </Card>
          )}

          {/* Mini-cards de cada integrante — ranking, imagen ajustada, Power Level + pilares */}
          <p className="eyebrow mb-4">Escuadrón</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {ranked.map((m, i) => {
              const { current: stage } = getVegetaStage(m.powerLevel, vegetaEvolution);
              const rank = i + 1;
              const medal = RANK_MEDALS[rank];
              return (
                <Card
                  key={m.userId}
                  layout
                  transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut", layout: { duration: 0.5, ease: "easeInOut" } }}
                  className="relative flex gap-4"
                >
                  <span
                    className={`absolute -left-1.5 -top-1.5 z-20 flex flex-col items-center justify-center gap-0.5 rounded-sm border-2 bg-card font-mono font-bold ${
                      medal ? `h-11 w-8 ${medal.cls}` : "h-8 w-7 border-line text-muted text-sm"
                    }`}
                    title={medal ? medal.label : `Puesto ${rank}`}
                  >
                    {medal && <medal.icon size={13} strokeWidth={2.5} />}
                    <span className={medal ? "text-xs leading-none" : ""}>{rank}</span>
                  </span>
                  <CharacterArt src={stage.img} alt={`${m.name} — ${stage.name}`} width={130} height={200} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="mb-3 font-mono text-xs text-muted">{stage.name}</p>

                    <div className="hud mb-3 flex items-baseline justify-between border border-line bg-paper px-3 py-2">
                      <div>
                        <p className="eyebrow mb-0.5">Power Level</p>
                        <CountUp
                          value={m.powerLevel}
                          className="neon-text font-mono text-xl font-semibold text-maroon-light"
                        />
                      </div>
                      <span className="neon-text-teal font-mono text-xs font-semibold text-teal-light">
                        {m.weeklyDelta > 0 ? `↑ +${m.weeklyDelta.toLocaleString("es-AR")}` : "sin cambios (7d)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="font-mono text-sm font-semibold text-ink">{Math.round(m.trainingPct * 100)}%</p>
                        <p className="eyebrow">Ejercicio</p>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-ink">{Math.round(m.supplementPct * 100)}%</p>
                        <p className="eyebrow">Suplemento</p>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-ink">{Math.round(m.nutritionPct * 100)}%</p>
                        <p className="eyebrow">Alimentación</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Tus stats personales — no son del grupo, así que van después de
              todo lo grupal (ranking, premio, escuadrón), no antes. Ya se
              ven en el Dashboard/Personaje; acá quedan como referencia
              rápida, no como protagonistas de la pantalla. */}
          <div>
            <p className="eyebrow mb-4">Tus stats</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Gauge label="Power Level" value={powerLevel} progress={powerProgress} />
              <Gauge label="Racha de entrenos" value={streak} suffix=" días" progress={Math.min(1, streak / 30)} />
              <Gauge label="Entrenamientos (mes)" value={monthlyWorkouts} progress={Math.min(1, monthlyWorkouts / 20)} />
            </div>
          </div>

          {/* Actividad + posición de cada uno */}
          <div>
            <p className="eyebrow mb-4">Actividad y posición</p>
            <Card className="flex flex-col gap-3">
              {ranked.map((m, i) => {
                const { current: stage } = getVegetaStage(m.powerLevel, vegetaEvolution);
                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 border-b border-line pb-3 last:border-none last:pb-0"
                  >
                    <span className="w-4 shrink-0 font-mono text-xs text-muted">{i + 1}</span>
                    <img
                      src={stage.img}
                      alt={m.name}
                      className="h-9 w-9 shrink-0 rounded-full border border-line object-cover object-top"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{m.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted">{m.lastActivityText}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest2 text-muted">
                      {m.lastActivityRelative}
                    </span>
                  </div>
                );
              })}
            </Card>
          </div>

          <GroupRankPanel />

          {/* Código de invitación — Fase 0 P1: baja al final. Es la tarea
              administrativa de "sumar gente", no lo primero que alguien
              busca al entrar a Grupos (eso es el ranking y el Gran Premio). */}
          <div>
            <p className="eyebrow mb-4">Código de invitación</p>
            <Card className="flex items-center justify-between gap-3">
              <span className="font-mono text-lg font-semibold tracking-widest text-maroon">{group.inviteCode}</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 border border-maroon/25 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
              >
                {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                {codeCopied ? "Copiado" : "Copiar"}
              </button>
            </Card>
          </div>
        </div>
    </div>
  );
}
