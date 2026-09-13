import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: UserRole[];
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="py-24 text-center text-ink/50">Loading…</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
