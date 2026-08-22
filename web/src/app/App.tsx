import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "../features/auth/context/AuthContext";
import { DashboardPage } from "../pages/DashboardPage";
import { LandingPage } from "../pages/LandingPage";
import { ProgramDetailsPage } from "../pages/ProgramDetailsPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HashScroll />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/programs/:slug" element={<ProgramDetailsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function HashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.pathname, location.hash]);

  return null;
}
