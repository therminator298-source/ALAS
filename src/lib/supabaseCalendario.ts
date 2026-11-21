import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Cliente Supabase del apartado Calendario de tareas.
 *
 * Por defecto reusa el cliente principal: hoy la tabla `tareas` vive en el
 * mismo proyecto que Incidencias y Acuses, y abrir un segundo cliente contra
 * la misma URL solo duplica conexiones. Si alguna vez el Calendario se muda a
 * un proyecto aparte, basta con cargar sus dos variables y lo toma de ahi.
 * Sin ninguna de las dos cosas queda null y el apartado corre con datos mock.
 *
 * Variables (.env / Vercel), opcionales:
 *   VITE_CAL_SUPABASE_URL
 *   VITE_CAL_SUPABASE_ANON_KEY
 */
const url = import.meta.env.VITE_CAL_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_CAL_SUPABASE_ANON_KEY as string | undefined;

export const supabaseCal = url && anonKey ? createClient(url, anonKey) : supabase;
export const isCalReady = Boolean(supabaseCal);
