import { createContext, useContext, useMemo } from "react";
import { useTracker } from "./TrackerContext";
import { useTraining } from "./TrainingContext";
import { useNutrition } from "./NutritionContext";
import { useSupplementation } from "./SupplementationContext";
import { trainingPoints, supplementPoints, nutritionPoints, trackerPoints } from "../utils/points";

const PointsContext = createContext(null);

// Punto único de verdad del "Power Level" — junta lo calculado en las otras
// 4 secciones (Entrenamiento, Suplementación, Nutrición, Tracker) en un solo
// número acumulado que mueve la evolución de Vegeta en toda la web.
export function PointsProvider({ children }) {
  const { habits, notes } = useTracker();
  const { progressLog } = useTraining();
  const { mealLogsByDate, mealSlots } = useNutrition();
  const { supplements } = useSupplementation();

  const gymPoints = useMemo(() => trainingPoints(progressLog), [progressLog]);
  const suplementoPoints = useMemo(() => supplementPoints(supplements), [supplements]);
  const alimentacionPoints = useMemo(() => nutritionPoints(mealLogsByDate, mealSlots), [mealLogsByDate, mealSlots]);
  const trackerPts = useMemo(() => trackerPoints(habits, notes), [habits, notes]);

  const powerLevel = gymPoints + suplementoPoints + alimentacionPoints + trackerPts;

  const value = {
    gymPoints,
    suplementoPoints,
    alimentacionPoints,
    trackerPoints: trackerPts,
    powerLevel,
  };

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>;
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints debe usarse dentro de <PointsProvider>");
  return ctx;
}
