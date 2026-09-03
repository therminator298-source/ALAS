import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

/**
 * Lista los usuarios activos del módulo (para asignaciones, filtros, etc.).
 * En modo demo (sin Supabase) devuelve vacío: la UI cae a sus mocks.
 */
export async function listUsers(): Promise<User[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('users')
    .select('id,nombre,rol,activo')
    .eq('activo', true)
    .order('nombre');
  return (data as User[]) ?? [];
}

/**
 * Aprovisiona (upsert) al usuario autenticado por el SSO del Launcher en la tabla
 * `users` local, usando su MISMO id. Es lo que permite que el módulo "lea los
 * usuarios" desde la fuente de verdad (el Launcher) igual que los demás módulos:
 * sin esta fila, user_has_permission(p_actor) falla y toda escritura da 42501.
 *
 * No lanza: si Supabase no está configurado (modo demo) o el RPC no existe todavía,
 * simplemente no hace nada y deja que la app siga en su flujo normal.
 */
export async function ensureCurrentUser(user: User): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('ensure_user', {
      p_id: user.id,
      p_nombre: user.nombre,
      p_rol: user.rol,
    });
    if (error) {
      console.warn('[users] ensure_user no disponible:', error.message);
      return null;
    }
    return (data as User) ?? null;
  } catch (e) {
    console.warn('[users] ensure_user fallo:', (e as Error).message);
    return null;
  }
}
