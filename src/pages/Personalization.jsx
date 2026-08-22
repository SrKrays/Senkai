import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Card, Tag, CharacterArt } from "../components/ui";
import ImagePrizeUploader from "../components/ImagePrizeUploader";
import { useCharacter } from "../context/CharacterContext";
import { useProfile } from "../context/ProfileContext";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Perfil básico (Fase 9) — altura y hora de dormir se guardan juntos con
// "Guardar perfil"; el peso corporal es un registro aparte con fecha (uno
// por día, se pisa si ya cargaste hoy) porque es lo que necesitan el rango
// por ejercicio y la evolución para calcularse bien en el tiempo.
function ProfileCard() {
  const { heightCm, bedTime, proteinTarget, latestWeightKg, loading, updateProfile, logWeight } = useProfile();
  const [draftHeight, setDraftHeight] = useState("");
  const [draftBedTime, setDraftBedTime] = useState("");
  const [draftProteinTarget, setDraftProteinTarget] = useState("");
  const [draftWeight, setDraftWeight] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);

  const height = draftHeight !== "" ? draftHeight : heightCm ?? "";
  const bed = draftBedTime !== "" ? draftBedTime : bedTime ?? "";
  const proteinGoal = draftProteinTarget !== "" ? draftProteinTarget : proteinTarget ?? "";

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await updateProfile({
        heightCm: height === "" ? null : Number(height),
        bedTime: bed === "" ? null : bed,
        proteinTarget: proteinGoal === "" ? null : Number(proteinGoal),
      });
      setDraftHeight("");
      setDraftBedTime("");
      setDraftProteinTarget("");
      toast.success("Perfil guardado.");
    } catch (err) {
      toast.error(err?.message || "No se pudo guardar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogWeight() {
    const kg = Number(draftWeight);
    if (!kg || kg <= 0) return;
    setSavingWeight(true);
    try {
      await logWeight(todayISO(), kg);
      setDraftWeight("");
      toast.success("Peso registrado.");
    } catch (err) {
      toast.error(err?.message || "No se pudo registrar el peso.");
    } finally {
      setSavingWeight(false);
    }
  }

  return (
    <Card className="mb-6 flex flex-col gap-4">
      <div>
        <p className="eyebrow mb-1">Perfil</p>
        <p className="text-xs text-muted">
          Base para el rango por ejercicio, la evolución y los objetivos de suplementación — se puede editar cuando quieras.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-widest2 text-muted">Altura (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setDraftHeight(e.target.value)}
                placeholder="Ej: 178"
                className="w-28 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-widest2 text-muted">Hora de dormir</label>
              <input
                type="time"
                value={bed}
                onChange={(e) => setDraftBedTime(e.target.value)}
                className="w-32 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-widest2 text-muted">Objetivo de proteína (g/día)</label>
              <input
                type="number"
                value={proteinGoal}
                onChange={(e) => setDraftProteinTarget(e.target.value)}
                placeholder="Ej: 160"
                className="w-32 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="bg-maroon px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow disabled:opacity-50"
            >
              Guardar perfil
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-widest2 text-muted">
                Peso corporal de hoy (kg){latestWeightKg ? ` — último: ${latestWeightKg}kg` : ""}
              </label>
              <input
                type="number"
                step="0.1"
                value={draftWeight}
                onChange={(e) => setDraftWeight(e.target.value)}
                placeholder={latestWeightKg ? String(latestWeightKg) : "Ej: 78.5"}
                className="w-32 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
              />
            </div>
            <button
              onClick={handleLogWeight}
              disabled={savingWeight}
              className="border border-maroon/25 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10 disabled:opacity-50"
            >
              Registrar peso
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

function StageEditor({ stage, onSave, onRestore }) {
  const [draftName, setDraftName] = useState(stage.name);
  const [draftImage, setDraftImage] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!draftName.trim()) return;
    setSaving(true);
    try {
      await onSave(stage.level, { name: draftName.trim(), imageDataUrl: draftImage });
      setDraftImage(null);
      toast.success(`Etapa ${stage.level + 1} guardada.`);
    } catch (err) {
      toast.error(err?.message || "No se pudo guardar la etapa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore() {
    setSaving(true);
    try {
      await onRestore(stage.level);
      setDraftName(stage.name);
      setDraftImage(null);
      toast.success("Etapa restaurada a Vegeta.");
    } catch {
      toast.error("No se pudo restaurar la etapa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex gap-4">
      <CharacterArt src={draftImage || stage.img} alt={stage.name} width={90} height={130} />
      <div className="flex flex-1 flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <p className="eyebrow">
            Etapa {stage.level + 1} · ≥ {stage.minScore.toLocaleString("es-AR")} pts
          </p>
          {stage.custom && <Tag tone="teal">Tu foto</Tag>}
        </div>
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Nombre de la etapa"
          className="border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
        />
        <ImagePrizeUploader value={draftImage} onChange={setDraftImage} aspect={90 / 130} size={48} hint="Imagen o GIF" />
        <div className="mt-1 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-maroon px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow disabled:opacity-50"
          >
            Guardar
          </button>
          {stage.custom && (
            <button
              onClick={handleRestore}
              disabled={saving}
              className="border border-maroon/25 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10 disabled:opacity-50"
            >
              Restaurar a Vegeta
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Personalization() {
  const { themeName, stages, loading, updateTheme, updateStage, removeStage } = useCharacter();
  const [draftTheme, setDraftTheme] = useState(themeName);
  const [savingTheme, setSavingTheme] = useState(false);

  async function handleSaveTheme() {
    if (!draftTheme.trim()) return;
    setSavingTheme(true);
    try {
      await updateTheme(draftTheme.trim());
      toast.success("Nombre de personaje guardado.");
    } catch {
      toast.error("No se pudo guardar el nombre.");
    } finally {
      setSavingTheme(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Personalización"
        title="Tu personaje"
        description="Vegeta es la base por defecto — reemplazá el nombre y la imagen/gif de cada una de las 7 etapas por las tuyas. Los puntos donde sube cada etapa son fijos, así el ranking de Grupos sigue siendo comparable."
      />

      <ProfileCard />

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="eyebrow shrink-0">Nombre de tu personaje</p>
        <input
          value={draftTheme}
          onChange={(e) => setDraftTheme(e.target.value)}
          placeholder="Ej: Goku Ultra Instinto"
          className="flex-1 border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
        />
        <button
          onClick={handleSaveTheme}
          disabled={savingTheme}
          className="shrink-0 bg-maroon px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow disabled:opacity-50"
        >
          Guardar nombre
        </button>
      </Card>

      {loading ? (
        <p className="text-sm text-muted">Cargando tu personaje...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stages.map((s) => (
            <StageEditor key={s.level} stage={s} onSave={updateStage} onRestore={removeStage} />
          ))}
        </div>
      )}
    </div>
  );
}
