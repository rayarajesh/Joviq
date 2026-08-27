import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useAuth } from "../features/auth/context/useAuth";
import { normalizeOAuthReturnUrl } from "../features/auth/oauthPopup";

export function OAuthCallbackPage() {
  const { clearAuth, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get("error"));

  useEffect(() => {
    const returnUrl = normalizeOAuthReturnUrl(searchParams.get("returnUrl"));

    if (error) {
      clearAuth();
      return;
    }

    let mounted = true;

    refresh()
      .then(() => {
        if (mounted) {
          navigate(returnUrl, { replace: true });
        }
      })
      .catch(() => {
        if (mounted) {
          const message = "We could not finish the Google sign-in. Please try again.";
          clearAuth();
          setError(message);
        }
      });

    return () => {
      mounted = false;
    };
  }, [clearAuth, error, navigate, refresh, searchParams]);

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
