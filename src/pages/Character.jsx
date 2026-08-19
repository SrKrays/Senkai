import { Link } from "react-router-dom";
import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import { usePoints } from "../context/PointsContext";
import { useCharacter } from "../context/CharacterContext";

export default function Character() {
  const { powerLevel } = usePoints();
  const { themeName, stages, current, next, progress, loading } = useCharacter();

  return (
    <div>
      <PageHeader
        eyebrow="Personaje"
        title={themeName}
        description="Tu evolución sube con el Power Level real (Entrenamiento + Suplementos + Alimentación + Tracker). Las imágenes de cada etapa las elegís vos desde Personalización."
        action={
          <Link
            to="/personalizacion"
            className="border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon transition-all duration-250 hover:bg-maroon hover:text-paper hover:shadow-glow"
          >
            Editar mi personaje
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="flex flex-col items-center justify-center gap-6 py-14">
          <CharacterArt src={current.img} alt={current.name} size={224} />
          <div className="text-center">
            <p className="eyebrow mb-1">
              Etapa {current.level + 1} de {stages.length} · {powerLevel.toLocaleString("es-AR")} pts
            </p>
            <h2 className="font-display text-4xl tracking-wide">{current.name}</h2>
            <Tag tone="teal">{current.tag}</Tag>
          </div>
          <div className="w-full max-w-xs">
            <p className="mb-2 font-mono text-xs text-muted">
              {next ? `Próxima: ${next.name} en ${(next.minScore - powerLevel).toLocaleString("es-AR")} pts` : "Nivel máximo alcanzado"}
            </p>
            <ProgressBar progress={progress} tone="teal" />
          </div>
        </Card>

        <Card>
          <p className="eyebrow mb-4">Línea de evolución completa</p>
          {loading ? (
            <p className="text-sm text-muted">Cargando tu personaje...</p>
          ) : (
            <ul className="flex flex-col">
              {stages.map((s) => {
                const isCurrent = s.level === current.level;
                const isDone = s.level < current.level;
                return (
                  <li
                    key={s.level}
                    className={`flex items-center justify-between gap-3 border-b border-ink/10 py-3.5 last:border-none ${
                      isCurrent ? "opacity-100" : isDone ? "opacity-60" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted">{String(s.level + 1).padStart(2, "0")}</span>
                      <span className={`text-sm ${isCurrent ? "font-semibold" : ""}`}>{s.name}</span>
                      {isCurrent && <Tag>Actual</Tag>}
                      {s.custom && <Tag tone="teal">Tu foto</Tag>}
                    </div>
                    <span className="font-mono text-xs text-muted">≥ {s.minScore.toLocaleString("es-AR")} pts</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
