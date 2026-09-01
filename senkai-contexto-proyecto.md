# Senkai — Contexto del proyecto

> Documento pensado para pegar como prompt de contexto en una charla nueva (con Claude, GPT u otra IA) y que entienda de una el proyecto entero sin tener que reexplicarlo. Actualizalo a medida que el proyecto cambie.

## La idea

Senkai es una app de entrenamiento, nutrición y hábitos gamificada con temática Dragon Ball. La idea central: en vez de trackear números fríos (kg, calorías, rachas), todo ese progreso real alimenta la evolución visual de un personaje (arranca como Goku/Vegeta base y va subiendo de forma/etapa a medida que sube el "Power Level"). El objetivo declarado del dueño del proyecto es que usar la app se sienta como progresar un personaje, no como llenar una planilla.

Módulos principales (cada uno con su propia sección en el nav):
- **Dashboard** — entrada a todo: personaje actual, Power Level, mejores ejercicios, resumen del grupo.
- **Tracker de Hábitos** — check-ins diarios (ej. hábito "gym"), racha, calendario mensual.
- **Entrenamiento** — carga de marcas de progreso por ejercicio (peso/reps), catálogo de ejercicios (autocompletado contra WorkoutX), rango por ejercicio, comparativa grupal, panel de evolución de Vegeta.
- **Rutinas** — rutinas reales con sets (`Routine → WorkoutSet → ProgressMark`), calendario semanal interactivo, motor de sesión guiada, check-in automático de entreno del día, historial/insights.
- **Nutrición** — registro de comidas (autocompletado contra USDA FoodData Central), panel de Goku comiendo según comidas cargadas hoy.
- **Suplementación** — motor reactivo de suplementos (reglas + contexto del usuario), calendario mensual, racha real, analytics.
- **Grupos** — grupos sociales con código de invitación, ranking, objetivos grupales con imagen, "Gran Premio", detección automática de aporte a objetivo grupal al cargar una marca.
- **Objetivos y Estadísticas** — objetivos individuales y grupales unificados, con progreso calculado server-side.
- **Personaje / Personalización** — el usuario puede definir/editar sus propias etapas de personaje (custom o Vegeta/Goku default), ligadas al Power Level.

**Power Level**: sistema de puntos calculado 100% server-side (motor `PointsEngine`, 4 fórmulas) a partir de todo lo anterior (hábitos, entrenamiento, nutrición, suplementación) — no es un cálculo del front, así que es imposible de falsear desde el cliente.

## Stack técnico

**Frontend** (`C:\Users\Usuario\gym`, deploy en Vercel):
- React 19 + Vite 8 + React Router 7
- Tailwind CSS 3 (paleta clara: paper/cream/maroon/teal, estética "HUD" tipo anime/gaming)
- Framer Motion 12 — transiciones de página, stagger de listas, overlays (level-up, rank tier-up)
- GSAP 3.15 (agregado en esta última etapa) — animaciones "de verdad": SVG line-draw, floats infinitos, crossfade de frames
- embla-carousel-react 8.6 — calendario semanal de Rutinas (swipe táctil)
- react-easy-crop 6.2 — recorte de imagen al subir foto de objetivo grupal
- canvas-confetti 1.9 + sonner 1.7 — celebraciones (PR, objetivo cumplido, reto grupal) y toasts temados
- lucide-react — íconos
- vite-plugin-pwa 1.3 — PWA instalable (manifest + service worker, `registerType: autoUpdate`)
- Capacitor 8 (`@capacitor/core`, `@capacitor/android`) — empaqueta la PWA como app Android. Clave: `capacitor.config.json` usa `server.url` apuntando al deploy vivo de Vercel, **no** al `dist/` embebido — o sea que un cambio de UI/web no necesita rebuild de la app Android, solo build+deploy del front y reabrir la app instalada.

**Backend** (`D:\Proyectos prog\Senkai\Senkai.Api`, deploy en Render vía Docker):
- .NET 10 / ASP.NET Core Web API
- Entity Framework Core 10 + Npgsql (proveedor Postgres)
- Postgres hosteado en **Clever Cloud** (no en Render)
- Auth JWT propio (`Microsoft.AspNetCore.Authentication.JwtBearer` + `BCrypt.Net-Next` para hash de contraseñas)
- Swashbuckle (Swagger) para probar la API a mano
- CORS con allowlist por `Cors:AllowedOrigins` (via env vars `Cors__AllowedOrigins__N` en Render)
- APIs externas integradas vía proxy propio (`ExternalController`): **WorkoutX** (catálogo de ejercicios) y **USDA FoodData Central** (calorías de comidas)

**Infraestructura / deploy**:
- Frontend → Vercel (auto-deploy en cada push a `main`)
- Backend → Render, build con Dockerfile (`mcr.microsoft.com/dotnet/sdk:10.0` → `mcr.microsoft.com/dotnet/aspnet:10.0`), auto-deploy en cada push a GitHub (`SrKrays/Senkai-Api`)
- Base de datos → Clever Cloud Postgres (plan con límite bajo de conexiones concurrentes — hay que vigilar el pool de Npgsql, ver "Incidentes" abajo)
- App Android → generada con Android Studio a partir de Capacitor, pero apuntando al deploy vivo (ver nota de Capacitor arriba)

## Historia y estado del diseño visual

1. Arrancó con un tema oscuro neón tipo HUD gaming — se revirtió a la paleta clara actual (paper/cream + maroon + teal) por decisión del dueño.
2. Rebrand de "Kray Sekai" a **Senkai** en toda la app.
3. Pasada grande de auditoría mobile/responsive antes del lanzamiento alpha: fix de overflow horizontal (bug clásico de `min-width: auto` en grid/flex, resuelto con una regla global defensiva `.grid > *, .flex > * { min-width: 0 }`), simplificación de densidad con acordeones colapsables (Stats, Suplementación, Rutinas), rediseño del bottom nav mobile (5 secciones primarias + "Más", íconos grandes en vez de números en mono chico), calendario semanal de Rutinas rehecho con embla-carousel.
4. **"Gran actualización visual"** (en curso): mantener la temática Dragon Ball pero darle más peso visual e impacto, y simplificar lo que se ve en pantalla. Ideas implementadas hasta ahora:
   - `DragonBallSvg`: esfera del dragón dibujada a mano en SVG, animada con GSAP (se dibuja sola con strokeDasharray/strokeDashoffset, después flota en loop infinito). Vive en el header sticky (visible en toda la app), no en el Dashboard.
   - `CharacterFlipbook`: componente de animación frame-por-frame real (GSAP crossfade) usando las secuencias de imágenes reales que ya existían — Goku comiendo (`public/nutrition/goku-0..5.png`, ligado a comidas cargadas hoy) y Vegeta entrenando (`public/routines/vegeta_frame_1..6.png`, ligado a días entrenados en la semana). Reemplaza el `CharacterArt` estático en los paneles "Goku de hoy" (Nutrición) y "Vegeta de la semana" (Rutinas).
   - `CharacterArt` (componente compartido, usado en Dashboard/Suplementación/Stats/Personaje, etc.): ganó una animación de "respiración" sutil (float + scale en loop) vía Framer Motion.
   - Fondo temático de Kame House en Entrenamiento (`public/fondo/kame.jpg`) — pendiente de una imagen fuente en formato horizontal (la actual es un scan vertical con borde negro, no encaja bien con `background-size: cover` en pantallas anchas).
   - Referencia de estilo tomada de vin-path.vercel.app (stack real: React 19 + Framer Motion + GSAP + .NET/C# + MySQL) — el recurso puntual copiado es un ícono SVG grande de muy baja opacidad de fondo (ahí es la "daga de Thorfinn"; acá la Esfera del Dragón).
   - Pendiente: llevar este mismo lenguaje visual (fondos por sección, animaciones GSAP) al resto de las páginas que todavía no lo tienen — Grupos, Suplementación, Estadísticas/Objetivos, Tracker, Personaje, Personalización.

## Incidentes / aprendizajes recientes de infraestructura

- **CORS en dev**: para poder hacer live-reload en el celular contra el backend real hubo que sumar los orígenes de dev (`http://localhost:5173`, IP LAN) a `Cors__AllowedOrigins__N` en Render. Ojo con barras finales en la URL — no matchean el header `Origin` del browser.
- **"Too many connections" en Postgres (Clever Cloud)**: el deploy del back murió con `53300: too many connections for role`. Causa: `UseNpgsql(connectionString)` no tiene un `Maximum Pool Size` explícito, así que Npgsql puede abrir hasta 100 conexiones por instancia — con el plan de Clever Cloud (tope bajo) alcanza con 2-3 usuarios reales en simultáneo (cada uno con varios requests concurrentes, ej. el Dashboard pegándole a 4-5 endpoints a la vez) para saturarlo. Se resolvió una vez borrando las conexiones colgadas desde Clever Cloud. **Pendiente real**: limitar el pool agregando `Maximum Pool Size=N` a la connection string (`ConnectionStrings__Default` en Render) para que esto no vuelva a pasar con uso real.
- El mensaje `libgssapi_krb5.so.2 cannot open shared object file` que aparece en los logs de Render es ruido inofensivo de Npgsql intentando negociar GSS/Kerberos — no es la causa de ningún crash.

## Estado del lanzamiento

- **0.2 Lanzamiento de la alpha** — deploy del backend en Render exitoso (Sep 1 2026), fix de conexiones aplicado.
- Frontend al día en Vercel, Capacitor apuntando al deploy vivo.
- Trabajo activo: continuar la "gran actualización visual" página por página, y conseguir una imagen horizontal nueva para el fondo de Kame House.

## Convenciones de trabajo con el asistente

- El dueño del proyecto prefiere **hablar el approach antes de que se escriba código**, sobre todo en cambios de diseño grandes.
- Todo el trabajo de UI se piensa **mobile-first** (la app se usa principalmente instalada en Android vía Capacitor).
- Comentarios de código en español, explicando el *por qué* de una decisión (no solo el qué).
