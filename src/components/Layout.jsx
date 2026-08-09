import { NavLink, Outlet } from "react-router-dom";
import PowerReader from "./PowerReader";
import { usePoints } from "../context/PointsContext";
import { user } from "../data/mockData";

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
  { to: "/personalizacion", label: "Personalización", num: "09" },
  { to: "/admin", label: "Config. Admin", num: "10" },
];

export default function Layout() {
  const { powerLevel } = usePoints();

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <div className="flex w-full">
        {/* Sidebar — desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-cream md:flex">
          <div className="flex items-center gap-3 border-b border-line px-6 py-6">
            <span className="hud flex h-9 w-9 shrink-0 items-center justify-center border border-maroon/40 bg-maroon/10 font-display text-lg text-maroon shadow-glow">
              K
            </span>
            <div>
              <span className="block font-display text-2xl leading-none tracking-widest2 text-maroon">
                KRAY SEKAI
              </span>
              <span className="block font-mono text-[9px] tracking-widest2 text-muted">カイの道</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {nav.map((item) => (
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
              {user.name.charAt(0)}
            </span>
            <div>
              <p className="eyebrow mb-0.5">Sesión</p>
              <p className="text-sm font-semibold text-maroon">{user.name}</p>
              <p className="font-mono text-[10px] text-muted uppercase">{user.role}</p>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur md:px-8">
            <div className="md:hidden flex items-center gap-2">
              <span className="hud flex h-7 w-7 items-center justify-center border border-maroon/40 bg-maroon/10 font-display text-sm text-maroon shadow-glow">
                K
              </span>
              <span className="font-display text-xl tracking-widest2 text-maroon">KRAY SEKAI</span>
            </div>
            <p className="hidden text-sm text-muted md:block">
              Hola, <span className="font-semibold text-maroon">{user.name}</span> — a subir de nivel hoy también.
            </p>
            <PowerReader value={powerLevel} size="sm" />
          </header>

          <main className="flex-1 px-5 py-8 pb-24 md:px-10 md:py-10 md:pb-10">
            <Outlet />
          </main>

          {/* Bottom nav — mobile */}
          <nav className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-line bg-paper/95 backdrop-blur md:hidden">
            {nav.map((item) => (
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
