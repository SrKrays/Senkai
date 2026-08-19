# Senkai — Fase 0: Esqueleto Visual

Prototipo navegable completo de la app de gym personal (Dragon Ball edition).
**No hay backend ni persistencia**: todos los datos vienen de `src/data/mockData.js`.
El objetivo de esta fase es tener el mapa completo de pantallas y la dirección
visual definida antes de construir la funcionalidad real (Fase 1: MVP).

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí el link que te muestra la terminal (por defecto `http://localhost:5173`).

## Cómo compilarlo (build de producción)

```bash
npm run build
npm run preview
```

## Estructura

```
src/
  components/
    Layout.jsx        -> navegacion lateral (desktop) / inferior (mobile)
    PowerReader.jsx    -> elemento de firma: lector de poder estilo scouter
    ui.jsx             -> piezas reutilizables (Card, ProgressBar, Tag, etc.)
  data/
    mockData.js        -> TODOS los datos de muestra, centralizados aca
  pages/
    Login.jsx
    Dashboard.jsx
    Character.jsx       -> evolucion del personaje
    Training.jsx         -> registro de progreso por ejercicio
    Routines.jsx          -> biblioteca de rutinas
    Nutrition.jsx
    Supplementation.jsx    -> rachas de proteina/creatina/pre-entreno/monster
    Groups.jsx               -> grupos + carrera hacia meta
    Goals.jsx                  -> objetivos individuales y grupales
    Stats.jsx                    -> panel general
    Personalization.jsx           -> cambio de tematica/personaje
    AdminConfig.jsx                 -> configuracion base (solo admin)
  App.jsx              -> rutas
```

## Direccion de diseno

- **Paleta:** blanco dominante + negro (`ink`), con un unico acento naranja "ki"
  (`#FF4D14`) reservado para lo que importa: poder, progreso, llamadas a la accion.
- **Tipografia:** `Bebas Neue` (display, condensada, tipo cartel de pelea) +
  `Inter` (texto) + `IBM Plex Mono` (numeros y datos, estilo lectura de scouter).
- **Motivo de firma:** el componente `PowerReader` -- un lector de poder con
  brackets tipo HUD/scouter y animacion de count-up -- se repite en tamano
  grande (hero) y chico (barra superior) para atar visualmente toda la app.
- **Reglas visuales:** sin bordes redondeados, lineas finas, corners tipo HUD
  (clase `.hud` en `index.css`) -- evoca un visor/escaner, no un dashboard generico.

## Proximo paso (Fase 1 - MVP)

Conectar backend real (.NET + EF Core + SQL) y reemplazar `mockData.js` pantalla
por pantalla, empezando por: login real, registro de ejercicios/progreso, y la
escala de poder calculando la etapa del personaje en base a datos reales.
