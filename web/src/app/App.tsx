import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { ScrollToTopButton } from "../components/ScrollToTopButton";
import { AuthProvider } from "../features/auth/context/AuthContext";
import { DashboardPage } from "../pages/DashboardPage";
import { CoursePlayerPage } from "../pages/CoursePlayerPage";
import { EnrollmentCheckoutPage } from "../pages/EnrollmentCheckoutPage";
import { LandingPage } from "../pages/LandingPage";
import { OAuthCallbackPage } from "../pages/OAuthCallbackPage";
import { ProgramDetailsPage } from "../pages/ProgramDetailsPage";
import { ProfilePage } from "../pages/ProfilePage";
import {
  AboutPage,
  FeaturesPage,
  LoginPage,
  ProgramsPage,
  RequestCallbackPage
} from "../pages/PublicPages";
import { StudentOnboardingPage } from "../pages/StudentOnboardingPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HashScroll />
        <ScrollToTopButton />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-callback" element={<RequestCallbackPage />} />
          <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route path="/programs/:slug" element={<ProgramDetailsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning/:programId"
            element={
              <ProtectedRoute>
                <CoursePlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowIncompleteProfile>
                <EnrollmentCheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/onboarding"
            element={
              <ProtectedRoute allowIncompleteProfile>
                <StudentOnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowIncompleteProfile>
                <ProfilePage />
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
