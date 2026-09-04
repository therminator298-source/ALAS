import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase DEDICADO del apartado Calendario de tareas (proyecto aparte).
 * Usa SOLO la anon key. Si faltan las variables, queda null y el apartado corre
 * en modo demo (datos mock).
 *
 * Variables (.env / Vercel):
 *   VITE_CAL_SUPABASE_URL
 *   VITE_CAL_SUPABASE_ANON_KEY
 */
const url = import.meta.env.VITE_CAL_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_CAL_SUPABASE_ANON_KEY as string | undefined;

export const supabaseCal = url && anonKey ? createClient(url, anonKey) : null;
export const isCalReady = Boolean(supabaseCal);
