import type { Role } from '@/types';

export interface AlasSsoPayload {
  userId: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp: number;
}

export type SessionSource = 'launcher' | 'demo';

const SESSION_KEY = 'alas.sso.session';
const CURRENT_USER_KEY = 'alas.current_user';
const LEGACY_USER_KEY = 'acuse.currentUser';
const DEFAULT_LAUNCHER_URL = 'https://launcher-tawny.vercel.app';
const DEFAULT_VERIFY_URL = 'https://xkgumqztscqcwamtimuh.supabase.co/functions/v1/verify-sso-token';
const DEFAULT_VERIFY_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZ3VtcXp0c2NxY3dhbXRpbXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDc0MjEsImV4cCI6MjA5NTg4MzQyMX0.ncD9XUgR6VDhKiShPAwdNgp3tRoKWIlt4JFEq8audX8';

export const MODULE_KEY = import.meta.env.VITE_ALAS_MODULE_KEY ?? 'calendario';
export const LAUNCHER_URL = import.meta.env.VITE_LAUNCHER_URL ?? DEFAULT_LAUNCHER_URL;

const VERIFY_URL = import.meta.env.VITE_ALAS_SSO_VERIFY_URL ?? DEFAULT_VERIFY_URL;
const VERIFY_ANON = import.meta.env.VITE_ALAS_SSO_VERIFY_ANON_KEY ?? DEFAULT_VERIFY_ANON;

export function requireAlasSso(): boolean {
  const configured = import.meta.env.VITE_REQUIRE_ALAS_SSO;
  if (configured === 'true') return true;
  if (configured === 'false') return false;
  return import.meta.env.PROD;
}

function asString(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizePayload(value: unknown): AlasSsoPayload | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const userId = asString(raw.userId);
  const name = asString(raw.name || raw.email);
  const role = asString(raw.role || 'operador');
  const exp = Number(raw.exp || 0);
  const permissions = Array.isArray(raw.permissions)
    ? raw.permissions.map((item) => asString(item)).filter(Boolean)
    : [];

  if (!userId || !name || !Number.isFinite(exp) || Date.now() > exp) return null;

  return {
    userId,
    name,
    email: asString(raw.email) || undefined,
    role,
    permissions,
    iat: Number.isFinite(Number(raw.iat)) ? Number(raw.iat) : undefined,
    exp,
  };
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadStoredAlasSession(): AlasSsoPayload | null {
  const storage = safeStorage();
  if (!storage) return null;

  try {
    const payload = normalizePayload(JSON.parse(storage.getItem(SESSION_KEY) || 'null'));
    if (!payload) storage.removeItem(SESSION_KEY);
    return payload;
  } catch {
    storage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveAlasSession(payload: AlasSsoPayload): void {
  const storage = safeStorage();
  if (!storage) return;

  storage.setItem(SESSION_KEY, JSON.stringify(payload));
  storage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: payload.name, role: payload.role }));
  storage.setItem(LEGACY_USER_KEY, payload.name);
}

export function clearAlasSession(): void {
  const storage = safeStorage();
  if (!storage) return;

  storage.removeItem(SESSION_KEY);
  storage.removeItem(CURRENT_USER_KEY);
  storage.removeItem(LEGACY_USER_KEY);
}

function readTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('alas_token');
  if (!token) return null;

  url.searchParams.delete('alas_token');
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', cleanUrl);
  return token;
}

async function verifyToken(token: string): Promise<AlasSsoPayload | null> {
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: VERIFY_ANON,
        Authorization: `Bearer ${VERIFY_ANON}`,
      },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) return null;

    const result = await response.json() as { valid?: boolean; payload?: unknown };
    return result.valid ? normalizePayload(result.payload) : null;
  } catch {
    return null;
  }
}

export async function resolveAlasSession(): Promise<AlasSsoPayload | null> {
  const token = readTokenFromUrl();
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      saveAlasSession(payload);
      return payload;
    }
  }

  return loadStoredAlasSession();
}

export function hasModulePermission(payload: AlasSsoPayload, moduleKey = MODULE_KEY): boolean {
  return payload.permissions.includes(moduleKey);
}

export function buildLauncherUrl(): string {
  const next = `${window.location.pathname}${window.location.search}`;
  const url = new URL(LAUNCHER_URL, window.location.origin);
  if (next && next !== '/') url.searchParams.set('next', next);
  return url.toString();
}

export function goToLauncher(): void {
  window.location.assign(buildLauncherUrl());
}

export function mapSsoRole(value: unknown): Role {
  const role = asString(value).toLowerCase();
  if (role === 'admin' || role === 'administrador') return 'ADMIN';
  if (role === 'supervisor' || role === 'jefe_logistica') return 'SUPERVISOR_RECEPCION';
  if (role === 'compras') return 'COMPRAS';
  if (role === 'auditor' || role === 'invitado') return 'AUDITOR';
  return 'OPERADOR_RECEPCION';
}
