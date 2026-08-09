import { PageHeader, Card, ProgressBar, Tag } from "../components/ui";
import { goals } from "../data/mockData";

export default function Goals() {
  const individual = goals.filter((g) => g.type === "individual");
  const group = goals.filter((g) => g.type === "grupal");

  return (
    <div>
      <PageHeader
        eyebrow="Objetivos"
        title="Metas en curso"
        description="Cargá objetivos personales y grupales, y seguí su progreso desde acá."
        action={
          <button className="border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper">
            + Nuevo objetivo
          </button>
        }
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-4">Individuales</p>
          <div className="flex flex-col gap-4">
            {individual.map((g) => (
              <Card key={g.id}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">{g.title}</p>
                  <Tag>vence {g.deadline}</Tag>
                </div>
                <ProgressBar progress={g.progress} tone="teal" />
              </Card>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-4">Grupales</p>
          <div className="flex flex-col gap-4">
            {group.map((g) => (
              <Card key={g.id}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">{g.title}</p>
                  <Tag>vence {g.deadline}</Tag>
                </div>
                <ProgressBar progress={g.progress} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
