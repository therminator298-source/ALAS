import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Cliente Supabase del apartado Acuses.
 *
 * Por defecto reusa el cliente principal: la tabla `acuses` vive en el mismo
 * proyecto que `incidents`, y un segundo cliente contra la misma URL solo
 * duplica conexiones. Si alguna vez Acuses se muda a un proyecto aparte,
 * basta con cargar sus dos variables y lo toma de ahi. Sin ninguna de las dos
 * cosas queda null y el apartado corre con datos de ejemplo.
 *
 * Variables (.env / Vercel), opcionales:
 *   VITE_ACUSE_SUPABASE_URL
 *   VITE_ACUSE_SUPABASE_ANON_KEY
 */
const url = import.meta.env.VITE_ACUSE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_ACUSE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseAcuse = url && anonKey ? createClient(url, anonKey) : supabase;
export const isAcuseReady = Boolean(supabaseAcuse);
