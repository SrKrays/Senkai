import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";

const GroupContext = createContext(null);

// El grupo del usuario, con cada integrante ya resumido por el backend
// (Power Level real, PRs clave, los 3 porcentajes, delta semanal, última
// actividad) — Fase 6 reemplaza el mock fijo de Nacho/Mateo/Mono/Carlo.
export function GroupProvider({ children }) {
  const { token } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notInGroup, setNotInGroup] = useState(false);

  async function refresh() {
    if (!token) {
      setGroup(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/groups/mine", { token });
      setGroup(res);
      setNotInGroup(false);
    } catch (err) {
      setGroup(null);
      setNotInGroup(err?.status === 404);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function createGoal({ exercise, exerciseLabel, prize, targetKg, prizeImageDataUrl }) {
    if (!group) return;
    const updated = await apiFetch(`/api/groups/${group.id}/goal`, {
      method: "PUT",
      token,
      body: { exercise, exerciseLabel, prize, targetKg, prizeImageDataUrl },
    });
    setGroup((prev) => (prev ? { ...prev, goal: updated } : prev));
  }

  // Crea un grupo nuevo (te saca de cualquier grupo anterior) y te deja como
  // único integrante, con un código de invitación fresco para compartir.
  async function createGroup(name) {
    const created = await apiFetch("/api/groups", { method: "POST", token, body: { name } });
    setGroup(created);
    setNotInGroup(false);
    return created;
  }

  // Sumarse a un grupo existente con su código corto — si ya estabas en otro
  // grupo, este reemplaza esa membresía (un usuario, un grupo a la vez).
  async function joinGroup(code) {
    const joined = await apiFetch("/api/groups/join", { method: "POST", token, body: { code } });
    setGroup(joined);
    setNotInGroup(false);
    return joined;
  }

  const value = { group, loading, notInGroup, refresh, createGoal, createGroup, joinGroup };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup debe usarse dentro de <GroupProvider>");
  return ctx;
}
