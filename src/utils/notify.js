// Wrapper fino sobre sonner — el estilo base (fondo/borde/tipografía) se
// configura una sola vez en el <Toaster/> de App.jsx; acá solo definimos los
// mensajes de los eventos "de logro" de la app para no repetir texto en cada
// pantalla que los dispara.
import { toast } from "sonner";

export function notifyPR(exerciseName, detail) {
  toast.success(`Nuevo PR — ${exerciseName}`, { description: detail });
}

export function notifyObjective(text) {
  toast.success("Objetivo cumplido", { description: text });
}

export function notifySupplement(name) {
  toast(`${name} registrado`, { description: "Racha sumada por hoy." });
}

export function notifyLevelUp(stageName) {
  toast.success("Nueva transformación desbloqueada", { description: stageName });
}
