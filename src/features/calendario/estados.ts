import { Clock, Loader, CheckCircle2, Warehouse, Factory, Building2, type LucideIcon } from 'lucide-react';

/**
 * Tokens visuales compartidos del Calendario. Antes vivían duplicados dentro de
 * CalendarioView y TareaFormModal; ahora la tarjeta móvil, la fila de escritorio
 * y el formulario leen exactamente los mismos colores e íconos.
 */

export type EstadoKey = 'pendiente' | 'en_curso' | 'hecho';

export const ESTADO_KEYS: EstadoKey[] = ['pendiente', 'en_curso', 'hecho'];

/** Etiqueta tal cual se guarda en la base (columna `estado`). */
export const ESTADO_LABEL: Record<EstadoKey, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  hecho: 'Hecho',
};

/** Ciclo al tocar el chip: Pendiente → En curso → Hecho → Pendiente. */
export const NEXT_ESTADO: Record<EstadoKey, EstadoKey> = {
  pendiente: 'en_curso',
  en_curso: 'hecho',
  hecho: 'pendiente',
};

export const PREV_ESTADO: Record<EstadoKey, EstadoKey> = {
  pendiente: 'hecho',
  en_curso: 'pendiente',
  hecho: 'en_curso',
};

export const EST_ICON: Record<EstadoKey, LucideIcon> = {
  pendiente: Clock,
  en_curso: Loader,
  hecho: CheckCircle2,
};

/** Chip suave (fondo claro + texto oscuro). */
export const CHIP: Record<EstadoKey, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_curso: 'bg-blue-100 text-blue-700',
  hecho: 'bg-emerald-100 text-emerald-700',
};

/** Franja lateral / punto de color. */
export const BAR: Record<EstadoKey, string> = {
  pendiente: 'bg-amber-400',
  en_curso: 'bg-blue-500',
  hecho: 'bg-emerald-500',
};

/** Sólido (fondo saturado + texto blanco) — botones activos y reveal del swipe. */
export const SOLID: Record<EstadoKey, string> = {
  pendiente: 'bg-amber-500 text-white',
  en_curso: 'bg-blue-600 text-white',
  hecho: 'bg-emerald-600 text-white',
};

export const EST_RING: Record<EstadoKey, string> = {
  pendiente: 'ring-amber-300/60',
  en_curso: 'ring-blue-300/60',
  hecho: 'ring-emerald-300/60',
};

export const EST_BADGE: Record<EstadoKey, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  en_curso: 'bg-blue-50 text-blue-700 border-blue-200',
  hecho: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const DEP_ICON: Record<string, LucideIcon> = {
  'Depósito Central': Warehouse,
  'Fábrica': Factory,
  'Depósito Luque Sanber': Building2,
};

/** Nombre corto para el segmentado del teléfono: los tres completos no entran
 *  en 360px y el texto se desbordaba fuera del botón. */
export const DEP_CORTO: Record<string, string> = {
  'Depósito Central': 'Central',
  'Fábrica': 'Fábrica',
  'Depósito Luque Sanber': 'Luque',
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DIAS_CORTO = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/* ── Helpers de fecha (una sola definición para todo el módulo) ── */
const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoOf(new Date());
export const dateOf = (iso: string) => new Date(`${iso}T00:00:00`);
export const fmtDay = (iso: string) =>
  dateOf(iso).toLocaleDateString('es-PY', { weekday: 'long', day: '2-digit', month: 'long' });
export const fmtDayShort = (iso: string) =>
  dateOf(iso).toLocaleDateString('es-PY', { weekday: 'short', day: '2-digit', month: 'short' });

export const reduceMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Normaliza para búsqueda: sin tildes, minúsculas. */
export const norm = (s: string | null | undefined) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
