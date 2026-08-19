import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import { useAuth } from "./AuthContext";
import { usePoints } from "./PointsContext";
import { vegetaEvolution } from "../data/mockData";
import { getVegetaStage } from "../utils/evolution";

const CharacterContext = createContext(null);

const ONBOARDING_DISMISS_KEY = "senkai_onboarding_dismissed";

// El personaje propio del usuario — Vegeta es la base por defecto, pero
// cada uno puede resubir nombre + imagen/gif por cada una de las 7 etapas
// (mismos umbrales de Power Level para todos, ver AskUserQuestion de esta
// fase). Si una etapa no fue personalizada, se resuelve con el arte de
// Vegeta de ese mismo nivel — así nunca hay un hueco visual.
export function CharacterProvider({ children }) {
  const { token, user } = useAuth();
  const { powerLevel } = usePoints();

  const [themeName, setThemeName] = useState("Dragon Ball");
  const [configured, setConfigured] = useState(false);
  const [rawStages, setRawStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  async function refresh() {
    if (!token) {
      setThemeName("Dragon Ball");
      setConfigured(false);
      setRawStages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/character/mine", { token });
      setThemeName(res.themeName);
      setConfigured(res.configured);
      setRawStages(res.stages);
    } catch {
      // Silencioso a propósito — si falla, el front igual cae a los defaults de Vegeta.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setDismissed(localStorage.getItem(`${ONBOARDING_DISMISS_KEY}_${user.id}`) === "1");
  }, [user]);

  function dismissOnboarding() {
    if (user) localStorage.setItem(`${ONBOARDING_DISMISS_KEY}_${user.id}`, "1");
    setDismissed(true);
  }

  // Las 7 etapas de Vegeta, con el nombre/imagen pisados por lo que el
  // usuario haya personalizado en cada nivel.
  const stages = vegetaEvolution.map((defaultStage) => {
    const custom = rawStages.find((s) => s.level === defaultStage.level);
    if (!custom) return { ...defaultStage, custom: false };
    return {
      ...defaultStage,
      name: custom.name || defaultStage.name,
      img: custom.imageDataUrl || defaultStage.img,
      custom: true,
    };
  });

  const { current, next, progress } = getVegetaStage(powerLevel, stages);

  async function updateTheme(name) {
    const res = await apiFetch("/api/character/theme", { method: "PUT", token, body: { themeName: name } });
    setThemeName(res.themeName);
    setConfigured(res.configured);
    setRawStages(res.stages);
  }

  async function updateStage(level, { name, imageDataUrl }) {
    const res = await apiFetch(`/api/character/stages/${level}`, {
      method: "PUT",
      token,
      body: { name, imageDataUrl },
    });
    setThemeName(res.themeName);
    setConfigured(res.configured);
    setRawStages(res.stages);
  }

  async function removeStage(level) {
    const res = await apiFetch(`/api/character/stages/${level}`, { method: "DELETE", token });
    setThemeName(res.themeName);
    setConfigured(res.configured);
    setRawStages(res.stages);
  }

  const needsOnboarding = !loading && !!user && !configured && !dismissed;

  const value = {
    themeName,
    configured,
    stages,
    current,
    next,
    progress,
    loading,
    needsOnboarding,
    dismissOnboarding,
    updateTheme,
    updateStage,
    removeStage,
    refresh,
  };

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

export function useCharacter() {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error("useCharacter debe usarse dentro de <CharacterProvider>");
  return ctx;
}
