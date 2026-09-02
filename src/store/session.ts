import type { User, Permission } from '@/types';
import { ROLE_PERMISSIONS } from '@/config/constants';

/**
 * Sesión mock temporal para desarrollar la UI antes de integrar el SSO real
 * del Launcher + Supabase Auth. Se reemplazará por un provider real en la fase
 * de seguridad. La autorización definitiva se valida SIEMPRE en backend.
 */
export const MOCK_USER: User = {
  id: 'mock-1',
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
