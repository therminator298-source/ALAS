import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Cliente Supabase. Usa SOLO la anon key (jamás la clave de servicio en el front).
 * Si faltan las variables, `supabase` queda null y la app corre en modo demo
 * (datos mock) para poder desarrollar la UI antes de tener el proyecto real.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseReady = Boolean(supabase);
