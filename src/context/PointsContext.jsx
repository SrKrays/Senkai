import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useTracker } from "./TrackerContext";
import { useTraining } from "./TrainingContext";
import { useNutrition } from "./NutritionContext";
import { useSupplementation } from "./SupplementationContext";
import { useAuth } from "./AuthContext";
import { apiFetch } from "../utils/apiClient";
import { getVegetaStage } from "../utils/evolution";
import { vegetaEvolution } from "../data/mockData";

const PointsContext = createContext(null);

const EMPTY_SUMMARY = { gymPoints: 0, suplementoPoints: 0, alimentacionPoints: 0, trackerPoints: 0, powerLevel: 0 };

// Punto único de verdad del "Power Level" — antes se calculaba acá mismo, en
// el cliente, a partir de los datos crudos (utils/points.js). Ahora ese
// cálculo vive en el backend (PointsEngine + tabla PointsBalance) y este
// context solo pide el resumen ya hecho. Se vuelve a pedir cada vez que
// cambia algo que podría afectar los puntos — el backend ya recalculó su
// lado en el mismo request que disparó el cambio (toggleCheck, addProgress,
// etc.), así que para cuando este efecto corre, el número ya está listo.
export function PointsProvider({ children }) {
  const { token } = useAuth();
  const { habits, notes } = useTracker();
  const { progressLog } = useTraining();
  const { mealLogsByDate, mealSlots } = useNutrition();
  const { supplements } = useSupplementation();

  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  useEffect(() => {
    if (!token) {
      setSummary(EMPTY_SUMMARY);
      return;
    }
    let cancelled = false;
    apiFetch("/api/points/summary", { token })
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch(() => {
        // Silencioso a propósito — cada context de origen ya avisa con su
        // propio toast si su fetch/mutación falla; no hace falta duplicar.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, habits, notes, progressLog, mealLogsByDate, mealSlots, supplements]);

  const { gymPoints, suplementoPoints, alimentacionPoints, trackerPoints, powerLevel } = summary;

  // Detección de "Level Up" — cuando el Power Level cruza el umbral de la
  // siguiente etapa, disparamos el overlay a nivel app (montado en Layout).
  // Los umbrales son fijos e iguales para todos (ver vegetaEvolution), así
  // que esta detección no necesita saber nada del personaje custom del
  // usuario — eso lo resuelve CharacterContext al momento de RENDERIZAR el
  // overlay, acá solo guardamos en qué nivel (índice) quedó. Se guarda el
  // nivel anterior en un ref para no disparar nada en el primer render
  // (carga inicial no es un "logro").
  const { current: stage } = getVegetaStage(powerLevel, vegetaEvolution);
  const prevLevelRef = useRef(null);
  const [levelUpLevel, setLevelUpLevel] = useState(null);

  useEffect(() => {
    if (prevLevelRef.current === null) {
      prevLevelRef.current = stage.level;
      return;
    }
    if (stage.level > prevLevelRef.current) {
      setLevelUpLevel(stage.level);
    }
    prevLevelRef.current = stage.level;
  }, [stage.level]);

  function clearLevelUp() {
    setLevelUpLevel(null);
  }

  const value = {
    gymPoints,
    suplementoPoints,
    alimentacionPoints,
    trackerPoints,
    powerLevel,
    levelUpLevel,
    clearLevelUp,
  };

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>;
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints debe usarse dentro de <PointsProvider>");
  return ctx;
}
