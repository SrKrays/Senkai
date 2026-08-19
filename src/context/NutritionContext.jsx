import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { nutrition } from "../data/mockData";
import { toISO } from "../utils/date";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const NutritionContext = createContext(null);

function fromSlotDto(s) {
  return { id: s.id, name: s.name };
}

function toNestedLogs(flatLogs) {
  const byDate = {};
  for (const l of flatLogs) {
    (byDate[l.date] ||= {})[l.slotId] = {
      description: l.description,
      calories: l.calories,
      notes: l.notes || "",
      imageUrl: l.imageUrl || null,
    };
  }
  return byDate;
}

export function NutritionProvider({ children }) {
  const { token } = useAuth();
  const [mealSlots, setMealSlots] = useState([]);
  const [mealLogsByDate, setMealLogsByDate] = useState({});
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISO(today);
  const todayLogs = mealLogsByDate[todayISO] || {};

  useEffect(() => {
    if (!token) {
      setMealSlots([]);
      setMealLogsByDate({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([apiFetch("/api/nutrition/meal-slots", { token }), apiFetch("/api/nutrition/meal-logs", { token })])
      .then(([slotsRes, logsRes]) => {
        if (cancelled) return;
        setMealSlots(slotsRes.map(fromSlotDto));
        setMealLogsByDate(toNestedLogs(logsRes));
      })
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar Nutrición.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function addMealSlot(name) {
    if (!name.trim()) return;
    try {
      const created = await apiFetch("/api/nutrition/meal-slots", { method: "POST", token, body: { name } });
      setMealSlots((prev) => [...prev, fromSlotDto(created)]);
    } catch {
      toast.error("No se pudo agregar la división de comida.");
    }
  }

  async function renameMealSlot(id, name) {
    if (!name.trim()) return;
    try {
      const updated = await apiFetch(`/api/nutrition/meal-slots/${id}`, { method: "PUT", token, body: { name } });
      setMealSlots((prev) => prev.map((s) => (s.id === id ? fromSlotDto(updated) : s)));
    } catch {
      toast.error("No se pudo renombrar la división.");
    }
  }

  async function deleteMealSlot(id) {
    const prevSlots = mealSlots;
    const prevLogs = mealLogsByDate;
    setMealSlots((prev) => prev.filter((s) => s.id !== id));
    setMealLogsByDate((prev) => {
      const next = {};
      for (const [date, logs] of Object.entries(prev)) {
        const { [id]: _removed, ...rest } = logs;
        next[date] = rest;
      }
      return next;
    });
    try {
      await apiFetch(`/api/nutrition/meal-slots/${id}`, { method: "DELETE", token });
    } catch {
      setMealSlots(prevSlots);
      setMealLogsByDate(prevLogs);
      toast.error("No se pudo borrar la división.");
    }
  }

  async function upsertLog(dateISO, slotId, entry) {
    try {
      const saved = await apiFetch("/api/nutrition/meal-logs", {
        method: "POST",
        token,
        body: {
          slotId,
          date: dateISO,
          description: entry.description,
          calories: Number(entry.calories) || 0,
          notes: entry.notes,
          imageUrl: entry.imageUrl,
        },
      });
      setMealLogsByDate((prev) => ({
        ...prev,
        [dateISO]: {
          ...prev[dateISO],
          [slotId]: {
            description: saved.description,
            calories: saved.calories,
            notes: saved.notes || "",
            imageUrl: saved.imageUrl || null,
          },
        },
      }));
    } catch {
      toast.error("No se pudo guardar la comida.");
    }
  }

  function logMeal(dateISO, slotId, entry) {
    return upsertLog(dateISO, slotId, entry);
  }

  function updateMealLog(dateISO, slotId, patch) {
    const existing = mealLogsByDate[dateISO]?.[slotId];
    if (!existing) return;
    return upsertLog(dateISO, slotId, { ...existing, ...patch });
  }

  async function deleteMealLog(dateISO, slotId) {
    const prevLogs = mealLogsByDate;
    setMealLogsByDate((prev) => {
      const dayLogs = prev[dateISO];
      if (!dayLogs || !dayLogs[slotId]) return prev;
      const { [slotId]: _removed, ...rest } = dayLogs;
      return { ...prev, [dateISO]: rest };
    });
    try {
      await apiFetch(`/api/nutrition/meal-logs/${slotId}/${dateISO}`, { method: "DELETE", token });
    } catch {
      setMealLogsByDate(prevLogs);
      toast.error("No se pudo borrar el registro.");
    }
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
    loading,
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
