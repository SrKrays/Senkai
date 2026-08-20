import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const TrainingGoalContext = createContext(null);

// Objetivos "activos" reales (Fase 9 v2) — reemplaza el panel mock de
// Stats.jsx que vivía solo en memoria del navegador con una barra que el
// usuario arrastraba a mano. Acá el progreso SIEMPRE viene calculado por el
// backend a partir de datos reales (PR real del catálogo, o check-ins de
// entreno reales) — este contexto solo trae/crea/borra, nunca calcula.
// Lunes de la semana de `date`, en yyyy-MM-dd local (evita el corrimiento
// de toISOString con UTC) — duplicado mínimo de utils/date.js para no atar
// este context a la carpeta de Tracker, que es un dominio aparte.
function isoLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}
function sundayOf(date) {
  const d = mondayOf(date);
  d.setDate(d.getDate() + 6);
  return d;
}

export function TrainingGoalProvider({ children }) {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedInToday, setCheckedInToday] = useState(false);
  // Días REALES entrenados esta semana (check-in manual o automático al
  // cargar una marca) — reemplaza al Tracker de hábitos como fuente del
  // progreso semanal de Rutinas (Mecánica 2), que queda aparte.
  const [weekCheckIns, setWeekCheckIns] = useState([]);

  async function refresh() {
    if (!token) {
      setGoals([]);
      setCheckedInToday(false);
      setWeekCheckIns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const today = new Date();
      const start = isoLocal(mondayOf(today));
      const end = isoLocal(sundayOf(today));
      const [goalsRes, checkinRes, weekRes] = await Promise.all([
        apiFetch("/api/training-goals", { token }),
        apiFetch("/api/training-goals/checkin/today", { token }),
        apiFetch(`/api/training-goals/checkin?start=${start}&end=${end}`, { token }),
      ]);
      setGoals(goalsRes);
      setCheckedInToday(checkinRes.alreadyCheckedIn);
      setWeekCheckIns(weekRes);
    } catch {
      // Silencioso — mismo patrón que el resto de los contexts.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function createGoal(payload) {
    const created = await apiFetch("/api/training-goals", { method: "POST", token, body: payload });
    setGoals((prev) => [...prev, created]);
    return created;
  }

  async function deleteGoal(id) {
    const prev = goals;
    setGoals((p) => p.filter((g) => g.id !== id));
    try {
      await apiFetch(`/api/training-goals/${id}`, { method: "DELETE", token });
    } catch {
      setGoals(prev);
      throw new Error("No se pudo borrar el objetivo.");
    }
  }

  // Botón "Confirmar entreno de hoy" en Rutinas — idempotente, no rompe si
  // se aprieta dos veces. Refresca los objetivos porque puede haber cambiado
  // el progreso del objetivo grupal de días entrenados.
  async function checkInToday() {
    const res = await apiFetch("/api/training-goals/checkin", { method: "POST", token });
    setCheckedInToday(true);
    await refresh();
    return res;
  }

  const value = { goals, loading, checkedInToday, weekCheckIns, createGoal, deleteGoal, checkInToday, refresh };

  return <TrainingGoalContext.Provider value={value}>{children}</TrainingGoalContext.Provider>;
}

export function useTrainingGoals() {
  const ctx = useContext(TrainingGoalContext);
  if (!ctx) throw new Error("useTrainingGoals debe usarse dentro de <TrainingGoalProvider>");
  return ctx;
}
