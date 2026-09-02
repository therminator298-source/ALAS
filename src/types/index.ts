// ============================================================
// Tipos de dominio — Incidencias de Recepción
// ============================================================

export type IncidentReason =
  | 'SOBRANTE'
  | 'FALTANTE'
  | 'AVERIADO'
  // Extensibles (sección 1):
  | 'PRODUCTO_INCORRECTO'
  | 'EMBALAJE_DANADO'
  | 'LOTE_INCORRECTO'
  | 'VENCIMIENTO'
  | 'DOCUMENTACION_INCORRECTA'
  | 'DIFERENCIA_PRECIO'
  | 'ERROR_PROVEEDOR'
  | 'MERCADERIA_RECHAZADA'
  | 'SIN_FACTURA'
  | 'OTRO';

export type IncidentStatus =
  | 'BORRADOR'
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'VERIFICADO'
  | 'EN_RESOLUCION'
  | 'TERMINADO'
  | 'RECHAZADO'
  | 'ANULADO'
  | 'BLOQUEADO';

export type IncidentPriority = 'BAJA' | 'NORMAL' | 'ALTA' | 'CRITICA';

export type VerificationResult = 'CONFIRMADA' | 'PARCIAL' | 'NO_CORRESPONDE';

export type ResolutionType =
  | 'REPOSICION'
  | 'NOTA_CREDITO'
  | 'DEVOLUCION'
  | 'AJUSTE_INVENTARIO'
  | 'ACEPTADO_DIFERENCIA'
  | 'REGULARIZACION_DOCUMENTAL'
  | 'PRODUCTO_RECUPERADO'
  | 'OTRO';

export type Role =
  | 'ADMIN'
  | 'JEFE_LOGISTICA'
  | 'SUPERVISOR_RECEPCION'
  | 'OPERADOR_RECEPCION'
  | 'COMPRAS'
  | 'AUDITOR';

export type Permission =
  | 'incident.create'
  | 'incident.read'
  | 'incident.update'
  | 'incident.delete'
  | 'incident.verify'
  | 'incident.resolve'
  | 'incident.close'
  | 'incident.reopen'
  | 'incident.assign'
  | 'incident.comment'
  | 'evidence.upload'
  | 'evidence.delete'
  | 'report.view'
  | 'report.export'
  | 'audit.view'
  | 'configuration.manage';

export interface User {
  id: string;
  nombre: string;
  rol: Role;
  activo: boolean;
  avatar_url?: string | null;
}

export interface Supplier {
  id: string;
  nombre: string;
  ruc?: string | null;
}

export interface Product {
  id: string;
  codigo: string;
  descripcion: string;
  ean?: string | null;
  sku?: string | null;
  um: string;
}

export interface Warehouse {
  id: string;
  nombre: string;
  codigo?: string | null;
}

export interface IncidentItem {
  id: string;
  incident_id: string;
  product_id: string | null;
  codigo: string;
  descripcion: string;
  expected_qty: number;
  received_qty: number;
  affected_qty: number;
  difference_qty: number;
  unit: string;
  lot?: string | null;
  observation?: string | null;
}

export interface Incident {
  id: string;
  incident_number: string; // INC-2026-000196
  document_number?: string | null;
  invoice_number?: string | null;
  supplier_id: string | null;
  supplier_nombre?: string | null;
  warehouse_id: string | null;
  reason: IncidentReason;
  status: IncidentStatus;
  priority: IncidentPriority;
  description?: string | null;
  created_by: string;
  created_by_nombre?: string | null;
  assigned_to?: string | null;
  assigned_to_nombre?: string | null;
  emission_date: string; // ISO
  created_at: string;
  updated_at: string;
  verified_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  deleted_at?: string | null;
  items_count?: number;
  affected_units?: number;
  evidences_count?: number;
  items?: IncidentItem[];
}

export interface StatusHistoryEntry {
  id: string;
  incident_id: string;
  from_status: IncidentStatus | null;
  to_status: IncidentStatus;
  user_id: string;
  user_nombre: string;
  comment?: string | null;
  created_at: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  user_nombre: string;
  body: string;
  created_at: string;
}

export interface IncidentEvidence {
  id: string;
  incident_id: string;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  uploaded_by_nombre: string;
  comment?: string | null;
  created_at: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VERIFY'
  | 'ASSIGN'
  | 'STATUS_CHANGE'
  | 'COMMENT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'EXPORT'
  | 'PDF_GENERATED'
  | 'PDF_PRINTED'
  | 'PDF_DOWNLOADED'
  | 'LOGIN'
  | 'LOGOUT';

export interface AuditLog {
  audit_id: string;
  created_at: string;
  user_id: string;
  user_nombre: string;
  rol: Role;
  action: AuditAction;
  module: string;
  incident_id?: string | null;
  record?: string | null;
  old_value?: unknown;
  new_value?: unknown;
  ip?: string | null;
  user_agent?: string | null;
}
