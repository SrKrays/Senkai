import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { TrainingProvider } from "./context/TrainingContext";
import { TrackerProvider } from "./context/TrackerContext";
import { NutritionProvider } from "./context/NutritionContext";
import { SupplementationProvider } from "./context/SupplementationContext";
import { PointsProvider } from "./context/PointsContext";
import { CharacterProvider } from "./context/CharacterContext";
import { ProfileProvider } from "./context/ProfileContext";
import { RankProvider } from "./context/RankContext";
import { GroupProvider } from "./context/GroupContext";
import { TrainingGoalProvider } from "./context/TrainingGoalContext";
import { RoutineProvider } from "./context/RoutineContext";
import { WorkoutSessionProvider } from "./context/WorkoutSessionContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tracker from "./pages/Tracker";
import Character from "./pages/Character";
import Training from "./pages/Training";
import Routines from "./pages/Routines";
import WorkoutSession from "./pages/WorkoutSession";
import Nutrition from "./pages/Nutrition";
import Supplementation from "./pages/Supplementation";
import Groups from "./pages/Groups";
import Stats from "./pages/Stats";
import Personalization from "./pages/Personalization";

export default function App() {
  return (
    <AuthProvider>
      <TrackerProvider>
        <TrainingProvider>
          <NutritionProvider>
            <SupplementationProvider>
              <PointsProvider>
                <CharacterProvider>
                  <ProfileProvider>
                    <RankProvider>
                    <GroupProvider>
                    <TrainingGoalProvider>
                    <RoutineProvider>
                    <WorkoutSessionProvider>
                      <HashRouter>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                          element={
                            <ProtectedRoute>
                              <Layout />
                            </ProtectedRoute>
                          }
                        >
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/tracker" element={<Tracker />} />
                          <Route path="/personaje" element={<Character />} />
                          <Route path="/entrenamiento" element={<Training />} />
                          <Route path="/rutinas" element={<Routines />} />
                          <Route path="/rutinas/sesion/:id" element={<WorkoutSession />} />
                          <Route path="/nutricion" element={<Nutrition />} />
                          <Route path="/suplementacion" element={<Supplementation />} />
                          <Route path="/grupos" element={<Groups />} />
                          <Route path="/objetivos" element={<Navigate to="/estadisticas" replace />} />
                          <Route path="/estadisticas" element={<Stats />} />
                          <Route path="/personalizacion" element={<Personalization />} />
                        </Route>
                      </Routes>
                    </HashRouter>
                    </WorkoutSessionProvider>
                    <Toaster
                      theme="dark"
                      position="bottom-right"
                      toastOptions={{
                        style: {
                          background: "#0A0A0A",
                          border: "1px solid #1F1F1F",
                          color: "#F5F5F5",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "13px",
                        },
                      }}
                    />
                  </RoutineProvider>
                    </TrainingGoalProvider>
                    </GroupProvider>
                    </RankProvider>
                  </ProfileProvider>
                </CharacterProvider>
              </PointsProvider>
            </SupplementationProvider>
          </NutritionProvider>
        </TrainingProvider>
      </TrackerProvider>
    </AuthProvider>
  );
}
