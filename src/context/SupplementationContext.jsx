import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { toISO } from "../utils/date";
import { notifySupplement } from "../utils/notify";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const SupplementationContext = createContext(null);

function fromSupplementDto(s) {
  return { id: s.id, name: s.name, icon: s.icon, checksByDate: s.checksByDate };
}

export function SupplementationProvider({ children }) {
  const { token } = useAuth();
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISO(today);

  useEffect(() => {
    if (!token) {
      setSupplements([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch("/api/supplements", { token })
      .then((res) => {
        if (cancelled) return;
        setSupplements(res.map(fromSupplementDto));
      })
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar Suplementación.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function addSupplement({ name, icon }) {
    if (!name.trim()) return;
    try {
      const created = await apiFetch("/api/supplements", { method: "POST", token, body: { name, icon } });
      setSupplements((prev) => [...prev, fromSupplementDto(created)]);
    } catch {
      toast.error("No se pudo crear el suplemento.");
    }
  }

  async function updateSupplement(id, patch) {
    const current = supplements.find((s) => s.id === id);
    if (!current) return;
    const merged = { ...current, ...patch };
    try {
      const updated = await apiFetch(`/api/supplements/${id}`, {
        method: "PUT",
        token,
        body: { name: merged.name, icon: merged.icon },
      });
      setSupplements((prev) => prev.map((s) => (s.id === id ? fromSupplementDto(updated) : s)));
    } catch {
      toast.error("No se pudo editar el suplemento.");
    }
  }

  async function deleteSupplement(id) {
    const prev = supplements;
    setSupplements((p) => p.filter((s) => s.id !== id));
    try {
      await apiFetch(`/api/supplements/${id}`, { method: "DELETE", token });
    } catch {
      setSupplements(prev);
      toast.error("No se pudo borrar el suplemento.");
    }
  }

  async function toggleCheck(id, dateISO) {
    const target = supplements.find((s) => s.id === id);
    const wasChecked = !!target?.checksByDate[dateISO];
    setSupplements((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, checksByDate: { ...s.checksByDate, [dateISO]: !s.checksByDate[dateISO] } }
          : s
      )
    );
    if (target && !wasChecked) notifySupplement(target.name);
    try {
      const updated = await apiFetch(`/api/supplements/${id}/checks`, {
        method: "POST",
        token,
        body: { date: dateISO },
      });
      setSupplements((prev) => prev.map((s) => (s.id === id ? fromSupplementDto(updated) : s)));
    } catch {
      setSupplements((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, checksByDate: { ...s.checksByDate, [dateISO]: wasChecked } }
            : s
        )
      );
      toast.error("No se pudo guardar el check.");
    }
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
    loading,
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
