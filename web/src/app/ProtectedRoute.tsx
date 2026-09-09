import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthenticatedNavbar } from "../components/AuthenticatedNavbar";
import { useAuth } from "../features/auth/context/useAuth";
import { studentLmsApi } from "../features/lms/api/lmsApi";
import { readPendingEnrollment } from "../features/lms/checkout";

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
    user.roles.includes("Student") && user.onboardingStatus !== "Completed" && !allowIncompleteProfile && location.pathname !== "/dashboard";

  const protectedContent = location.pathname === "/dashboard" && user.roles.includes("Student")
    ? <StudentDashboardGate>{children}</StudentDashboardGate>
    : children;

  if (needsStudentOnboarding) {
    return <Navigate to="/student/onboarding" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="authenticated-app">
      <AuthenticatedNavbar />
      <div className="authenticated-app__content">{protectedContent}</div>
    </div>
  );
}

function StudentDashboardGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "allowed" | "blocked">("loading");

  useEffect(() => {
    let mounted = true;
    void studentLmsApi.getDashboard()
      .then((response) => {
        if (!mounted) return;
        setState(response.data.enrollment && response.data.enrollment.paidAmount > 0 ? "allowed" : "blocked");
      })
      .catch(() => {
        // The API remains the final authority; do not strand an already authenticated user on a network blip.
        if (mounted) setState("allowed");
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (state === "loading") return <div className="page-loader">Checking enrollment access...</div>;
  if (state === "blocked") return <Navigate to={readPendingEnrollment() ? "/checkout" : "/programs"} replace />;
  return <>{children}</>;
}
