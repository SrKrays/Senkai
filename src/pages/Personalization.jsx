import { PageHeader, Card, Tag } from "../components/ui";

const themes = [
  { id: "dbz", name: "Dragon Ball", active: true },
  { id: "custom", name: "Personaje propio", active: false },
];

export default function Personalization() {
  return (
    <div>
      <PageHeader
        eyebrow="Personalización"
        title="Temática y personaje"
        description="Reemplazá la temática Dragon Ball por la tuya: subí imágenes y armá tu propio personaje evolutivo."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {themes.map((t) => (
          <Card key={t.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl tracking-wide">{t.name}</p>
              {t.active && <Tag>Activa</Tag>}
            </div>
            <div className="hud flex h-32 items-center justify-center border border-dashed border-ink/25">
              <span className="eyebrow">Vista previa de etapas</span>
            </div>
            <button className="border border-maroon/40 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper">
              {t.active ? "Editar etapas" : "Subir mis imágenes"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
