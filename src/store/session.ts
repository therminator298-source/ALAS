import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ROLE_PERMISSIONS } from '@/config/constants';
import {
  LAUNCHER_URL,
  MODULE_KEY,
  clearAlasSession,
  goToLauncher as navigateToLauncher,
  hasModulePermission,
  mapSsoRole,
  requireAlasSso,
  resolveAlasSession,
  type AlasSsoPayload,
  type SessionSource,
} from '@/lib/alasSso';
import type { Permission, User } from '@/types';

type SessionError = 'NO_SESSION' | 'NO_PERMISSION' | 'INVALID_SESSION' | null;

interface SessionContextValue {
  user: User;
  loading: boolean;
  source: SessionSource;
  error: SessionError;
  isAuthenticated: boolean;
  requireSso: boolean;
  launcherUrl: string;
  moduleKey: string;
  ssoPayload: AlasSsoPayload | null;
  signOut: () => void;
  goToLauncher: () => void;
}

declare global {
  interface Window {
    AlasAuthClient?: {
      isAuthenticated: boolean;
      user?: AlasSsoPayload;
      getCurrentUser?: () => string;
      getUserId?: () => string;
      getRole?: () => string;
      hasPermission?: (key: string) => boolean;
      logout?: () => void;
      auditAction?: (action: string, detail?: string) => void;
    };
    __alasAuthReady?: Promise<void>;
  }
}

export const DEMO_USER: User = {
  id: '29157828-c678-4181-b254-8fefe550190b',
  nombre: 'David Espinola',
  rol: 'SUPERVISOR_RECEPCION',
  activo: true,
};

const REQUIRE_SSO = requireAlasSso();
const SessionContext = createContext<SessionContextValue | null>(null);

function userFromPayload(payload: AlasSsoPayload): User {
  return {
    id: payload.userId,
    nombre: payload.name,
    rol: mapSsoRole(payload.role),
    activo: true,
  };
}

function installGlobalClient(payload: AlasSsoPayload | null, logout: () => void): void {
  if (!payload) {
    window.AlasAuthClient = {
      isAuthenticated: false,
      logout,
    };
    return;
  }

  window.AlasAuthClient = {
    isAuthenticated: true,
    user: payload,
    getCurrentUser: () => payload.name || payload.email || 'Usuario ALAS',
    getUserId: () => payload.userId,
    getRole: () => payload.role,
    hasPermission: (key) => payload.permissions.includes(key),
    logout,
    auditAction: (action, detail) => {
      if (import.meta.env.DEV) {
        console.info(`[ALAS AUDIT] ${action} | ${payload.name} | ${detail ?? ''}`);
      }
    },
  };
}

function fallbackSession(): SessionContextValue {
  return {
    user: DEMO_USER,
    loading: false,
    source: 'demo',
    error: null,
    isAuthenticated: false,
    requireSso: REQUIRE_SSO,
    launcherUrl: LAUNCHER_URL,
    moduleKey: MODULE_KEY,
    ssoPayload: null,
    signOut: navigateToLauncher,
    goToLauncher: navigateToLauncher,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(DEMO_USER);
  const [ssoPayload, setSsoPayload] = useState<AlasSsoPayload | null>(null);
  const [source, setSource] = useState<SessionSource>('demo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SessionError>(null);

  const signOut = useCallback(() => {
    clearAlasSession();
    installGlobalClient(null, () => navigateToLauncher());
    navigateToLauncher();
  }, []);

  useEffect(() => {
    let alive = true;
    const ready = resolveAlasSession()
      .then((payload) => {
        if (!alive) return;

        if (payload) {
          setSsoPayload(payload);
          setUser(userFromPayload(payload));
          setSource('launcher');
          setError(hasModulePermission(payload) ? null : 'NO_PERMISSION');
          return;
        }

        setSsoPayload(null);
        setSource('demo');
        setUser(DEMO_USER);
        setError(REQUIRE_SSO ? 'NO_SESSION' : null);
      })
      .catch(() => {
        if (!alive) return;
        setSsoPayload(null);
        setSource('demo');
        setUser(DEMO_USER);
        setError(REQUIRE_SSO ? 'INVALID_SESSION' : null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    window.__alasAuthReady = ready.then(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    installGlobalClient(ssoPayload, signOut);
  }, [ssoPayload, signOut]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      source,
      error,
      isAuthenticated: !!ssoPayload,
      requireSso: REQUIRE_SSO,
      launcherUrl: LAUNCHER_URL,
      moduleKey: MODULE_KEY,
      ssoPayload,
      signOut,
      goToLauncher: navigateToLauncher,
    }),
    [error, loading, signOut, source, ssoPayload, user],
  );

  return createElement(SessionContext.Provider, { value }, children);
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext) ?? fallbackSession();
}

export function can(user: User, permission: Permission): boolean {
  if (!user.activo) return false;
  return ROLE_PERMISSIONS[user.rol]?.includes(permission) ?? false;
}
