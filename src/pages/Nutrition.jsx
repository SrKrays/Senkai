import { useEffect, useState } from "react";
import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import CharacterFlipbook from "../components/CharacterFlipbook";
import { useNutrition } from "../context/NutritionContext";
import { useTracker } from "../context/TrackerContext";
import { useTraining } from "../context/TrainingContext";
import { useSupplementation } from "../context/SupplementationContext";
import { usePoints } from "../context/PointsContext";
import { useAuth } from "../context/AuthContext";
import { useCharacter } from "../context/CharacterContext";
import { gokuEating } from "../data/mockData";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { apiFetch } from "../utils/apiClient";

function getGokuStage(mealsLoggedToday) {
  const idx = Math.min(mealsLoggedToday, gokuEating.length - 1);
  return gokuEating[idx];
}

const EMPTY_DRAFT = { description: "", calories: "", proteinGrams: "", notes: "", imageUrl: null };

// Card de una división de comida — es su propio componente (no un bloque
// inline dentro del .map()) porque necesita su propio estado de búsqueda
// (autocompletado USDA) con debounce, y los hooks no pueden vivir dentro
// de un callback de map.
function MealSlotCard({
  slot,
  entry,
  isEditingEntry,
  isEditingName,
  slotNameDraft,
  draft,
  token,
  onStartEditSlotName,
  onSlotNameDraftChange,
  onSaveSlotName,
  onDeleteSlot,
  onSetDraft,
  onImagePick,
  onRegister,
  onStartEditLog,
  onSaveEditLog,
  onCancelEditLog,
  onDeleteLog,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [loadingFood, setLoadingFood] = useState(false);
  const showForm = !entry || isEditingEntry;
  const debouncedDescription = useDebouncedValue(draft.description, 400);

  useEffect(() => {
    if (!showForm || debouncedDescription.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    apiFetch(`/api/external/foods?q=${encodeURIComponent(debouncedDescription.trim())}`, { token })
      .then((res) => {
        if (!cancelled) setSuggestions(res);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedDescription, showForm, token]);

  async function selectFood(food) {
    // Llenamos la descripción al toque (eso sí viene bien en la búsqueda);
    // las calorías y macros vienen de un segundo pedido al detalle completo
    // — la búsqueda casi nunca trae esos datos usables, sobre todo en
    // productos de marca.
    onSetDraft(slot.id, { description: food.description });
    setSuggestions([]);
    setSelectedFood(null);
    setLoadingFood(true);
    try {
      const detail = await apiFetch(`/api/external/foods/${food.fdcId}`, { token });
      onSetDraft(slot.id, {
        description: detail.description || food.description,
        calories: detail.calories != null ? String(Math.round(detail.calories)) : draft.calories,
        proteinGrams: detail.proteinG != null ? String(detail.proteinG) : draft.proteinGrams,
      });
      setSelectedFood(detail);
    } catch {
      setSelectedFood(food);
    } finally {
      setLoadingFood(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        {isEditingName ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={slotNameDraft}
              onChange={(e) => onSlotNameDraftChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSaveSlotName(slot.id)}
              autoFocus
              className="flex-1 border border-maroon/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-maroon"
            />
            <button
              onClick={() => onSaveSlotName(slot.id)}
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
            onClick={() => onStartEditSlotName(slot)}
            aria-label={`Renombrar ${slot.name}`}
            title="Renombrar división"
            className="text-muted hover:text-maroon"
          >
            ✎
          </button>
          <button
            onClick={() => onDeleteSlot(slot.id)}
            aria-label={`Borrar ${slot.name}`}
            title="Borrar división"
            className="text-muted hover:text-maroon"
          >
            ✕
          </button>
        </span>
      </div>

      {entry && !isEditingEntry ? (
        <div className="flex flex-col gap-2">
          {entry.imageUrl && (
            <img src={entry.imageUrl} alt={entry.description} className="h-32 w-full border border-maroon/15 object-cover" />
          )}
          <p className="text-sm">{entry.description || "—"}</p>
          <div className="flex gap-1.5">
            <Tag>{entry.calories} kcal</Tag>
            {entry.proteinGrams != null && <Tag>{entry.proteinGrams}g prot.</Tag>}
          </div>
          {entry.notes && <p className="text-xs text-muted">{entry.notes}</p>}
          <div className="flex gap-3 border-t border-maroon/10 pt-2">
            <button
              onClick={() => onStartEditLog(slot.id)}
              className="font-mono text-[10px] uppercase tracking-widest2 text-maroon underline underline-offset-4"
            >
              Editar
            </button>
            <button
              onClick={() => onDeleteLog(slot.id)}
              className="font-mono text-[10px] uppercase tracking-widest2 text-muted underline underline-offset-4 hover:text-maroon"
            >
              Borrar registro
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <input
              value={draft.description}
              onChange={(e) => {
                onSetDraft(slot.id, { description: e.target.value });
                setSelectedFood(null);
              }}
              placeholder="¿Qué comiste? (en inglés sugiere mejor, ej: noodles)"
              className="w-full border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            {suggestions.length > 0 && (
              <div className="hud absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-maroon/25 bg-card text-ink">
                {suggestions.map((f) => (
                  <button
                    key={f.fdcId}
                    onClick={() => selectFood(f)}
                    className="flex w-full flex-col items-start gap-0.5 border-b border-maroon/10 px-3 py-2 text-left text-sm last:border-none hover:bg-maroon/10"
                  >
                    <span className="font-semibold">{f.description}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-muted">
                      {f.calories != null ? `${Math.round(f.calories)} kcal` : "—"}
                      {f.brandOwner ? ` · ${f.brandOwner}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingFood && (
            <p className="font-mono text-[10px] uppercase tracking-widest2 text-muted">Buscando info nutricional…</p>
          )}
          {!loadingFood && selectedFood && (
            <p className="font-mono text-[10px] uppercase tracking-widest2 text-muted">
              {[
                selectedFood.proteinG != null ? `Proteína ${selectedFood.proteinG}g` : null,
                selectedFood.carbsG != null ? `Carbs ${selectedFood.carbsG}g` : null,
                selectedFood.fatG != null ? `Grasa ${selectedFood.fatG}g` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Este alimento no trae más detalle en USDA"}
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={draft.calories}
              onChange={(e) => onSetDraft(slot.id, { calories: e.target.value })}
              placeholder="Calorías"
              className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            <input
              type="number"
              value={draft.proteinGrams}
              onChange={(e) => onSetDraft(slot.id, { proteinGrams: e.target.value })}
              placeholder="Proteína (g)"
              className="flex-1 border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
            />
          </div>
          <textarea
            value={draft.notes}
            onChange={(e) => onSetDraft(slot.id, { notes: e.target.value })}
            placeholder="Notas (opcional)"
            rows={2}
            className="border border-maroon/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon"
          />
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer border border-dashed border-maroon/30 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-muted hover:border-maroon">
              {draft.imageUrl ? "Imagen cargada ✓" : "Subir imagen"}
              <input type="file" accept="image/*" onChange={(e) => onImagePick(slot.id, e.target.files?.[0])} className="hidden" />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (isEditingEntry ? onSaveEditLog(slot.id) : onRegister(slot.id))}
              className="bg-maroon px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper hover:opacity-90 hover:shadow-glow transition-all duration-250"
            >
              {isEditingEntry ? "Guardar" : "Registrar comida"}
            </button>
            {isEditingEntry && (
              <button
                onClick={() => onCancelEditLog(slot.id)}
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
}

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
  const { token } = useAuth();
  const { current: vegetaStage } = useCharacter();

  const [drafts, setDrafts] = useState({});
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editingSlotName, setEditingSlotName] = useState(null);
  const [slotNameDraft, setSlotNameDraft] = useState("");

  const [showNewSlot, setShowNewSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState("");

  const calPct = calorieTarget ? caloriesToday / calorieTarget : 0;
  const gokuStage = getGokuStage(mealsLoggedToday);

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
      proteinGrams: d.proteinGrams,
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
      proteinGrams: entry.proteinGrams != null ? String(entry.proteinGrams) : "",
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
      proteinGrams: d.proteinGrams,
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
              {mealSlots.map((slot) => (
                <MealSlotCard
                  key={slot.id}
                  slot={slot}
                  entry={todayLogs[slot.id]}
                  isEditingEntry={editingSlotId === slot.id}
                  isEditingName={editingSlotName === slot.id}
                  slotNameDraft={slotNameDraft}
                  draft={draftFor(slot.id)}
                  token={token}
                  onStartEditSlotName={startEditSlotName}
                  onSlotNameDraftChange={setSlotNameDraft}
                  onSaveSlotName={saveSlotName}
                  onDeleteSlot={deleteMealSlot}
                  onSetDraft={setDraft}
                  onImagePick={handleImagePick}
                  onRegister={handleRegister}
                  onStartEditLog={startEditLog}
                  onSaveEditLog={saveEditLog}
                  onCancelEditLog={cancelEditLog}
                  onDeleteLog={(slotId) => deleteMealLog(todayISO, slotId)}
                />
              ))}
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
            <CharacterFlipbook frames={gokuEating.map((s) => s.img)} alt="Goku comiendo" width={200} height={200} />
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
