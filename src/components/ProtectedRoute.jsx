import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Guardia de rutas — mientras se valida el token guardado no redirige a
// nadie (evita el parpadeo a /login en cada refresh); recién decide cuando
// status deja de ser "loading".
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-mono text-xs uppercase tracking-widest2 text-muted">Escaneando presencia...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
