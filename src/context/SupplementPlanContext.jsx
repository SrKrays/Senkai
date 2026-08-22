import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { toISO } from "../utils/date";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const SupplementPlanContext = createContext(null);

// Mecánica 3 (Fase 6) — catálogo cerrado y contextual (creatina, proteína,
// cafeína, magnesio), contra /api/supplement-plan. Reemplaza en la UI al
// checklist libre viejo (SupplementationContext/Supplementation.jsx), que
// sigue vivo en el backend tal cual quedó (frozen), sin romperse — esta es
// una pantalla nueva, no una migración de esa.
function newClientToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function nowTimeHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function SupplementPlanProvider({ children }) {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [monthLogs, setMonthLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({}); // { [key]: true } mientras hay un POST/PUT en vuelo

  const today = useMemo(() => new Date(), []);
  const firstOfMonthISO = useMemo(() => toISO(new Date(today.getFullYear(), today.getMonth(), 1)), [today]);
  const todayISO = toISO(today);

  const refresh = useCallback(async () => {
    if (!token) {
      setRecommendations([]);
      setPreferences([]);
      setMonthLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [recs, prefs, logs] = await Promise.all([
        apiFetch(`/api/supplement-plan/recommendations?date=${todayISO}&time=${nowTimeHHMM()}`, { token }),
        apiFetch("/api/supplement-plan/preferences", { token }),
        apiFetch(`/api/supplement-plan/logs?start=${firstOfMonthISO}&end=${todayISO}`, { token }),
      ]);
      setRecommendations(recs);
      setPreferences(prefs);
      setMonthLogs(logs);
    } catch {
      toast.error("No se pudo cargar el plan de suplementación.");
    } finally {
      setLoading(false);
    }
  }, [token, firstOfMonthISO, todayISO]);

  // Un mapa { fecha: eventType } por categoría, quedándose con la ÚLTIMA
  // acción del día (el back ya ordena por Date y LoggedAt) — si saltaste a
  // la mañana y lo tomaste igual a la tarde, cuenta como tomado.
  const logsByKey = useMemo(() => {
    const map = {};
    for (const log of monthLogs) {
      (map[log.supplementKey] ||= {})[log.date] = log.eventType;
    }
    return map;
  }, [monthLogs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function logAction(key, eventType, snoozeUntil) {
    setActing((prev) => ({ ...prev, [key]: true }));
    try {
      await apiFetch("/api/supplement-plan/logs", {
        method: "POST",
        token,
        body: {
          supplementKey: key,
          date: toISO(new Date()),
          eventType,
          snoozeUntil: snoozeUntil ? snoozeUntil.toISOString() : null,
          clientToken: newClientToken(),
        },
      });
      await refresh();
    } catch {
      toast.error("No se pudo registrar la acción.");
    } finally {
      setActing((prev) => ({ ...prev, [key]: false }));
    }
  }

  function markTaken(key) {
    return logAction(key, "taken");
  }

  function markSkipped(key) {
    return logAction(key, "skipped");
  }

  function snooze(key, hours = 2) {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    return logAction(key, "snoozed", until);
  }

  async function setPreferenceEnabled(key, enabled) {
    setActing((prev) => ({ ...prev, [key]: true }));
    try {
      await apiFetch(`/api/supplement-plan/preferences/${key}`, { method: "PUT", token, body: { enabled } });
      await refresh();
    } catch {
      toast.error("No se pudo guardar la preferencia.");
    } finally {
      setActing((prev) => ({ ...prev, [key]: false }));
    }
  }

  const value = {
    recommendations,
    preferences,
    loading,
    acting,
    today,
    todayISO,
    logsByKey,
    refresh,
    markTaken,
    markSkipped,
    snooze,
    setPreferenceEnabled,
  };

  return <SupplementPlanContext.Provider value={value}>{children}</SupplementPlanContext.Provider>;
}

export function useSupplementPlan() {
  const ctx = useContext(SupplementPlanContext);
  if (!ctx) throw new Error("useSupplementPlan debe usarse dentro de <SupplementPlanProvider>");
  return ctx;
}
