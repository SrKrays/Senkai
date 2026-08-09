import { createContext, useContext, useMemo, useState } from "react";
import { supplements as initialSupplements } from "../data/mockData";
import { toISO } from "../utils/date";

const SupplementationContext = createContext(null);

export function SupplementationProvider({ children }) {
  const [supplements, setSupplements] = useState(initialSupplements);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISO(today);

  function addSupplement({ name, icon }) {
    if (!name.trim()) return;
    setSupplements((prev) => [
      ...prev,
      { id: `supp-${Date.now()}`, name: name.trim(), icon: (icon || "SUP").trim() || "SUP", checksByDate: {} },
    ]);
  }

  function updateSupplement(id, patch) {
    setSupplements((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function deleteSupplement(id) {
    setSupplements((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleCheck(id, dateISO) {
    setSupplements((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, checksByDate: { ...s.checksByDate, [dateISO]: !s.checksByDate[dateISO] } }
          : s
      )
    );
  }

  function toggleToday(id) {
    toggleCheck(id, todayISO);
  }

  // Puntaje mensual de suplementación (0-1): promedio, por suplemento, de
  // cuántos días transcurridos del mes se marcó como tomado. Sin suplementos
  // cargados, da 0.
  const supplementationScore = useMemo(() => {
    if (supplements.length === 0) return 0;
    const elapsed = today.getDate();
    if (elapsed === 0) return 0;
    const ratios = supplements.map((s) => {
      let checked = 0;
      const year = today.getFullYear();
      const month = today.getMonth();
      for (let d = 1; d <= elapsed; d++) {
        if (s.checksByDate[toISO(new Date(year, month, d))]) checked++;
      }
      return checked / elapsed;
    });
    return ratios.reduce((a, b) => a + b, 0) / ratios.length;
  }, [supplements, today]);

  const value = {
    supplements,
    today,
    todayISO,
    supplementationScore,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    toggleCheck,
    toggleToday,
  };

  return <SupplementationContext.Provider value={value}>{children}</SupplementationContext.Provider>;
}

export function useSupplementation() {
  const ctx = useContext(SupplementationContext);
  if (!ctx) throw new Error("useSupplementation debe usarse dentro de <SupplementationProvider>");
  return ctx;
}
