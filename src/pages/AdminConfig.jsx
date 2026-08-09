import { PageHeader, Card, Tag } from "../components/ui";
import { useTraining } from "../context/TrainingContext";

export default function AdminConfig() {
  const { powerScale, exercises } = useTraining();

  return (
    <div>
      <PageHeader
        eyebrow="Configuración · Admin"
        title="Control base del sistema"
        description="Solo el admin accede a esta sección: escalas de poder, biblioteca de ejercicios y parámetros estructurales."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Escala de poder</p>
            <button className="font-mono text-xs underline underline-offset-4">Editar umbrales</button>
          </div>
          <ul className="flex flex-col">
            {powerScale.map((s) => (
              <li key={s.level} className="flex items-center justify-between border-b border-ink/10 py-2.5 text-sm last:border-none">
                <span>{s.name}</span>
                <span className="font-mono text-xs text-muted">≥ {s.threshold}kg</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Biblioteca de ejercicios</p>
            <button className="font-mono text-xs underline underline-offset-4">+ Agregar ejercicio</button>
          </div>
          <ul className="flex flex-col">
            {exercises.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between border-b border-ink/10 py-2.5 text-sm last:border-none">
                <span>{ex.name}</span>
                <Tag>{ex.muscle}</Tag>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
