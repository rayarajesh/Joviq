import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthenticatedNavbar } from "../components/AuthenticatedNavbar";
import { useAuth } from "../features/auth/context/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowIncompleteProfile?: boolean;
};

export function ProtectedRoute({ children, allowIncompleteProfile = false }: ProtectedRouteProps) {
  const { user, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) {
    return <div className="page-loader">Loading your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const needsStudentOnboarding =
    user.roles.includes("Student") && user.onboardingStatus !== "Completed" && !allowIncompleteProfile;

  if (needsStudentOnboarding) {
    return <Navigate to="/student/onboarding" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="authenticated-app">
      <AuthenticatedNavbar />
      <div className="authenticated-app__content">{children}</div>
    </div>
  );
}
