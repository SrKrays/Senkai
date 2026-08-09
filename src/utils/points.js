// Sistema de puntos "Power Level" — sin backend, todo calculado en el cliente
// a partir de lo que el usuario ya carga en Entrenamiento, Suplementación,
// Nutrición y Tracker. Esto reemplaza el número decorativo que había antes:
// ahora sube (o se estanca) según acciones reales.
//
// Reglas:
//   Entrenamiento: +3000 por cada PR nuevo de PESO, +1000 por cada PR nuevo de REPS
//                  (comparado contra el máximo previo del mismo ejercicio).
//   Suplementos:   +2000 por cada día marcado como tomado (constancia = puntos).
//   Alimentación:  hasta +10000 por día según cuántas comidas del plan completaste
//                  ese día (proporcional — completar todo = 10000, la mitad = 5000).
//   Tracker:       +1000 por cada objetivo cumplido, +4000 por cada semana
//                  (lunes a domingo) donde un hábito se cumplió los 7 días.

import { startOfWeekMonday, toISO } from "./date";

export function trainingPoints(progressLog) {
  const byExercise = {};
  for (const p of progressLog) {
    (byExercise[p.exerciseId] ||= []).push(p);
  }
  let points = 0;
  for (const marks of Object.values(byExercise)) {
    const sorted = [...marks].sort((a, b) => a.date.localeCompare(b.date));
    let maxWeight = -Infinity;
    let maxReps = -Infinity;
    for (const m of sorted) {
      if (m.weight > maxWeight) {
        points += 3000;
        maxWeight = m.weight;
      }
      if (m.reps > maxReps) {
        points += 1000;
        maxReps = m.reps;
      }
    }
  }
  return points;
}

export function supplementPoints(supplements) {
  let points = 0;
  for (const s of supplements) {
    points += Object.values(s.checksByDate).filter(Boolean).length * 2000;
  }
  return points;
}

export function nutritionPoints(mealLogsByDate, mealSlots) {
  const slotCount = mealSlots.length;
  if (!slotCount) return 0;
  let points = 0;
  for (const logs of Object.values(mealLogsByDate)) {
    const logged = mealSlots.filter((s) => logs[s.id]).length;
    points += Math.round((logged / slotCount) * 10000);
  }
  return points;
}

export function trackerPoints(habits, notes) {
  let points = notes.filter((n) => n.done).length * 1000;

  for (const h of habits) {
    const weekCounts = {};
    for (const [iso, checked] of Object.entries(h.checksByDate)) {
      if (!checked) continue;
      const key = toISO(startOfWeekMonday(new Date(iso)));
      weekCounts[key] = (weekCounts[key] || 0) + 1;
    }
    for (const count of Object.values(weekCounts)) {
      if (count >= 7) points += 4000;
    }
  }
  return points;
}
