// Utilidades de fecha para el Tracker — todo en JS puro, sin backend.
// Cuando pasemos a .NET, esta lógica se puede portar 1:1 a servicios del lado del servidor.

export const DIAS_CORTOS = ["L", "M", "M", "J", "V", "S", "D"];

/** yyyy-mm-dd en horario local (evita el corrimiento de toISOString con UTC). */
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Lunes de la semana que contiene `date`. */
export function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo, 1 = lunes, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Array de 7 Date, de lunes a domingo, para la semana de `date`. */
export function getWeekDates(date) {
  const monday = startOfWeekMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function isSameDay(a, b) {
  return toISO(a) === toISO(b);
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Nombre de mes + año, ej: "Agosto de 2026". */
export function monthLabel(date) {
  return capitalize(date.toLocaleDateString("es-AR", { month: "long", year: "numeric" }));
}

/** Racha de días CONSECUTIVOS marcados, contando hacia atrás desde `date` (incluida). */
export function currentStreak(checksByDate, date) {
  let streak = 0;
  const cursor = new Date(date);
  cursor.setHours(0, 0, 0, 0);
  while (checksByDate[toISO(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Progreso del mes hasta `date` (incluida): días marcados / total de días del mes. */
export function monthStats(checksByDate, date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const totalDays = daysInMonth(year, month);
  const elapsed = date.getDate();
  let checked = 0;
  for (let d = 1; d <= elapsed; d++) {
    if (checksByDate[toISO(new Date(year, month, d))]) checked++;
  }
  return { checked, totalDays, elapsed, pct: totalDays ? checked / totalDays : 0 };
}

/** Suma/resta `n` semanas a `date` (n puede ser negativo). */
export function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/**
 * Contador mensual 0→100%: agrupa los días transcurridos del mes por semana
 * (lunes a domingo) y promedia el cumplimiento semana a semana — así una
 * semana completa "cuenta" lo mismo sin importar cuántos días tenga el mes.
 * Combina el cumplimiento de TODOS los hábitos cargados (70%) con los
 * objetivos marcados como hechos (30%). Sin hábitos y sin objetivos
 * cumplidos, da 0% (Vegeta base). Cumpliendo todo, semana a semana +
 * objetivos, llega a 100% (nivel máximo).
 */
export function monthlyCompletion(habits, notes, date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const elapsed = date.getDate();

  const weeks = new Map();
  for (let d = 1; d <= elapsed; d++) {
    const day = new Date(year, month, d);
    const key = toISO(startOfWeekMonday(day));
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key).push(day);
  }

  const weekRatios = [];
  for (const days of weeks.values()) {
    const possible = days.length * habits.length;
    let done = 0;
    for (const day of days) {
      const iso = toISO(day);
      for (const h of habits) if (h.checksByDate[iso]) done++;
    }
    weekRatios.push(possible ? done / possible : 0);
  }

  const daysComponent = weekRatios.length ? weekRatios.reduce((a, b) => a + b, 0) / weekRatios.length : 0;
  const objectivesComponent = notes.length ? notes.filter((n) => n.done).length / notes.length : 0;
  const pct = daysComponent * 0.7 + objectivesComponent * 0.3;

  return { pct, daysComponent, objectivesComponent, weeksCount: weekRatios.length };
}
