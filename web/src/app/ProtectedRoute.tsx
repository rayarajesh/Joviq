import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/context/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isBooting } = useAuth();

  if (isBooting) {
    return <div className="page-loader">Loading your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
