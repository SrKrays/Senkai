import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { TrainingProvider } from "./context/TrainingContext";
import { TrackerProvider } from "./context/TrackerContext";
import { NutritionProvider } from "./context/NutritionContext";
import { SupplementationProvider } from "./context/SupplementationContext";
import { PointsProvider } from "./context/PointsContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tracker from "./pages/Tracker";
import Character from "./pages/Character";
import Training from "./pages/Training";
import Routines from "./pages/Routines";
import Nutrition from "./pages/Nutrition";
import Supplementation from "./pages/Supplementation";
import Groups from "./pages/Groups";
import Stats from "./pages/Stats";
import Personalization from "./pages/Personalization";
import AdminConfig from "./pages/AdminConfig";

export default function App() {
  return (
    <TrackerProvider>
      <TrainingProvider>
        <NutritionProvider>
          <SupplementationProvider>
            <PointsProvider>
              <HashRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tracker" element={<Tracker />} />
                    <Route path="/personaje" element={<Character />} />
                    <Route path="/entrenamiento" element={<Training />} />
                    <Route path="/rutinas" element={<Routines />} />
                    <Route path="/nutricion" element={<Nutrition />} />
                    <Route path="/suplementacion" element={<Supplementation />} />
                    <Route path="/grupos" element={<Groups />} />
                    <Route path="/objetivos" element={<Navigate to="/estadisticas" replace />} />
                    <Route path="/estadisticas" element={<Stats />} />
                    <Route path="/personalizacion" element={<Personalization />} />
                    <Route path="/admin" element={<AdminConfig />} />
                  </Route>
                </Routes>
              </HashRouter>
            </PointsProvider>
          </SupplementationProvider>
        </NutritionProvider>
      </TrainingProvider>
    </TrackerProvider>
  );
}
