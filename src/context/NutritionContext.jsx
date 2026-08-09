import { createContext, useContext, useMemo, useState } from "react";
import { defaultMealSlots, nutrition } from "../data/mockData";
import { toISO } from "../utils/date";

const NutritionContext = createContext(null);

// Datos de muestra para HOY (2026-08-09) — dos comidas ya cargadas, para
// que se vea a Goku a mitad de camino apenas entrás a la sección.
const SEED_DATE = "2026-08-09";
const seedMealLogs = {
  [SEED_DATE]: {
    desayuno: { description: "Avena con banana y maní", calories: 520, notes: "", imageUrl: null },
    almuerzo: { description: "Pollo, arroz y verduras", calories: 780, notes: "Con aceite de oliva extra", imageUrl: null },
  },
};

export function NutritionProvider({ children }) {
  const [mealSlots, setMealSlots] = useState(defaultMealSlots);
  const [mealLogsByDate, setMealLogsByDate] = useState(seedMealLogs);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISO(today);
  const todayLogs = mealLogsByDate[todayISO] || {};

  function addMealSlot(name) {
    if (!name.trim()) return;
    setMealSlots((prev) => [...prev, { id: `slot-${Date.now()}`, name: name.trim() }]);
  }

  function renameMealSlot(id, name) {
    if (!name.trim()) return;
    setMealSlots((prev) => prev.map((s) => (s.id === id ? { ...s, name: name.trim() } : s)));
  }

  function deleteMealSlot(id) {
    setMealSlots((prev) => prev.filter((s) => s.id !== id));
    setMealLogsByDate((prev) => {
      const next = {};
      for (const [date, logs] of Object.entries(prev)) {
        const { [id]: _removed, ...rest } = logs;
        next[date] = rest;
      }
      return next;
    });
  }

  function logMeal(dateISO, slotId, entry) {
    setMealLogsByDate((prev) => ({
      ...prev,
      [dateISO]: { ...prev[dateISO], [slotId]: entry },
    }));
  }

  function updateMealLog(dateISO, slotId, patch) {
    setMealLogsByDate((prev) => {
      const dayLogs = prev[dateISO] || {};
      const existing = dayLogs[slotId];
      if (!existing) return prev;
      return { ...prev, [dateISO]: { ...dayLogs, [slotId]: { ...existing, ...patch } } };
    });
  }

  function deleteMealLog(dateISO, slotId) {
    setMealLogsByDate((prev) => {
      const dayLogs = prev[dateISO];
      if (!dayLogs || !dayLogs[slotId]) return prev;
      const { [slotId]: _removed, ...rest } = dayLogs;
      return { ...prev, [dateISO]: rest };
    });
  }

  const mealsLoggedToday = mealSlots.filter((s) => todayLogs[s.id]).length;
  const caloriesToday = mealSlots.reduce((sum, s) => sum + (todayLogs[s.id]?.calories || 0), 0);

  // Puntaje mensual de nutrición (0-1): promedio, día a día del mes hasta hoy, de
  // cuántas divisiones de comida se registraron sobre el total de divisiones activas.
  const nutritionScore = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const elapsed = today.getDate();
    const slotCount = mealSlots.length;
    if (slotCount === 0) return 0;
    let totalLogged = 0;
    for (let d = 1; d <= elapsed; d++) {
      const iso = toISO(new Date(year, month, d));
      const dayLogs = mealLogsByDate[iso] || {};
      totalLogged += mealSlots.filter((s) => dayLogs[s.id]).length;
    }
    return totalLogged / (elapsed * slotCount);
  }, [mealLogsByDate, mealSlots, today]);

  const value = {
    mealSlots,
    mealLogsByDate,
    today,
    todayISO,
    todayLogs,
    mealsLoggedToday,
    caloriesToday,
    calorieTarget: nutrition.calorieTarget,
    goal: nutrition.goal,
    nutritionScore,
    addMealSlot,
    renameMealSlot,
    deleteMealSlot,
    logMeal,
    updateMealLog,
    deleteMealLog,
  };

  return <NutritionContext.Provider value={value}>{children}</NutritionContext.Provider>;
}

export function useNutrition() {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error("useNutrition debe usarse dentro de <NutritionProvider>");
  return ctx;
}
