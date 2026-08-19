import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { CharacterArt } from "./ui";
import ImagePrizeUploader from "./ImagePrizeUploader";
import { useCharacter } from "../context/CharacterContext";

const TUTORIAL_TIPS = [
  "Tu Power Level sube solo con lo que ya cargás en Entrenamiento, Nutrición, Suplementos y el Tracker.",
  "Cada tanto tu personaje evoluciona — Vegeta es la base, pero podés reemplazarlo por el tuyo.",
  "Armá o unite a un grupo con un código para competir con tus amigos.",
];

// Se muestra una sola vez, apenas alguien entra sin personaje configurado
// (ver CharacterContext.needsOnboarding) — tutorial mínimo + alta rápida del
// personaje. Totalmente salteable: "Ahora no" lo recuerda por usuario y no
// vuelve a insistir; siempre se puede completar después desde Personalización.
export default function CharacterOnboarding() {
  const { needsOnboarding, dismissOnboarding, current, updateTheme, updateStage } = useCharacter();
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (name.trim()) await updateTheme(name.trim());
      if (image) await updateStage(current.level, { name: current.name, imageDataUrl: image });
      toast.success("¡Personaje listo!");
    } catch {
      toast.error("No se pudo guardar todo — podés terminarlo desde Personalización.");
    } finally {
      setSaving(false);
      dismissOnboarding();
    }
  }

  return (
    <AnimatePresence>
      {needsOnboarding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-paper/90 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="hud w-full max-w-md border border-maroon/30 bg-card p-6"
          >
            <p className="eyebrow mb-1">Bienvenido a Senkai</p>
            <h2 className="mb-4 font-display text-2xl tracking-wide text-maroon">Armá tu personaje</h2>

            <ul className="mb-5 flex flex-col gap-1.5">
              {TUTORIAL_TIPS.map((tip) => (
                <li key={tip} className="font-mono text-[11px] leading-relaxed text-muted">
                  · {tip}
                </li>
              ))}
            </ul>

            <div className="mb-4 flex items-center gap-3">
              <CharacterArt src={image || current.img} alt={current.name} width={70} height={100} />
              <div className="flex flex-1 flex-col gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de tu personaje (ej: Goku)"
                  className="border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
                />
                <ImagePrizeUploader value={image} onChange={setImage} aspect={70 / 100} size={40} hint="Imagen o GIF de tu etapa actual" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-maroon py-2.5 font-mono text-xs uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow disabled:opacity-50"
              >
                Listo
              </button>
              <button
                onClick={dismissOnboarding}
                className="flex-1 border border-maroon/25 py-2.5 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
              >
                Ahora no
              </button>
            </div>
            <p className="mt-3 text-center font-mono text-[10px] text-muted">
              Podés cambiarlo cuando quieras desde Personalización.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
