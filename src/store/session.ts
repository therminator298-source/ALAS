import type { User, Permission } from '@/types';
import { ROLE_PERMISSIONS } from '@/config/constants';

/**
 * Sesión mock temporal para desarrollar la UI antes de integrar el SSO real
 * del Launcher + Supabase Auth. Se reemplazará por un provider real en la fase
 * de seguridad. La autorización definitiva se valida SIEMPRE en backend.
 */
export const MOCK_USER: User = {
  // UUID real sembrado por db/schema.sql (David Espínola · SUPERVISOR_RECEPCION).
  // Permite que las RPCs SECURITY DEFINER validen permisos hasta integrar el SSO real.
  id: '29157828-c678-4181-b254-8fefe550190b',
  nombre: 'David Espínola',
  rol: 'SUPERVISOR_RECEPCION',
  activo: true,
};

export function useSession(): { user: User } {
  return { user: MOCK_USER };
}

export function can(user: User, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.rol]?.includes(permission) ?? false;
}
