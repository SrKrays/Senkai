import { useState } from "react";
import { PageHeader, Card, Tag, ProgressBar, CharacterArt } from "../components/ui";
import { useSupplementation } from "../context/SupplementationContext";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useNutrition } from "../context/NutritionContext";
import { usePoints } from "../context/PointsContext";
import { vegetaEvolution } from "../data/mockData";
import { getVegetaStage } from "../utils/evolution";
import { DIAS_CORTOS, currentStreak, daysInMonth, monthLabel, toISO } from "../utils/date";

export default function Supplementation() {
  const {
    supplements,
    today,
    todayISO,
    supplementationScore,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    toggleCheck,
    toggleToday,
  } = useSupplementation();
  const { trackerScore } = useTracker();
  const { trainingScore } = useTraining();
  const { nutritionScore } = useNutrition();
  const { powerLevel } = usePoints();

  const { current, next, progress } = getVegetaStage(powerLevel, vegetaEvolution);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("SUP");

  const year = today.getFullYear();
  const month = today.getMonth();
  const totalDays = daysInMonth(year, month);
  const monthDates = Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1));

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditIcon(s.icon);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editName.trim()) return;
    updateSupplement(editingId, { name: editName.trim(), icon: editIcon.trim() || "SUP" });
    setEditingId(null);
  }

  function handleAdd() {
    if (!newName.trim()) return;
    addSupplement({ name: newName, icon: newIcon });
    setNewName("");
    setNewIcon("SUP");
    setShowNew(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Suplementación"
        title="Rachas activas"
        description="Marcá cada día que tomaste tu suplemento. La racha y el calendario se arman solos según las fechas registradas."
        action={
          <button
            onClick={() => setShowNew((v) => !v)}
            className="border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper"
          >
            + Suplemento
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
      <div>

      {showNew && (
        <Card className="mb-6">
          <p className="eyebrow mb-3">Nuevo suplemento</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="Tag (ej: BCAA)"
              className="w-24 border border-maroon/20 bg-transparent px-2 py-2 text-center text-sm outline-none focus:border-maroon"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nombre (ej: Omega 3)"
              className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
              >
                Agregar
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Card>
      )}

      {supplements.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-display text-3xl tracking-wide text-maroon">Sin suplementos cargados</p>
          <p className="max-w-sm text-sm text-muted">Agregá al menos uno con "+ Suplemento" arriba.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
          {supplements.map((s) => {
            const streak = currentStreak(s.checksByDate, today);
            const takenToday = !!s.checksByDate[todayISO];
            const isEditing = editingId === s.id;

            return (
              <Card key={s.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="w-16 border border-maroon/30 bg-transparent px-2 py-1 text-center text-sm outline-none focus:border-maroon"
                      />
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        className="flex-1 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                      />
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
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="hud flex h-12 w-12 shrink-0 items-center justify-center border border-ink/20 font-mono text-[10px] text-muted">
                          {s.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="font-mono text-[10px] uppercase tracking-widest2 text-muted">
                            {streak} día(s) seguidos
                          </p>
                        </div>
                      </div>
                      <span className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => startEdit(s)}
                          aria-label={`Editar ${s.name}`}
                          title="Editar"
                          className="text-muted hover:text-maroon"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteSupplement(s.id)}
                          aria-label={`Borrar ${s.name}`}
                          title="Borrar"
                          className="text-muted hover:text-maroon"
                        >
                          ✕
                        </button>
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => toggleToday(s.id)}
                  className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 ${
                    takenToday
                      ? "bg-maroon text-paper"
                      : "border border-maroon/30 text-maroon hover:bg-maroon/10"
                  }`}
                >
                  {takenToday ? `Hoy tomé ${s.name} ✓` : `Marcar que hoy tomé ${s.name}`}
                </button>

                <div className="border-t border-maroon/10 pt-3">
                  <p className="eyebrow mb-2 text-maroon">{monthLabel(today)}</p>
                  <div className="grid grid-cols-7 gap-1">
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
                      const checked = !!s.checksByDate[dateISO];
                      const isFuture = d > today;
                      const isToday = dateISO === todayISO;
                      return (
                        <button
                          key={dateISO}
                          disabled={isFuture}
                          onClick={() => toggleCheck(s.id, dateISO)}
                          title={dateISO}
                          className={`flex h-6 w-6 items-center justify-center text-[9px] font-mono transition-all ${
                            isFuture
                              ? "cursor-default text-muted/30"
                              : checked
                              ? "animate-pop bg-maroon text-paper"
                              : "border border-maroon/20 text-muted hover:border-maroon/50"
                          } ${isToday ? "ring-1 ring-maroon" : ""}`}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Tag tone={streak > 0 ? "teal" : "maroon"}>
                  {streak > 0 ? `Racha activa: ${streak} día(s)` : "Sin racha activa"}
                </Tag>
              </Card>
            );
          })}
        </div>
      )}

      </div>

      {/* Vegeta evolucionando — mismo progreso combinado que Tracker/Entrenamiento/Nutrición */}
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
