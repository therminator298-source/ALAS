import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase DEDICADO del apartado Acuses (proyecto aparte del de
 * Incidencias). Usa SOLO la anon key. Si faltan las variables, queda null y
 * el apartado corre en modo demo (datos mock) para desarrollar la UI.
 *
 * Variables (.env / Vercel):
 *   VITE_ACUSE_SUPABASE_URL
 *   VITE_ACUSE_SUPABASE_ANON_KEY
 */
const url = import.meta.env.VITE_ACUSE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_ACUSE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseAcuse = url && anonKey ? createClient(url, anonKey) : null;
export const isAcuseReady = Boolean(supabaseAcuse);
