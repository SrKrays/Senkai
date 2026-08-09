// Datos de muestra — Fase 0 (esqueleto visual). Nada de esto persiste ni es real.

export const user = {
  name: "Ronnie",
  role: "admin",
  characterTheme: "Dragon Ball",
  avatarStage: 3, // índice sobre powerScale
  joinedAt: "2025-11-02",
};

// Escala de poder configurable — el usuario/admin define los umbrales.
// Tope en 120kg de banca (nivel máximo de la escala).
export const powerScale = [
  { level: 1, name: "Guerrero Base", threshold: 0, tag: "BASE" },
  { level: 2, name: "Kaio-ken", threshold: 20, tag: "KAIOKEN" },
  { level: 3, name: "Super Saiyan", threshold: 40, tag: "SSJ" },
  { level: 4, name: "Super Saiyan 2", threshold: 60, tag: "SSJ2" },
  { level: 5, name: "Super Saiyan 3", threshold: 80, tag: "SSJ3" },
  { level: 6, name: "Super Saiyan Blue", threshold: 100, tag: "SSJB" },
  { level: 7, name: "Ultra Instinto", threshold: 120, tag: "UI" },
];

export const currentPower = {
  score: 812345, // número estilo scouter, puramente decorativo
  benchKg: 92,
  stageIndex: 4, // Super Saiyan 3 (entre 80kg y 100kg)
  progressToNext: 0.6, // 60% hacia Super Saiyan Blue
};

export const exercises = [
  { id: "bench", name: "Press banca", muscle: "Pecho", pr: 92, unit: "kg", trend: "+4kg este mes" },
  { id: "squat", name: "Sentadilla", muscle: "Pierna", pr: 130, unit: "kg", trend: "+6kg este mes" },
  { id: "deadlift", name: "Peso muerto", muscle: "Espalda", pr: 150, unit: "kg", trend: "estable" },
  { id: "ohp", name: "Press militar", muscle: "Hombro", pr: 58, unit: "kg", trend: "+2kg este mes" },
  { id: "pullup", name: "Dominadas lastradas", muscle: "Espalda", pr: 25, unit: "kg extra", trend: "+5kg este mes" },
  { id: "row", name: "Remo con barra", muscle: "Espalda", pr: 80, unit: "kg", trend: "+3kg este mes" },
];

// Cada marca guarda peso Y repeticiones juntos (como un set real de gym),
// no una cosa u otra — así el detalle siempre muestra ambos datos.
export const progressLog = [
  { id: 1, date: "2026-07-12", exerciseId: "bench", exercise: "Press banca", muscle: "Pecho", weight: 88, reps: 6, spotted: true },
  { id: 2, date: "2026-07-19", exerciseId: "bench", exercise: "Press banca", muscle: "Pecho", weight: 89, reps: 5, spotted: true },
  { id: 3, date: "2026-07-26", exerciseId: "bench", exercise: "Press banca", muscle: "Pecho", weight: 90, reps: 5, spotted: false },
  { id: 4, date: "2026-08-02", exerciseId: "bench", exercise: "Press banca", muscle: "Pecho", weight: 92, reps: 4, spotted: true },
];

// `days` son índices de semana lunes-first (0=Lunes ... 6=Domingo), para que
// calcen directo con getWeekDates() del Tracker/calendario.
export const routines = [
  {
    id: "push",
    name: "Día de Empuje",
    focus: "Pecho / Hombro / Tríceps",
    days: [0, 3],
    exercises: [
      { id: "push-1", name: "Press banca", sets: 4, reps: 8 },
      { id: "push-2", name: "Press militar", sets: 3, reps: 10 },
      { id: "push-3", name: "Fondos", sets: 3, reps: 12 },
      { id: "push-4", name: "Elevaciones laterales", sets: 3, reps: 15 },
    ],
  },
  {
    id: "pull",
    name: "Día de Tracción",
    focus: "Espalda / Bíceps",
    days: [1, 4],
    exercises: [
      { id: "pull-1", name: "Peso muerto", sets: 4, reps: 6 },
      { id: "pull-2", name: "Remo con barra", sets: 3, reps: 10 },
      { id: "pull-3", name: "Dominadas", sets: 3, reps: 8 },
      { id: "pull-4", name: "Curl bíceps", sets: 3, reps: 12 },
    ],
  },
  {
    id: "legs",
    name: "Día de Pierna",
    focus: "Cuádriceps / Isquios / Glúteo",
    days: [2, 5],
    exercises: [
      { id: "legs-1", name: "Sentadilla", sets: 4, reps: 8 },
      { id: "legs-2", name: "Prensa", sets: 3, reps: 12 },
      { id: "legs-3", name: "Curl femoral", sets: 3, reps: 12 },
      { id: "legs-4", name: "Hip thrust", sets: 3, reps: 10 },
    ],
  },
];

export const nutrition = {
  goal: "Volumen limpio",
  calorieTarget: 3100,
  proteinTarget: 190,
};

// Escala de "Goku comiendo" — sube un cuenco por cada comida del día que registrás.
// `mealsLogged` es la cantidad de comidas cargadas HOY (0 a 5+). `img` apunta a
// /public/nutrition — subí ahí los 6 recortes del contact sheet que armaste.
export const gokuEating = [
  { level: 0, mealsLogged: 0, tag: "0 comidas", img: "/nutrition/goku-0.png" },
  { level: 1, mealsLogged: 1, tag: "1 comida", img: "/nutrition/goku-1.png" },
  { level: 2, mealsLogged: 2, tag: "2 comidas", img: "/nutrition/goku-2.png" },
  { level: 3, mealsLogged: 3, tag: "3 comidas", img: "/nutrition/goku-3.png" },
  { level: 4, mealsLogged: 4, tag: "4 comidas", img: "/nutrition/goku-4.png" },
  { level: 5, mealsLogged: 5, tag: "¡Lleno!", img: "/nutrition/goku-5.png" },
];

// Divisiones de comida por defecto — el usuario las puede editar, agregar o quitar.
export const defaultMealSlots = [
  { id: "desayuno", name: "Desayuno" },
  { id: "almuerzo", name: "Almuerzo" },
  { id: "merienda", name: "Merienda" },
  { id: "cena", name: "Cena" },
  { id: "extra", name: "Comida Extra" },
];

// Suplementos — cada uno guarda un calendario de días consumidos (checksByDate,
// igual formato que los hábitos del Tracker). La racha se calcula en vivo por
// fecha (utils/date.js → currentStreak), no es un número fijo.
export const supplements = [
  {
    id: "protein",
    name: "Proteína",
    icon: "PROT",
    checksByDate: {
      "2026-08-05": true,
      "2026-08-06": true,
      "2026-08-07": true,
      "2026-08-08": true,
      "2026-08-09": true,
    },
  },
  {
    id: "creatine",
    name: "Creatina",
    icon: "CREA",
    checksByDate: {
      "2026-07-31": true,
      "2026-08-01": true,
      "2026-08-02": true,
      "2026-08-03": true,
      "2026-08-04": true,
      "2026-08-05": true,
      "2026-08-06": true,
      "2026-08-07": true,
      "2026-08-08": true,
      "2026-08-09": true,
    },
  },
  {
    id: "preworkout",
    name: "Pre-entreno",
    icon: "PRE",
    checksByDate: {
      "2026-08-03": true,
      "2026-08-04": true,
    },
  },
  {
    id: "monster",
    name: "Monster",
    icon: "MST",
    checksByDate: {
      "2026-08-01": true,
      "2026-08-02": true,
      "2026-08-03": true,
    },
  },
];

// Cada integrante tiene su propia etapa de Vegeta (índice sobre vegetaEvolution,
// reutiliza el mismo arte que ya subiste en /characters) y sus marcas de fuerza
// (banca, sentadilla, peso muerto) — todo distinto por persona.
export const groups = [
  {
    id: "saiyans",
    name: "Escuadrón Saiyan",
    // La escala de poder es Base < SSJ1 < SSJ2 < SSJ3 < Dios < Blue < Ultra Ego.
    // El que tiene Ultra Ego (Nacho) es el más fuerte del grupo, así que también
    // va primero en la carrera de banca.
    members: [
      { name: "Nacho", vegetaStage: 6, benchKg: 100, squatKg: 165, deadliftKg: 190 },
      { name: "Mateo", vegetaStage: 5, benchKg: 90, squatKg: 140, deadliftKg: 160 },
      { name: "Mono", vegetaStage: 3, benchKg: 75, squatKg: 120, deadliftKg: 150 },
      { name: "Carlo", vegetaStage: 2, benchKg: 55, squatKg: 90, deadliftKg: 110 },
    ],
    // Meta grupal: quién levanta más peso en banca. targetKg es la referencia de
    // la "carrera" — al llegar a ese peso, ese integrante se queda con la Monster.
    goal: { title: "¿Quién hace más peso en banca?", prize: "Lata de Monster", targetKg: 100 },
  },
];

export const goals = [
  { id: 1, type: "individual", title: "Banca 100kg", deadline: "2026-10-01", progress: 0.72 },
  { id: 2, type: "individual", title: "Sentadilla 150kg", deadline: "2026-12-01", progress: 0.4 },
  { id: 3, type: "grupal", title: "20 entrenos en equipo — Agosto", deadline: "2026-08-31", progress: 0.65 },
];

export const stats = {
  totalWorkouts: 214,
  activeStreak: 9,
  groupRank: 1,
  powerGainMonth: "+8.4%",
  weeklyVolume: [12, 14, 10, 16, 15, 18, 13],
};

// Escala de evolución de Vegeta — ahora sube según el Power Level real
// (utils/points.js): puntos acumulados de Entrenamiento + Suplementos +
// Alimentación + Tracker. `minScore` está en PUNTOS, no en porcentaje.
// `img` apunta a /public/characters — subí ahí el arte real de cada etapa.
export const vegetaEvolution = [
  { level: 0, name: "Vegeta Base", minScore: 0, tag: "BASE", img: "/characters/vegeta-base.png" },
  { level: 1, name: "Super Saiyan", minScore: 8000, tag: "SSJ1", img: "/characters/vegeta-ssj1.png" },
  { level: 2, name: "Super Saiyan 2", minScore: 20000, tag: "SSJ2", img: "/characters/vegeta-ssj2.png" },
  { level: 3, name: "Super Saiyan 3", minScore: 40000, tag: "SSJ3", img: "/characters/vegeta-ssj3.png" },
  { level: 4, name: "Super Saiyan Dios", minScore: 70000, tag: "SSJ GOD", img: "/characters/vegeta-dios.png" },
  { level: 5, name: "Super Saiyan Blue", minScore: 110000, tag: "SSJ BLUE", img: "/characters/vegeta-blue.png" },
  { level: 6, name: "Ultra Ego", minScore: 160000, tag: "ULTRA EGO", img: "/characters/vegeta-ultraego.png" },
];

// Vegeta entrenando, usado en Rutinas — progresa según cuántos días de la
// semana actual ya entrenaste (proxy: hábito "gym" del Tracker).
// `img` apunta a /public/routines — subí ahí vegeta_frame_1.png ... vegeta_frame_6.png.
export const vegetaTraining = [
  { level: 0, daysTrained: 0, tag: "Sin entrenar esta semana", img: "/routines/vegeta_frame_1.png" },
  { level: 1, daysTrained: 1, tag: "Arrancando la semana", img: "/routines/vegeta_frame_2.png" },
  { level: 2, daysTrained: 2, tag: "Tomando ritmo", img: "/routines/vegeta_frame_3.png" },
  { level: 3, daysTrained: 3, tag: "En racha", img: "/routines/vegeta_frame_4.png" },
  { level: 4, daysTrained: 4, tag: "Casi perfecto", img: "/routines/vegeta_frame_5.png" },
  { level: 5, daysTrained: 5, tag: "Semana perfecta", img: "/routines/vegeta_frame_6.png" },
];

// Hábitos de ejemplo — mezcla de gym y personales, editable por el usuario.
// Los checks ahora se guardan por fecha real (ISO yyyy-mm-dd), no por índice de semana,
// así el tracker funciona igual cruzando semanas y meses.
export const habits = [
  {
    id: "gym",
    name: "Entrenar en el gimnasio",
    type: "gym",
    icon: "🏋️",
    checksByDate: {
      "2026-08-01": true,
      "2026-08-02": true,
      "2026-08-03": true,
      "2026-08-04": true,
      "2026-08-05": true,
      "2026-08-06": true,
      "2026-08-07": true,
      "2026-08-08": true,
      "2026-08-09": true,
    },
  },
  {
    id: "cardio",
    name: "Cardio / movilidad",
    type: "gym",
    icon: "🏃",
    checksByDate: { "2026-08-03": false, "2026-08-04": true, "2026-08-05": true, "2026-08-06": false, "2026-08-07": true, "2026-08-08": false, "2026-08-09": false },
  },
  {
    id: "protein",
    name: "Proteína al día",
    type: "gym",
    icon: "🥤",
    checksByDate: { "2026-08-03": true, "2026-08-04": true, "2026-08-05": true, "2026-08-06": true, "2026-08-07": true, "2026-08-08": false, "2026-08-09": false },
  },
  {
    id: "read",
    name: "Leer / aprender",
    type: "personal",
    icon: "📖",
    checksByDate: { "2026-08-03": true, "2026-08-04": false, "2026-08-05": true, "2026-08-06": true, "2026-08-07": false, "2026-08-08": false, "2026-08-09": false },
  },
  {
    id: "sleep",
    name: "Dormir antes de las 23:30",
    type: "personal",
    icon: "🌙",
    checksByDate: { "2026-08-03": true, "2026-08-04": true, "2026-08-05": false, "2026-08-06": true, "2026-08-07": false, "2026-08-08": false, "2026-08-09": false },
  },
  {
    id: "finance",
    name: "Control de gastos",
    type: "personal",
    icon: "💰",
    checksByDate: { "2026-08-03": true, "2026-08-04": false, "2026-08-05": false, "2026-08-06": true, "2026-08-07": true, "2026-08-08": false, "2026-08-09": false },
  },
  {
    id: "screens",
    name: "Detox de redes",
    type: "personal",
    icon: "📵",
    checksByDate: { "2026-08-03": false, "2026-08-04": true, "2026-08-05": true, "2026-08-06": false, "2026-08-07": false, "2026-08-08": false, "2026-08-09": false },
  },
];

export const personalNotes = [
  { id: 1, type: "gym", text: "Subir 2.5kg en press banca esta semana", done: false },
  { id: 2, type: "gym", text: "Probar rutina push/pull/legs por 4 semanas", done: false },
  { id: 3, type: "personal", text: "Terminar el curso de inglés — módulo 3", done: true },
  { id: 4, type: "personal", text: "Dormir 8hs al menos 5 días esta semana", done: false },
];

export const notificationsPreview = [
  { id: 1, title: "Entreno de Pierna", time: "Hoy · 19:00", type: "personal" },
  { id: 2, title: "Objetivo grupal — Escuadrón Saiyan", time: "Mañana · 08:00", type: "grupo" },
];
