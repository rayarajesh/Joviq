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
import { ProgramsPage } from "../pages/ProgramsPage";
import { ProgramDetailsPage } from "../pages/ProgramDetailsPage";
import { ProfilePage } from "../pages/ProfilePage";
import {
  AboutPage,
  FeaturesPage,
  LoginPage,
  VerifyCertificatePage,
  RequestCallbackPage,
} from "../pages/PublicPages";
import { StudentOnboardingPage } from "../pages/StudentOnboardingPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { StudentPreviewPage } from "../pages/StudentPreviewPage";
import { PrivacyPolicyPage } from "../pages/PrivacyPolicyPage";
import { TermsPage } from "../pages/TermsPage";
import { RefundPolicyPage } from "../pages/RefundPolicyPage";
import { CampusDelegatePage } from "../pages/CampusDelegatePage";
import { CampusPartnersPage } from "../pages/CampusPartnersPage";
import { CareersPage } from "../pages/CareersPage";
import { ReviewsPage } from "../pages/ReviewsPage";
import { CompanyInformationPage } from "../pages/CompanyInformationPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HashScroll />
        <ScrollToTopButton />
        <Routes>
          {import.meta.env.DEV && (
            <Route
              path="/dev/student-dashboard"
              element={<StudentPreviewPage />}
            />
          )}
          <Route path="/" element={<LandingPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/company-information" element={<CompanyInformationPage />} />
          <Route path="/campus-delegate" element={<CampusDelegatePage />} />
          <Route path="/campus-partners" element={<CampusPartnersPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/return-policy" element={<RefundPolicyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/verify/:certificateId"
            element={<VerifyCertificatePage />}
          />
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
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.pathname, location.hash]);

  return null;
}
