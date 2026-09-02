import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../utils/apiClient";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="hud w-full max-w-sm border border-maroon/20 p-8 animate-rise">
        <div className="mb-8">
          <Logo badgeSize={34} />
        </div>

        <p className="eyebrow mb-1">Acceso privado</p>
        <h1 className="font-display text-3xl leading-tight tracking-wide">
          Escaneando
          <br />
          presencia...
        </h1>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="block">
              <span className="eyebrow mb-1.5 block">Nombre</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-maroon/20 bg-transparent px-3 py-2.5 font-mono text-sm outline-none focus:border-maroon"
              />
            </label>
          )}

          <label className="block">
            <span className="eyebrow mb-1.5 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@senkai.app"
              required
              className="w-full border border-maroon/20 bg-transparent px-3 py-2.5 font-mono text-sm outline-none focus:border-maroon"
            />
          </label>

          <label className="block">
            <span className="eyebrow mb-1.5 block">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full border border-maroon/20 bg-transparent px-3 py-2.5 font-mono text-sm outline-none focus:border-maroon"
            />
          </label>

          {error && (
            <p className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger-light">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-maroon py-3 font-mono text-xs uppercase tracking-widest2 text-paper transition-all duration-250 hover:opacity-90 hover:shadow-glow disabled:opacity-50"
          >
            {loading ? "Escaneando..." : mode === "login" ? "Entrar al dashboard" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError("");
          }}
          className="mt-6 block w-full text-center font-mono text-[11px] text-muted underline underline-offset-4 hover:text-maroon"
        >
          {mode === "login" ? "¿Todavía no tenés cuenta? Creá una" : "¿Ya tenés cuenta? Entrá"}
        </button>
      </div>
    </div>
  );
}
