import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { monthlyCompletion } from "../utils/date";
import { notifyObjective } from "../utils/notify";
import { fireConfetti } from "../utils/confetti";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const TrackerContext = createContext(null);

function fromHabitDto(h) {
  return { id: h.id, name: h.name, type: h.type, icon: h.icon, checksByDate: h.checksByDate };
}

function fromObjectiveDto(o) {
  return { id: o.id, text: o.text, done: o.done };
}

// Fase 1 — hábitos y objetivos reales, persistidos por usuario contra
// Senkai.Api (antes vivían en mockData.js, en memoria). La interfaz pública
// del contexto queda idéntica a la que ya consumen Tracker.jsx, PointsContext,
// Dashboard, Groups, Routines y Stats — solo cambió lo que pasa "adentro".
export function TrackerProvider({ children }) {
  const { token } = useAuth();
  const [habits, setHabits] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const monthly = useMemo(() => monthlyCompletion(habits, notes, today), [habits, notes, today]);

  useEffect(() => {
    if (!token) {
      setHabits([]);
      setNotes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([apiFetch("/api/habits", { token }), apiFetch("/api/objectives", { token })])
      .then(([habitsRes, objectivesRes]) => {
        if (cancelled) return;
        setHabits(habitsRes.map(fromHabitDto));
        setNotes(objectivesRes.map(fromObjectiveDto));
      })
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar el Tracker.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function toggleCheck(habitId, dateISO) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { ...h, checksByDate: { ...h.checksByDate, [dateISO]: !h.checksByDate[dateISO] } }
          : h
      )
    );
    try {
      const updated = await apiFetch(`/api/habits/${habitId}/checks`, {
        method: "POST",
        token,
        body: { date: dateISO },
      });
      setHabits((prev) => prev.map((h) => (h.id === habitId ? fromHabitDto(updated) : h)));
    } catch {
      toast.error("No se pudo guardar el check.");
    }
  }

  async function addHabit({ name, icon, type }) {
    if (!name.trim()) return;
    try {
      const created = await apiFetch("/api/habits", { method: "POST", token, body: { name, type, icon } });
      setHabits((prev) => [...prev, fromHabitDto(created)]);
    } catch {
      toast.error("No se pudo crear el hábito.");
    }
  }

  async function updateHabit(id, patch) {
    const current = habits.find((h) => h.id === id);
    if (!current) return;
    const merged = { ...current, ...patch };
    try {
      const updated = await apiFetch(`/api/habits/${id}`, {
        method: "PUT",
        token,
        body: { name: merged.name, type: merged.type, icon: merged.icon },
      });
      setHabits((prev) => prev.map((h) => (h.id === id ? fromHabitDto(updated) : h)));
    } catch {
      toast.error("No se pudo editar el hábito.");
    }
  }

  async function deleteHabit(id) {
    const prevHabits = habits;
    setHabits((prev) => prev.filter((h) => h.id !== id));
    try {
      await apiFetch(`/api/habits/${id}`, { method: "DELETE", token });
    } catch {
      setHabits(prevHabits);
      toast.error("No se pudo borrar el hábito.");
    }
  }

  async function addNote(text) {
    if (!text.trim()) return;
    try {
      const created = await apiFetch("/api/objectives", { method: "POST", token, body: { text } });
      setNotes((prev) => [...prev, fromObjectiveDto(created)]);
    } catch {
      toast.error("No se pudo agregar el objetivo.");
    }
  }

  async function toggleNote(id) {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const willBeDone = !target.done;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done: willBeDone } : n)));
    if (willBeDone) {
      notifyObjective(target.text);
      fireConfetti();
    }
    try {
      const updated = await apiFetch(`/api/objectives/${id}/toggle`, { method: "POST", token });
      setNotes((prev) => prev.map((n) => (n.id === id ? fromObjectiveDto(updated) : n)));
    } catch {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done: target.done } : n)));
      toast.error("No se pudo actualizar el objetivo.");
    }
  }

  async function updateNote(id, text) {
    if (!text.trim()) return;
    try {
      const updated = await apiFetch(`/api/objectives/${id}`, { method: "PUT", token, body: { text } });
      setNotes((prev) => prev.map((n) => (n.id === id ? fromObjectiveDto(updated) : n)));
    } catch {
      toast.error("No se pudo editar el objetivo.");
    }
  }

  async function deleteNote(id) {
    const prevNotes = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiFetch(`/api/objectives/${id}`, { method: "DELETE", token });
    } catch {
      setNotes(prevNotes);
      toast.error("No se pudo borrar el objetivo.");
    }
  }

  const value = {
    habits,
    notes,
    today,
    monthly,
    trackerScore: monthly.pct,
    loading,
    toggleCheck,
    addHabit,
    updateHabit,
    deleteHabit,
    addNote,
    toggleNote,
    updateNote,
    deleteNote,
  };

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker debe usarse dentro de <TrackerProvider>");
  return ctx;
}
