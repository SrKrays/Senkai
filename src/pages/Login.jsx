import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="hud w-full max-w-sm border border-maroon/20 p-8 animate-rise">
        <div className="mb-8 flex items-center gap-2">
          <span className="h-2 w-2 animate-tick bg-teal" />
          <span className="font-display text-2xl tracking-widest2">KRAY SEKAI</span>
        </div>

        <p className="eyebrow mb-1">Acceso privado</p>
        <h1 className="font-display text-3xl leading-tight tracking-wide">
          Escaneando<br />presencia...
        </h1>

        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <label className="block">
            <span className="eyebrow mb-1.5 block">Enlace de acceso</span>
            <input
              type="text"
              defaultValue="kray-sekai.app/x9k2"
              className="w-full border border-maroon/20 bg-transparent px-3 py-2.5 font-mono text-sm outline-none focus:border-maroon"
              readOnly
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Contraseña</span>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border border-maroon/20 bg-transparent px-3 py-2.5 font-mono text-sm outline-none focus:border-maroon"
            />
          </label>

          <button
            type="submit"
            className="mt-2 bg-maroon py-3 font-mono text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-80"
          >
            Entrar al dashboard
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-[11px] text-muted">
          Solo el admin tiene acceso a esta instancia.
        </p>
      </div>
    </div>
  );
}
