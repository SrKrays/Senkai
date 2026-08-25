import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PowerReader from "./PowerReader";
import LevelUpOverlay from "./LevelUpOverlay";
import RankTierUpOverlay from "./RankTierUpOverlay";
import CharacterOnboarding from "./CharacterOnboarding";
import Logo, { LogoBadge } from "./Logo";
import { usePoints } from "../context/PointsContext";
import { useAuth } from "../context/AuthContext";

// `primary: true` = vive siempre visible en el nav de abajo en mobile (las
// 5 secciones de uso diario). El resto queda detrás del botón "Más" — un
// usuario nuevo no necesita ver las 10 de una para poder usar la app. El
// sidebar de escritorio sigue mostrando las 10 igual, ahí no hace falta
// esconder nada (hay lugar de sobra).
// `icon` solo se usa en el nav de abajo en mobile — ahí no entra un label
// largo con claridad en un espacio chico, un ícono + palabra corta se lee
// más rápido sin tener que tocar para enterarte qué es cada sección.
const nav = [
  { to: "/", label: "Dashboard", short: "Inicio", icon: "🏠", num: "00", primary: true },
  { to: "/tracker", label: "Tracker de Hábitos", short: "Hábitos", icon: "✅", num: "01" },
  { to: "/personaje", label: "Personaje", short: "Personaje", icon: "🧬", num: "02" },
  { to: "/entrenamiento", label: "Entrenamiento", short: "Entreno", icon: "🏋️", num: "03", primary: true },
  { to: "/rutinas", label: "Rutinas", short: "Rutinas", icon: "🗓️", num: "04", primary: true },
  { to: "/nutricion", label: "Nutrición", short: "Nutrición", icon: "🍽️", num: "05", primary: true },
  { to: "/suplementacion", label: "Suplementación", short: "Suplem.", icon: "💊", num: "06", primary: true },
  { to: "/grupos", label: "Grupos", short: "Grupos", icon: "👥", num: "07" },
  { to: "/estadisticas", label: "Objetivos y Estadísticas", short: "Objetivos", icon: "📊", num: "08" },
  { to: "/personalizacion", label: "User", short: "Perfil", icon: "⚙️", num: "09" },
];

export default function Layout() {
  const { powerLevel } = usePoints();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const visibleNav = nav.filter((item) => !item.adminOnly || user?.role === "Admin");
  const primaryNav = visibleNav.filter((item) => item.primary);
  const secondaryNav = visibleNav.filter((item) => !item.primary);
  const [moreOpen, setMoreOpen] = useState(false);

  // Cierra el panel "Más" solo al navegar a otra sección — evita que quede
  // abierto tapando la pantalla nueva.
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <LevelUpOverlay />
      <RankTierUpOverlay />
      <CharacterOnboarding />
      <div className="flex w-full">
        {/* Sidebar — desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-cream md:flex">
          <div className="flex items-center border-b border-line px-6 py-6">
            <Logo badgeSize={38} />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-sm border px-3 py-2.5 text-sm transition-all duration-250 ${
                    isActive
                      ? "border-maroon bg-maroon/[0.12] text-ink shadow-glow-sm"
                      : "border-transparent text-ink/60 hover:border-maroon/25 hover:bg-maroon/5 hover:text-ink"
                  }`
                }
              >
                <span className="font-mono text-[10px] opacity-60">{item.num}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 border-t border-line px-4 py-4">
            <span className="hud flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-maroon/50 bg-maroon/10 font-display text-base text-maroon shadow-glow">
              {user?.name?.charAt(0) ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-0.5">Sesión</p>
              <p className="truncate text-sm font-semibold text-maroon">{user?.name}</p>
              <p className="font-mono text-[10px] text-muted uppercase">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="shrink-0 text-muted hover:text-maroon"
            >
              ⏻
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          {/* pt con env(safe-area-inset-top): en la PWA instalada en iPhone
              (modo standalone, sin la barra de Safari) el notch/Dynamic
              Island se come el contenido si no se reserva ese espacio. */}
          <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-paper/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:gap-4 md:px-8">
            <div className="flex shrink-0 items-center gap-1.5 md:hidden">
              <LogoBadge badgeSize={26} />
              <span className="font-display text-lg tracking-widest2 text-maroon-light">SENKAI</span>
            </div>
            <p className="hidden text-sm text-muted md:block">
              Hola, <span className="font-semibold text-maroon">{user?.name}</span> — a subir de nivel hoy también.
            </p>
            <PowerReader value={powerLevel} size="sm" />
          </header>

          <main className="flex-1 px-5 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:py-10 md:pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom nav — mobile: 5 secciones de uso diario + "Más". Íconos
              grandes + palabra corta en vez de "01/02/03" en mono chiquito —
              eso obligaba a tocar para enterarte qué era cada botón. Tap
              target de altura completa (todo el <NavLink> es clickeable, no
              solo el ícono) para que entrar a la primera sea fácil. pb con
              env(safe-area-inset-bottom): en la PWA instalada en iPhone, esa
              franja de abajo es el home indicator — sin este padding el nav
              queda pegado y a veces tapado por él. */}
          <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-medium transition-colors duration-150 ${
                    isActive ? "text-teal" : "text-ink/50 active:text-ink/80"
                  }`
                }
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="whitespace-nowrap">{item.short}</span>
              </NavLink>
            ))}
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="Más secciones"
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-medium transition-colors duration-150 ${
                secondaryNav.some((item) => location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to)))
                  ? "text-teal"
                  : "text-ink/50 active:text-ink/80"
              }`}
            >
              <span className="text-xl leading-none">☰</span>
              <span className="whitespace-nowrap">Más</span>
            </button>
          </nav>

          {/* Panel "Más" — el resto de las secciones (Tracker, Personaje,
              Grupos, Objetivos, User), fuera del nav principal para que un
              usuario nuevo no vea las 10 de una. */}
          <AnimatePresence>
            {moreOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMoreOpen(false)}
                  className="fixed inset-0 z-20 bg-paper/80 backdrop-blur-sm md:hidden"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="hud fixed inset-x-0 bottom-0 z-30 rounded-t-lg border border-b-0 border-line bg-cream pb-[env(safe-area-inset-bottom)] md:hidden"
                >
                  <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <p className="eyebrow">Más secciones</p>
                    <button onClick={() => setMoreOpen(false)} aria-label="Cerrar" className="text-muted hover:text-maroon">
                      ✕
                    </button>
                  </div>
                  <div className="px-3 py-2">
                    {secondaryNav.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                          `mb-1 flex items-center gap-3 rounded-sm border px-3 py-3 text-sm ${
                            isActive
                              ? "border-maroon bg-maroon/[0.12] text-ink"
                              : "border-transparent text-ink/70 hover:bg-maroon/5"
                          }`
                        }
                      >
                        <span className="text-lg leading-none">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </NavLink>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-sm border border-transparent px-3 py-3 text-left text-sm text-ink/70 hover:bg-maroon/5"
                    >
                      <span className="text-lg leading-none">⏻</span>
                      <span className="font-medium">Cerrar sesión</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
