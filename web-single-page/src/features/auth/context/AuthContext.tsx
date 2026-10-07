import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/authApi";
import type { AuthTokenResponse, UserSummary } from "../api/authTypes";
import { setUnauthorizedHandler, tokenStore } from "../../../lib/api/httpClient";

let refreshInFlight: Promise<AuthTokenResponse> | null = null;

type AuthContextValue = {
  user: UserSummary | null;
  isBooting: boolean;
  applyAuthResponse: (response: AuthTokenResponse) => void;
  loadMe: () => Promise<UserSummary>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Same session model as /web: in-memory access token, refresh cookie owned by the API. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  const clearAuth = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const applyAuthResponse = useCallback((response: AuthTokenResponse) => {
    if (response.accessToken) tokenStore.set(response.accessToken);
    if (response.user) setUser(response.user);
  }, []);

  const refresh = useCallback(async () => {
    refreshInFlight ??= authApi
      .refresh()
      .then((response) => {
        applyAuthResponse(response.data);
        return response.data;
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  }, [applyAuthResponse]);

  const loadMe = useCallback(async () => {
    const response = await authApi.me();
    setUser(response.data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      try {
        return (await refresh()).accessToken ?? null;
      } catch {
        clearAuth();
        return null;
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [clearAuth, refresh]);

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch(() => {
        if (mounted) clearAuth();
      })
      .finally(() => {
        if (mounted) setIsBooting(false);
      });
    return () => {
      mounted = false;
    };
  }, [clearAuth, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isBooting, applyAuthResponse, loadMe, logout }),
    [user, isBooting, applyAuthResponse, loadMe, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
