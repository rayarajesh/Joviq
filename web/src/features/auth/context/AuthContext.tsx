import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/authApi";
import type { AuthTokenResponse, UserSummary } from "../api/authTypes";
import {
  setUnauthorizedHandler,
  tokenStore,
} from "../../../lib/api/httpClient";

let refreshInFlight: Promise<AuthTokenResponse> | null = null;

type AuthContextValue = {
  accessToken: string | null;
  user: UserSummary | null;
  isBooting: boolean;
  applyAuthResponse: (response: AuthTokenResponse) => void;
  refresh: () => Promise<AuthTokenResponse>;
  loadMe: () => Promise<UserSummary>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearAuth: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  const clearAuth = useCallback(() => {
    tokenStore.set(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  const applyAuthResponse = useCallback((response: AuthTokenResponse) => {
    if (response.accessToken) {
      tokenStore.set(response.accessToken);
      setAccessToken(response.accessToken);
    }

    if (response.user) {
      setUser(response.user);
    }
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

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      try {
        const response = await refresh();
        return response.accessToken ?? null;
      } catch {
        clearAuth();
        return null;
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [clearAuth, refresh]);

  useEffect(() => {
    if (
      window.location.pathname === "/auth/google/callback" ||
      window.location.pathname === "/auth/callback"
    ) {
      setIsBooting(false);
      return;
    }

    let mounted = true;

    if (window.location.pathname === "/login") {
      setIsBooting(false);
      return () => {
        mounted = false;
      };
    }

    refresh()
      .catch(() => {
        if (mounted) {
          clearAuth();
        }
      })
      .finally(() => {
        if (mounted) {
          setIsBooting(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [clearAuth, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isBooting,
      applyAuthResponse,
      refresh,
      loadMe,
      logout,
      logoutAll,
      clearAuth,
    }),
    [
      accessToken,
      user,
      isBooting,
      applyAuthResponse,
      refresh,
      loadMe,
      logout,
      logoutAll,
      clearAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
