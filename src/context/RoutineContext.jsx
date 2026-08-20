import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const RoutineContext = createContext(null);

// Rutinas reales (Mecánica 2, Fase 2) — reemplaza el mock que vivía en
// Routines.jsx. Los ejercicios de una rutina son siempre un Exercise real
// (mismo catálogo que Entrenamiento), nunca texto libre.
export function RoutineProvider({ children }) {
  const { token } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!token) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/routines", { token });
      setRoutines(res);
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

  async function createRoutine(payload) {
    const created = await apiFetch("/api/routines", { method: "POST", token, body: payload });
    setRoutines((prev) => [...prev, created]);
    return created;
  }

  async function updateRoutine(id, payload) {
    const updated = await apiFetch(`/api/routines/${id}`, { method: "PUT", token, body: payload });
    setRoutines((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }

  async function deleteRoutine(id) {
    const prev = routines;
    setRoutines((p) => p.filter((r) => r.id !== id));
    try {
      await apiFetch(`/api/routines/${id}`, { method: "DELETE", token });
    } catch {
      setRoutines(prev);
      throw new Error("No se pudo borrar la rutina.");
    }
  }

  async function addExerciseToRoutine(routineId, payload) {
    const created = await apiFetch(`/api/routines/${routineId}/exercises`, { method: "POST", token, body: payload });
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, exercises: [...r.exercises, created] } : r))
    );
    return created;
  }

  async function updateRoutineExercise(routineId, entryId, payload) {
    const updated = await apiFetch(`/api/routines/${routineId}/exercises/${entryId}`, {
      method: "PUT",
      token,
      body: payload,
    });
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId
          ? { ...r, exercises: r.exercises.map((e) => (e.id === entryId ? updated : e)) }
          : r
      )
    );
    return updated;
  }

  async function deleteRoutineExercise(routineId, entryId) {
    const prev = routines;
    setRoutines((p) =>
      p.map((r) => (r.id === routineId ? { ...r, exercises: r.exercises.filter((e) => e.id !== entryId) } : r))
    );
    try {
      await apiFetch(`/api/routines/${routineId}/exercises/${entryId}`, { method: "DELETE", token });
    } catch {
      setRoutines(prev);
      throw new Error("No se pudo borrar el ejercicio de la rutina.");
    }
  }

  const value = {
    routines,
    loading,
    refresh,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    updateRoutineExercise,
    deleteRoutineExercise,
  };

  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutines() {
  const ctx = useContext(RoutineContext);
  if (!ctx) throw new Error("useRoutines debe usarse dentro de <RoutineProvider>");
  return ctx;
}
