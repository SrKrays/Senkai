import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const RankContext = createContext(null);

// Rango por ejercicio (Fase 9, Mecánica 1) — paralelo a Power Level, no lo
// reemplaza. `catalog` son los 14 ejercicios curados, `mine` es tu rango en
// cada uno (null en los que todavía no cargaste marca), y `groupRankFor`
// trae la comparativa de tu grupo para un ejercicio puntual, on-demand
// (no tiene sentido pedir los 14 de una si el usuario solo va a mirar uno o dos).
export function RankProvider({ children }) {
  const { token } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupCache, setGroupCache] = useState({});
  const [growth, setGrowthState] = useState(null);
  const [groupGrowth, setGroupGrowth] = useState(null);

  async function refresh() {
    if (!token) {
      setCatalog([]);
      setMine([]);
      setGrowthState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [catalogRes, mineRes, growthRes] = await Promise.all([
        apiFetch("/api/ranks/catalog", { token }),
        apiFetch("/api/ranks/mine", { token }),
        apiFetch("/api/ranks/growth", { token }),
      ]);
      setCatalog(catalogRes);
      setMine(mineRes);
      setGrowthState(growthRes);
    } catch {
      // Silencioso — igual patrón que Character/Profile.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchGroupRank(slug) {
    const res = await apiFetch(`/api/ranks/group/${slug}`, { token });
    setGroupCache((prev) => ({ ...prev, [slug]: res }));
    return res;
  }

  // "Ritmo de mejora" (Fase 9) — ventana de 30 días en base al mes, elegible:
  // pasar null vuelve al default (1° del mes actual), pasar una fecha "yyyy-MM-dd"
  // la arranca desde ahí hasta hoy (ej: te anotás a mitad de mes).
  async function setGrowthWindow(startDate) {
    const res = await apiFetch("/api/ranks/growth/window", { method: "PUT", token, body: { start: startDate } });
    setGrowthState(res);
    return res;
  }

  async function fetchGroupGrowth() {
    const res = await apiFetch("/api/ranks/growth/group", { token });
    setGroupGrowth(res);
    return res;
  }

  const byMuscle = mine.reduce((acc, r) => {
    (acc[r.muscleGroup] ||= []).push(r);
    return acc;
  }, {});

  const value = {
    catalog,
    mine,
    byMuscle,
    loading,
    groupCache,
    fetchGroupRank,
    growth,
    setGrowthWindow,
    groupGrowth,
    fetchGroupGrowth,
    refresh,
  };

  return <RankContext.Provider value={value}>{children}</RankContext.Provider>;
}

export function useRank() {
  const ctx = useContext(RankContext);
  if (!ctx) throw new Error("useRank debe usarse dentro de <RankProvider>");
  return ctx;
}
