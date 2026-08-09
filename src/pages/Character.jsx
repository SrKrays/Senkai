import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import { useTraining } from "../context/TrainingContext";

export default function Character() {
  const { powerScale, stageIndex, stage, next, progressToNext, benchKg } = useTraining();

  return (
    <div>
      <PageHeader
        eyebrow="Personaje"
        title="Tu evolución"
        description="Esta escala sube con tu PR de Press banca, cargado en Entrenamiento. La escala completa la define el admin en Configuración."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="flex flex-col items-center justify-center gap-6 py-14">
          <CharacterArt src={null} alt={stage.name} size={224} />
          <div className="text-center">
            <p className="eyebrow mb-1">
              Etapa {stageIndex + 1} de {powerScale.length} · {benchKg}kg en banca
            </p>
            <h2 className="font-display text-4xl tracking-wide">{stage.name}</h2>
          </div>
          <div className="w-full max-w-xs">
            <p className="mb-2 font-mono text-xs text-muted">
              {next ? `Próxima: ${next.name} en ${next.threshold - benchKg}kg` : "Nivel máximo alcanzado"}
            </p>
            <ProgressBar progress={progressToNext} tone="teal" />
          </div>
        </Card>

        <Card>
          <p className="eyebrow mb-4">Línea de evolución completa</p>
          <ul className="flex flex-col">
            {powerScale.map((s, i) => {
              const isCurrent = i === stageIndex;
              const isDone = i < stageIndex;
              return (
                <li
                  key={s.level}
                  className={`flex items-center justify-between gap-3 border-b border-ink/10 py-3.5 last:border-none ${
                    isCurrent ? "opacity-100" : isDone ? "opacity-60" : "opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">{String(s.level).padStart(2, "0")}</span>
                    <span className={`text-sm ${isCurrent ? "font-semibold" : ""}`}>{s.name}</span>
                    {isCurrent && <Tag>Actual</Tag>}
                  </div>
                  <span className="font-mono text-xs text-muted">≥ {s.threshold}kg banca</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
