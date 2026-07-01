import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/database.types";

interface Props {
  children: ReactNode;
  allow?: UserRole | UserRole[];
}

export default function ProtectedRoute({ children, allow }: Props) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow && role) {
    const allowed = Array.isArray(allow) ? allow : [allow];
    if (!allowed.includes(role)) {
      const fallback =
        role === "provider" ? "/provider/dashboard" : role === "admin" ? "/admin" : "/client/dashboard";
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}
