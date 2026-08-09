import { useState } from "react";
import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import { useNutrition } from "../context/NutritionContext";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useSupplementation } from "../context/SupplementationContext";
import { usePoints } from "../context/PointsContext";
import { gokuEating, vegetaEvolution } from "../data/mockData";
import { getVegetaStage } from "../utils/evolution";

function getGokuStage(mealsLoggedToday) {
  const idx = Math.min(mealsLoggedToday, gokuEating.length - 1);
  return gokuEating[idx];
}

const EMPTY_DRAFT = { description: "", calories: "", notes: "", imageUrl: null };

export default function Nutrition() {
  const {
    mealSlots,
    todayISO,
    todayLogs,
    mealsLoggedToday,
    caloriesToday,
    calorieTarget,
    goal,
    nutritionScore,
    addMealSlot,
    renameMealSlot,
    deleteMealSlot,
    logMeal,
    updateMealLog,
    deleteMealLog,
  } = useNutrition();
  const { trackerScore } = useTracker();
  const { trainingScore } = useTraining();
  const { supplementationScore } = useSupplementation();
  const { powerLevel } = usePoints();

  const [drafts, setDrafts] = useState({});
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editingSlotName, setEditingSlotName] = useState(null);
  const [slotNameDraft, setSlotNameDraft] = useState("");

  const [showNewSlot, setShowNewSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState("");

  const calPct = calorieTarget ? caloriesToday / calorieTarget : 0;
  const gokuStage = getGokuStage(mealsLoggedToday);
  const { current: vegetaStage } = getVegetaStage(powerLevel, vegetaEvolution);

  function draftFor(slotId) {
    return drafts[slotId] || EMPTY_DRAFT;
  }

  function setDraft(slotId, patch) {
    setDrafts((prev) => ({ ...prev, [slotId]: { ...draftFor(slotId), ...patch } }));
  }

  function clearDraft(slotId) {
    setDrafts((prev) => {
      const { [slotId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function handleImagePick(slotId, file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraft(slotId, { imageUrl: url });
  }

  function handleRegister(slotId) {
    const d = draftFor(slotId);
    if (!d.description.trim() && !d.calories) return;
    logMeal(todayISO, slotId, {
      description: d.description.trim(),
      calories: Number(d.calories) || 0,
      notes: d.notes.trim(),
      imageUrl: d.imageUrl,
    });
    clearDraft(slotId);
  }

  function startEditLog(slotId) {
    const entry = todayLogs[slotId];
    if (!entry) return;
    setDraft(slotId, {
      description: entry.description,
      calories: String(entry.calories || ""),
      notes: entry.notes || "",
      imageUrl: entry.imageUrl || null,
    });
    setEditingSlotId(slotId);
  }

  function saveEditLog(slotId) {
    const d = draftFor(slotId);
    updateMealLog(todayISO, slotId, {
      description: d.description.trim(),
      calories: Number(d.calories) || 0,
      notes: d.notes.trim(),
      imageUrl: d.imageUrl,
    });
    clearDraft(slotId);
    setEditingSlotId(null);
  }

  function cancelEditLog(slotId) {
    clearDraft(slotId);
    setEditingSlotId(null);
  }

  function startEditSlotName(slot) {
    setEditingSlotName(slot.id);
    setSlotNameDraft(slot.name);
  }

  function saveSlotName(slotId) {
    renameMealSlot(slotId, slotNameDraft);
    setEditingSlotName(null);
  }

  function handleAddSlot() {
    if (!newSlotName.trim()) return;
    addMealSlot(newSlotName);
    setNewSlotName("");
    setShowNewSlot(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nutrición"
        title="Combustible del día"
        description={`Objetivo: ${goal}. Registrá cada comida y mirá cómo Goku (y Vegeta) reaccionan a tu progreso.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
        <div>
          <Card className="mb-6">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="eyebrow">Calorías de hoy</p>
              <p className="font-mono text-sm text-muted">
                {caloriesToday} / {calorieTarget} kcal
              </p>
            </div>
            <ProgressBar progress={calPct} tone="teal" />
            <p className="mt-2 font-mono text-[10px] text-muted">
              {mealsLoggedToday}/{mealSlots.length} comidas registradas hoy
            </p>
          </Card>

          {/* Paneles de comida — editables, agregables y quitables */}
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Comidas de hoy</p>
            <button
              onClick={() => setShowNewSlot((v) => !v)}
              className="font-mono text-[10px] uppercase tracking-widest2 text-maroon underline underline-offset-4"
            >
              + Agregar comida
            </button>
          </div>

          {showNewSlot && (
            <Card className="mb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSlot()}
                  placeholder="Nombre (ej: Colación nocturna)"
                  className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSlot}
                    className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => setShowNewSlot(false)}
                    className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </Card>
          )}

          {mealSlots.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="font-display text-3xl tracking-wide text-maroon">Sin comidas definidas</p>
              <p className="max-w-sm text-sm text-muted">Agregá al menos una división arriba para empezar a registrar.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {mealSlots.map((slot) => {
                const entry = todayLogs[slot.id];
                const isEditing = editingSlotId === slot.id;
                const draft = draftFor(slot.id);

                return (
                  <Card key={slot.id} className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      {editingSlotName === slot.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            value={slotNameDraft}
                            onChange={(e) => setSlotNameDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveSlotName(slot.id)}
                            autoFocus
                            className="flex-1 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
                          />
                          <button
                            onClick={() => saveSlotName(slot.id)}
                            className="bg-maroon px-2 py-1 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold">{slot.name}</p>
                      )}
                      <span className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => startEditSlotName(slot)}
                          aria-label={`Renombrar ${slot.name}`}
                          title="Renombrar división"
                          className="text-muted hover:text-maroon"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteMealSlot(slot.id)}
                          aria-label={`Borrar ${slot.name}`}
                          title="Borrar división"
                          className="text-muted hover:text-maroon"
                        >
                          ✕
                        </button>
                      </span>
                    </div>

                    {entry && !isEditing ? (
                      <div className="flex flex-col gap-2">
                        {entry.imageUrl && (
                          <img src={entry.imageUrl} alt={entry.description} className="h-32 w-full border border-maroon/15 object-cover" />
                        )}
                        <p className="text-sm">{entry.description || "—"}</p>
                        <Tag>{entry.calories} kcal</Tag>
                        {entry.notes && <p className="text-xs text-muted">{entry.notes}</p>}
                        <div className="flex gap-3 border-t border-maroon/10 pt-2">
                          <button
                            onClick={() => startEditLog(slot.id)}
                            className="font-mono text-[10px] uppercase tracking-widest2 text-maroon underline underline-offset-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteMealLog(todayISO, slot.id)}
                            className="font-mono text-[10px] uppercase tracking-widest2 text-muted underline underline-offset-4 hover:text-maroon"
                          >
                            Borrar registro
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input
                          value={draft.description}
                          onChange={(e) => setDraft(slot.id, { description: e.target.value })}
                          placeholder="¿Qué comiste?"
                          className="border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={draft.calories}
                            onChange={(e) => setDraft(slot.id, { calories: e.target.value })}
                            placeholder="Calorías (manual por ahora)"
                            className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                          />
                        </div>
                        <textarea
                          value={draft.notes}
                          onChange={(e) => setDraft(slot.id, { notes: e.target.value })}
                          placeholder="Notas (opcional)"
                          rows={2}
                          className="border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer border border-dashed border-maroon/30 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-muted hover:border-maroon">
                            {draft.imageUrl ? "Imagen cargada ✓" : "Subir imagen"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImagePick(slot.id, e.target.files?.[0])}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => (isEditing ? saveEditLog(slot.id) : handleRegister(slot.id))}
                            className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
                          >
                            {isEditing ? "Guardar" : "Registrar comida"}
                          </button>
                          {isEditing && (
                            <button
                              onClick={() => cancelEditLog(slot.id)}
                              className="border border-maroon/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="eyebrow text-maroon">Progreso mensual de nutrición</p>
              <p className="font-mono text-xs text-muted">{Math.round(nutritionScore * 100)}%</p>
            </div>
            <ProgressBar progress={nutritionScore} />
            <p className="mt-2 text-xs text-muted">
              Promedio de comidas registradas por día este mes. Suma junto con el Tracker, Entrenamiento y
              Suplementación a la evolución de Vegeta.
            </p>
          </Card>
        </div>

        {/* Goku evolucionando al costado, según cuántas comidas registraste hoy */}
        <div>
          <p className="eyebrow mb-4">Goku de hoy</p>
          <Card className="sticky top-24 flex flex-col items-center gap-4 py-8">
            <CharacterArt src={gokuStage.img} alt={gokuStage.tag} width={200} height={200} />
            <div className="text-center">
              <p className="eyebrow mb-1">{mealsLoggedToday} comida(s) hoy</p>
              <h3 className="font-display text-2xl tracking-wide text-maroon">{gokuStage.tag}</h3>
            </div>
            <p className="text-center text-xs text-muted">
              Cada comida que registrás llena un cuenco más. Al completar todas, Goku queda satisfecho.
            </p>
            <div className="w-full border-t border-maroon/10 pt-4 text-center">
              <p className="eyebrow mb-1">Progreso combinado (Vegeta)</p>
              <p className="font-display text-xl text-maroon">{vegetaStage.name}</p>
              <p className="font-mono text-xs text-muted">{powerLevel.toLocaleString("es-AR")} pts</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
