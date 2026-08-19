import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";

const TOKEN_KEY = "senkai_token";
const AuthContext = createContext(null);

// Fase 0 — sesión real contra Senkai.Api. El token vive en localStorage (es
// una app real, no un artifact: esto es lo estándar para un SPA con JWT).
// `status` es "loading" mientras se valida el token guardado contra
// /api/users/me, así ProtectedRoute no manda a nadie a /login antes de saber.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) {
      setStatus("anonymous");
      return;
    }
    let cancelled = false;
    apiFetch("/api/users/me", { token })
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const applySession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await apiFetch("/api/auth/register", { method: "POST", body: { name, email, password } });
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = {
    user,
    token,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
