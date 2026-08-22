import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const ProfileContext = createContext(null);

// Perfil básico (Fase 9) — altura, hora de dormir y peso corporal como
// registro con fecha. Es la base compartida que van a leer el rango por
// ejercicio y la evolución (Mecánica 1) y el objetivo de proteína / aviso de
// pre-entreno (Mecánica 3), por eso vive en su propio contexto y no colgado
// de Character/Training.
export function ProfileProvider({ children }) {
  const { token } = useAuth();
  const [heightCm, setHeightCm] = useState(null);
  const [bedTime, setBedTime] = useState(null);
  const [proteinTarget, setProteinTarget] = useState(null);
  const [weightLog, setWeightLog] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!token) {
      setHeightCm(null);
      setBedTime(null);
      setProteinTarget(null);
      setWeightLog([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/profile/mine", { token });
      applyDto(res);
    } catch {
      // Silencioso a propósito — igual que Character, si falla el resto de
      // la app sigue funcionando con perfil vacío.
    } finally {
      setLoading(false);
    }
  }

  function applyDto(res) {
    setHeightCm(res.heightCm);
    setBedTime(res.bedTime);
    setProteinTarget(res.proteinTarget);
    setWeightLog(res.weightLog);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function updateProfile({ heightCm: h, bedTime: b, proteinTarget: p }) {
    const res = await apiFetch("/api/profile/mine", {
      method: "PUT",
      token,
      body: { heightCm: h, bedTime: b, proteinTarget: p },
    });
    applyDto(res);
  }

  async function logWeight(date, weightKg) {
    const res = await apiFetch("/api/profile/weight", {
      method: "POST",
      token,
      body: { date, weightKg },
    });
    applyDto(res);
  }

  async function deleteWeight(id) {
    const res = await apiFetch(`/api/profile/weight/${id}`, { method: "DELETE", token });
    applyDto(res);
  }

  const latestWeightKg = weightLog.length > 0 ? weightLog[weightLog.length - 1].weightKg : null;

  const value = {
    heightCm,
    bedTime,
    proteinTarget,
    weightLog,
    latestWeightKg,
    loading,
    updateProfile,
    logWeight,
    deleteWeight,
    refresh,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile debe usarse dentro de <ProfileProvider>");
  return ctx;
}
