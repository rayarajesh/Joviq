import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useAuth } from "../features/auth/context/useAuth";
import { normalizeOAuthReturnUrl, notifyOAuthPopupOpener } from "../features/auth/oauthPopup";

export function OAuthCallbackPage() {
  const { clearAuth, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [isPopupComplete, setIsPopupComplete] = useState(false);

  useEffect(() => {
    const returnUrl = normalizeOAuthReturnUrl(searchParams.get("returnUrl"));

    if (error) {
      clearAuth();
      if (notifyOAuthPopupOpener({ status: "error", error, returnUrl })) {
        setIsPopupComplete(true);
        window.setTimeout(() => window.close(), 100);
      }
      return;
    }

    let mounted = true;

    refresh()
      .then(() => {
        if (mounted) {
          if (notifyOAuthPopupOpener({ status: "success", returnUrl })) {
            setIsPopupComplete(true);
            window.setTimeout(() => window.close(), 100);
            return;
          }

          navigate(returnUrl, { replace: true });
        }
      })
      .catch(() => {
        if (mounted) {
          const message = "We could not finish the Google sign-in. Please try again.";
          clearAuth();
          if (notifyOAuthPopupOpener({ status: "error", error: message, returnUrl })) {
            setIsPopupComplete(true);
            window.setTimeout(() => window.close(), 100);
            return;
          }

          setError(message);
        }
      });

    return () => {
      mounted = false;
    };
  }, [clearAuth, error, navigate, refresh, searchParams]);

  if (isPopupComplete) {
    return (
      <main className="page-loader">
        <span className="oauth-callback__loader">
          <LoaderCircle size={20} />
          Returning to Joviq...
        </span>
      </main>
    );
  }

  if (error) {
    return (
      <main className="oauth-callback">
        <section>
          <AlertCircle size={28} />
          <h1>Google sign-in failed</h1>
          <p>{error}</p>
          <Link to="/login">Back to login</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-loader">
      <span className="oauth-callback__loader">
        <LoaderCircle size={20} />
        Finishing Google sign-in...
      </span>
    </main>
  );
}
