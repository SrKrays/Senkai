import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PowerReader from "./PowerReader";
import LevelUpOverlay from "./LevelUpOverlay";
import RankTierUpOverlay from "./RankTierUpOverlay";
import CharacterOnboarding from "./CharacterOnboarding";
import Logo, { LogoBadge } from "./Logo";
import { usePoints } from "../context/PointsContext";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/", label: "Dashboard", num: "00" },
  { to: "/tracker", label: "Tracker de Hábitos", num: "01" },
  { to: "/personaje", label: "Personaje", num: "02" },
  { to: "/entrenamiento", label: "Entrenamiento", num: "03" },
  { to: "/rutinas", label: "Rutinas", num: "04" },
  { to: "/nutricion", label: "Nutrición", num: "05" },
  { to: "/suplementacion", label: "Suplementación", num: "06" },
  { to: "/grupos", label: "Grupos", num: "07" },
  { to: "/estadisticas", label: "Objetivos y Estadísticas", num: "08" },
  { to: "/personalizacion", label: "User", num: "09" },
];

export default function Layout() {
  const { powerLevel } = usePoints();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const visibleNav = nav.filter((item) => !item.adminOnly || user?.role === "Admin");
  const bottomNavRef = useRef(null);

  // Con 10 secciones, el nav de abajo (mobile) scrollea horizontal — sin esto
  // el ítem activo puede quedar fuera de la parte visible al navegar directo
  // (ej: por un link interno), obligando a buscarlo a mano.
  useEffect(() => {
    const active = bottomNavRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
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
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper/95 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:px-8">
            <div className="flex items-center gap-2 md:hidden">
              <LogoBadge badgeSize={28} />
              <span className="font-display text-xl tracking-widest2 text-maroon-light">SENKAI</span>
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

          {/* Bottom nav — mobile. pb con env(safe-area-inset-bottom): en la PWA
              instalada en iPhone, esa franja de abajo es el home indicator —
              sin este padding el nav queda pegado y a veces tapado por él. */}
          <nav
            ref={bottomNavRef}
            className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          >
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex min-w-[76px] flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                    isActive ? "text-teal" : "text-ink/50"
                  }`
                }
              >
                <span className="font-mono text-[9px]">{item.num}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
