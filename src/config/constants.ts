import type {
  IncidentReason,
  IncidentStatus,
  IncidentPriority,
  Role,
  Permission,
} from '@/types';

// ============================================================
// Empresa (para PDF / encabezados) — sección PDF del spec
// ============================================================
export const COMPANY = {
  name: 'ALAS',
  branch: 'CASA CENTRAL',
  address: 'Marino del Valle c/ Cañada del Carmen',
  city: 'Luque, Paraguay',
  phone: '(595-21) 593 000',
} as const;

export const APP_NAME = 'Incidencias de Recepción';

// ============================================================
// Motivos de incidencia
// ============================================================
export const REASON_LABELS: Record<IncidentReason, string> = {
  SOBRANTE: 'Sobrante',
  FALTANTE: 'Faltante',
  AVERIADO: 'Averiado',
  PRODUCTO_INCORRECTO: 'Producto incorrecto',
  EMBALAJE_DANADO: 'Embalaje dañado',
  LOTE_INCORRECTO: 'Lote incorrecto',
  VENCIMIENTO: 'Vencimiento',
  DOCUMENTACION_INCORRECTA: 'Documentación incorrecta',
  DIFERENCIA_PRECIO: 'Diferencia de precio',
  ERROR_PROVEEDOR: 'Error de proveedor',
  MERCADERIA_RECHAZADA: 'Mercadería rechazada',
  SIN_FACTURA: 'Sin factura',
  OTRO: 'Otro',
};

/** Motivos primarios que se muestran como tarjetas en "Nueva incidencia". */
export const PRIMARY_REASONS: IncidentReason[] = ['SOBRANTE', 'FALTANTE', 'AVERIADO'];

// Clases Tailwind por motivo (texto / fondo suave / borde)
export const REASON_STYLES: Record<string, { text: string; soft: string; ring: string; dot: string }> = {
  SOBRANTE: { text: 'text-sobrante', soft: 'bg-sobrante/10', ring: 'ring-sobrante/30', dot: 'bg-sobrante' },
  FALTANTE: { text: 'text-faltante', soft: 'bg-faltante/10', ring: 'ring-faltante/30', dot: 'bg-faltante' },
  AVERIADO: { text: 'text-averiado', soft: 'bg-averiado/10', ring: 'ring-averiado/30', dot: 'bg-averiado' },
};

// ============================================================
// Estados
// ============================================================
export const STATUS_LABELS: Record<IncidentStatus, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  VERIFICADO: 'Verificado',
  EN_RESOLUCION: 'En resolución',
  TERMINADO: 'Terminado',
  RECHAZADO: 'Rechazado',
  ANULADO: 'Anulado',
  BLOQUEADO: 'Bloqueado',
};

export const STATUS_STYLES: Record<IncidentStatus, { text: string; soft: string; dot: string }> = {
  BORRADOR: { text: 'text-ink-3', soft: 'bg-surface-3', dot: 'bg-ink-3' },
  PENDIENTE: { text: 'text-pendiente', soft: 'bg-pendiente/10', dot: 'bg-pendiente' },
  EN_REVISION: { text: 'text-revision', soft: 'bg-revision/10', dot: 'bg-revision' },
  VERIFICADO: { text: 'text-brand', soft: 'bg-brand/10', dot: 'bg-brand' },
  EN_RESOLUCION: { text: 'text-averiado', soft: 'bg-averiado/10', dot: 'bg-averiado' },
  TERMINADO: { text: 'text-terminado', soft: 'bg-terminado/10', dot: 'bg-terminado' },
  RECHAZADO: { text: 'text-faltante', soft: 'bg-faltante/10', dot: 'bg-faltante' },
  ANULADO: { text: 'text-ink-3', soft: 'bg-surface-3', dot: 'bg-ink-3' },
  BLOQUEADO: { text: 'text-critical', soft: 'bg-critical/10', dot: 'bg-critical' },
};

/**
 * Transiciones permitidas del workflow (sección 2). La validación real vive
 * server-side en las RPC; esto guía la UI (qué botones mostrar).
 */
export const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  BORRADOR: ['PENDIENTE', 'ANULADO'],
  PENDIENTE: ['EN_REVISION', 'RECHAZADO', 'ANULADO'],
  EN_REVISION: ['VERIFICADO', 'PENDIENTE'],
  VERIFICADO: ['EN_RESOLUCION', 'EN_REVISION'], // "devuelto a revisión"
  EN_RESOLUCION: ['TERMINADO', 'BLOQUEADO'],
  BLOQUEADO: ['EN_RESOLUCION'],
  TERMINADO: ['PENDIENTE'], // "reabrir" — solo autorizados
  RECHAZADO: [],
  ANULADO: [],
};

// ============================================================
// Prioridad
// ============================================================
export const PRIORITY_LABELS: Record<IncidentPriority, string> = {
  BAJA: 'Baja',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const PRIORITY_STYLES: Record<IncidentPriority, { text: string; soft: string; dot: string }> = {
  BAJA: { text: 'text-ink-3', soft: 'bg-surface-3', dot: 'bg-ink-3' },
  NORMAL: { text: 'text-ink-2', soft: 'bg-surface-3', dot: 'bg-ink-2' },
  ALTA: { text: 'text-averiado', soft: 'bg-averiado/10', dot: 'bg-averiado' },
  CRITICA: { text: 'text-critical', soft: 'bg-critical/10', dot: 'bg-critical' },
};

// ============================================================
// SLA / antigüedad (sección 23) — horas
// ============================================================
export const SLA_THRESHOLDS = {
  normalMax: 24,
  warningMax: 48,
  highMax: 72,
} as const;

// ============================================================
// Etiquetas de rol
// ============================================================
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  JEFE_LOGISTICA: 'Jefe de Logística',
  SUPERVISOR_RECEPCION: 'Supervisor de Recepción',
  OPERADOR_RECEPCION: 'Operador de Recepción',
  COMPRAS: 'Compras',
  AUDITOR: 'Auditor',
};

// ============================================================
// Matriz de permisos RBAC (secciones 33/34)
// La autorización real se valida también en backend (RLS/RPC).
// ============================================================
const ALL_PERMISSIONS: Permission[] = [
  'incident.create', 'incident.read', 'incident.update', 'incident.delete',
  'incident.verify', 'incident.resolve', 'incident.close', 'incident.reopen',
  'incident.assign', 'incident.comment', 'evidence.upload', 'evidence.delete',
  'report.view', 'report.export', 'audit.view', 'configuration.manage',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [...ALL_PERMISSIONS],
  JEFE_LOGISTICA: [
    'incident.read', 'incident.update', 'incident.verify', 'incident.resolve',
    'incident.close', 'incident.reopen', 'incident.assign', 'incident.comment',
    'evidence.upload', 'report.view', 'report.export', 'audit.view',
  ],
  SUPERVISOR_RECEPCION: [
    'incident.create', 'incident.read', 'incident.update', 'incident.verify',
    'incident.assign', 'incident.comment', 'evidence.upload', 'report.view',
  ],
  OPERADOR_RECEPCION: [
    'incident.create', 'incident.read', 'incident.comment', 'evidence.upload',
  ],
  COMPRAS: [
    'incident.read', 'incident.comment', 'report.view',
  ],
  AUDITOR: [
    'incident.read', 'report.view', 'report.export', 'audit.view',
  ],
};
