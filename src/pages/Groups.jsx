import { PageHeader, Card, ProgressBar, Tag, CharacterArt } from "../components/ui";
import { groups, vegetaEvolution } from "../data/mockData";

export default function Groups() {
  const group = groups[0];
  const { goal, members } = group;

  const ranked = [...members].sort((a, b) => b.benchKg - a.benchKg);
  const leader = ranked[0];

  return (
    <div>
      <PageHeader
        eyebrow="Grupos"
        title={group.name}
        description="Comparti progreso con tu equipo y compitan por metas grupales."
        action={
          <button className="border border-maroon/40 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-maroon hover:bg-maroon hover:text-paper">
            + Nuevo grupo
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
      <div>

      {/* Carrera grupal — quién levanta más peso en banca, cada integrante con su marcador */}
      <Card className="mb-8">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <p className="eyebrow mb-1">Meta grupal</p>
            <h3 className="font-display text-3xl tracking-wide">{goal.title}</h3>
          </div>
          <p className="font-mono text-sm text-muted">
            Líder: {leader.name} · {leader.benchKg}kg / {goal.targetKg}kg
          </p>
        </div>

        <div className="relative h-16 border border-ink/15">
          <div className="absolute inset-0 flex items-center justify-between px-3 font-mono text-[10px] uppercase tracking-widest2 text-muted">
            <span>Inicio</span>
            <span>{goal.prize} 🏁</span>
          </div>
          {members.map((m, i) => {
            const pct = Math.min(1, m.benchKg / goal.targetKg);
            const isLeader = m.name === leader.name;
            return (
              <div
                key={m.name}
                className="absolute top-1/2 flex -translate-y-1/2 flex-col items-center transition-all"
                style={{ left: `calc(${pct * 100}% - 10px)`, marginTop: i % 2 === 0 ? -10 : 10 }}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[8px] font-bold text-paper ${
                    isLeader ? "bg-maroon" : "bg-teal"
                  }`}
                  title={`${m.name} — ${m.benchKg}kg`}
                >
                  {m.name.charAt(0)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {ranked.map((m) => (
            <span
              key={m.name}
              className="flex items-center gap-1.5 border border-maroon/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest2 text-muted"
            >
              {m.name} · {m.benchKg}kg
              {m.name === leader.name && <Tag tone="teal">va ganando</Tag>}
            </span>
          ))}
        </div>
      </Card>

      {/* Integrantes — Power Level como estadística principal, marcas de fuerza como secundarias */}
      <p className="eyebrow mb-4">Integrantes</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {members.map((m) => {
          const stage = vegetaEvolution[m.vegetaStage] || vegetaEvolution[0];
          // Power Level de exhibición: piso de la etapa de Vegeta que tiene asignada
          // + un extra proporcional a su banca, para que no sea un número plano.
          const memberPower = stage.minScore + m.benchKg * 50;
          return (
            <Card key={m.name} className="flex items-center gap-4">
              <CharacterArt src={stage.img} alt={`${m.name} — ${stage.name}`} width={110} height={180} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="mb-3 font-mono text-xs text-muted">{stage.name}</p>

                <div className="hud mb-3 border border-line bg-paper px-3 py-2">
                  <p className="eyebrow mb-0.5">Power Level</p>
                  <p className="font-mono text-2xl font-semibold text-maroon">
                    {memberPower.toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">{m.benchKg}</p>
                    <p className="eyebrow">PR Banca</p>
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">{m.squatKg}</p>
                    <p className="eyebrow">Sentadilla</p>
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">{m.deadliftKg}</p>
                    <p className="eyebrow">Peso muerto</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Cada integrante apuntando a la meta — una fila ilustrada, lado a lado */}
      <p className="eyebrow mb-4">Camino a la Monster</p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {members.map((m) => {
          const stage = vegetaEvolution[m.vegetaStage] || vegetaEvolution[0];
          const isLeader = m.name === leader.name;
          return (
            <Card key={m.name} className="flex flex-col items-center gap-3 py-10 text-center">
              <CharacterArt src={stage.img} alt={`${m.name} — ${stage.name}`} width={150} height={230} />
              <div>
                <p className="text-base font-semibold">{m.name}</p>
                <p className="font-mono text-xs text-muted">{stage.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-y border-line py-3 text-center">
                <div>
                  <p className="font-mono text-lg font-semibold text-maroon">{m.benchKg}</p>
                  <p className="eyebrow">Banca</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold text-maroon">{m.squatKg}</p>
                  <p className="eyebrow">Sentadilla</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-2xl text-maroon">
                <span className="font-mono text-sm">{m.benchKg}kg</span>
                <span>→</span>
                <img
                  src="/groups/obj.jpg"
                  alt="Lata de Monster"
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "inline";
                  }}
                />
                <span title="Lata de Monster" style={{ display: "none" }}>
                  🥤
                </span>
              </div>

              {isLeader ? (
                <Tag tone="teal">va ganando</Tag>
              ) : (
                <p className="font-mono text-[10px] text-muted">
                  faltan {Math.max(0, goal.targetKg - m.benchKg)}kg
                </p>
              )}
            </Card>
          );
        })}
      </div>

      </div>

      {/* Gran Premio — subí tu imagen a public/groups/premio.jpg */}
      <div>
        <p className="eyebrow mb-4">Gran Premio</p>
        <Card className="sticky top-24 flex flex-col items-center gap-4 py-8">
          <CharacterArt src="/groups/premio.jpg" alt={goal.prize} width={200} height={240} />
          <div className="text-center">
            <p className="eyebrow mb-1">En juego</p>
            <h3 className="font-display text-2xl tracking-wide text-maroon">{goal.prize}</h3>
          </div>
          <p className="text-center text-xs text-muted">
            Se la lleva quien llegue primero a los {goal.targetKg}kg en banca.
          </p>
        </Card>
      </div>

      </div>
    </div>
  );
}
