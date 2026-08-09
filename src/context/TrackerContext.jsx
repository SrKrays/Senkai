import { createContext, useContext, useMemo, useState } from "react";
import { habits as initialHabits, personalNotes as initialNotes } from "../data/mockData";
import { monthlyCompletion } from "../utils/date";

const TrackerContext = createContext(null);

export function TrackerProvider({ children }) {
  const [habits, setHabits] = useState(initialHabits);
  const [notes, setNotes] = useState(initialNotes);

  const today = useMemo(() => new Date(), []);
  const monthly = useMemo(() => monthlyCompletion(habits, notes, today), [habits, notes, today]);

  function toggleCheck(habitId, dateISO) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { ...h, checksByDate: { ...h.checksByDate, [dateISO]: !h.checksByDate[dateISO] } }
          : h
      )
    );
  }

  function addHabit({ name, icon, type }) {
    if (!name.trim()) return;
    setHabits((prev) => [
      ...prev,
      { id: Date.now(), name: name.trim(), icon: icon.trim() || "⭐", type, checksByDate: {} },
    ]);
  }

  function updateHabit(id, patch) {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  function addNote(text) {
    if (!text.trim()) return;
    setNotes((prev) => [...prev, { id: Date.now(), type: "personal", text: text.trim(), done: false }]);
  }

  function toggleNote(id) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
  }

  function updateNote(id, text) {
    if (!text.trim()) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: text.trim() } : n)));
  }

  function deleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const value = {
    habits,
    notes,
    today,
    monthly,
    trackerScore: monthly.pct,
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
