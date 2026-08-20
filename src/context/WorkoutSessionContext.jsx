import { createContext, useContext, useState } from "react";
import { apiFetch, ApiError } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const WorkoutSessionContext = createContext(null);

function newClientToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

// Motor de sesión guiada (Mecánica 2, Fase 3/4). `session` es la sesión
// activa/actual cargada en memoria — el server sigue siendo la fuente de
// verdad (una sola sesión "in_progress"/"paused" por usuario), acá solo se
// cachea la última respuesta para no repintar de cero en cada acción.
export function WorkoutSessionProvider({ children }) {
  const { token } = useAuth();
  const [session, setSession] = useState(null);

  // Devuelve la sesión activa (en curso o pausada) si existe, o null — para
  // saber si hay que ofrecer "Continuar sesión" en vez de "Empezar".
  async function checkActive() {
    if (!token) return null;
    try {
      const res = await apiFetch("/api/workout-sessions/active", { token });
      setSession(res);
      return res;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSession(null);
        return null;
      }
      throw err;
    }
  }

  // Si ya hay una sesión activa (de esta rutina o de otra), el backend la
  // devuelve tal cual en vez de crear una nueva — no hace falta chequear antes.
  async function startSession(routineId) {
    const res = await apiFetch("/api/workout-sessions", { method: "POST", token, body: { routineId } });
    setSession(res);
    return res;
  }

  async function refreshSession(id) {
    const res = await apiFetch(`/api/workout-sessions/${id}`, { token });
    setSession(res);
    return res;
  }

  // Confirmar una serie: crea un ProgressMark REAL del lado del server (si no
  // es calentamiento) — acá solo se pide con un ClientToken nuevo para que un
  // reintento por red no duplique la serie, y se refresca la sesión completa
  // para traer el historial/recomendación ya actualizados.
  async function confirmSet(sessionId, payload) {
    const res = await apiFetch(`/api/workout-sessions/${sessionId}/sets`, {
      method: "POST",
      token,
      body: { ...payload, clientToken: payload.clientToken || newClientToken() },
    });
    await refreshSession(sessionId);
    return res;
  }

  async function updateExerciseStatus(sessionId, exerciseSessionId, status) {
    const res = await apiFetch(`/api/workout-sessions/${sessionId}/exercises/${exerciseSessionId}`, {
      method: "PUT",
      token,
      body: { status },
    });
    setSession(res);
    return res;
  }

  async function pauseSession(id) {
    const res = await apiFetch(`/api/workout-sessions/${id}/pause`, { method: "POST", token });
    setSession(res);
    return res;
  }

  async function resumeSession(id) {
    const res = await apiFetch(`/api/workout-sessions/${id}/resume`, { method: "POST", token });
    setSession(res);
    return res;
  }

  async function abandonSession(id) {
    const res = await apiFetch(`/api/workout-sessions/${id}/abandon`, { method: "POST", token });
    setSession(null);
    return res;
  }

  async function completeSession(id) {
    const res = await apiFetch(`/api/workout-sessions/${id}/complete`, { method: "POST", token });
    setSession(null);
    return res;
  }

  // Historial liviano de una rutina (Fase 5) — para el panel de "Historial y
  // constancia" en Rutinas.jsx. No toca `session` (el estado de la sesión
  // activa), es una consulta aparte.
  async function listSessions(routineId, take = 10) {
    const qs = new URLSearchParams({ routineId, take: String(take) });
    return apiFetch(`/api/workout-sessions?${qs.toString()}`, { token });
  }

  const value = {
    session,
    checkActive,
    startSession,
    refreshSession,
    confirmSet,
    updateExerciseStatus,
    pauseSession,
    resumeSession,
    abandonSession,
    completeSession,
    listSessions,
  };

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
}

export function useWorkoutSession() {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) throw new Error("useWorkoutSession debe usarse dentro de <WorkoutSessionProvider>");
  return ctx;
}
