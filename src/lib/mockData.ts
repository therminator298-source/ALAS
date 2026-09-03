import type { Incident } from '@/types';

/**
 * Datos de demostración para desarrollar la UI antes de conectar Supabase.
 * Se elimina cuando entren los servicios reales. NO usar en producción.
 */
const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1', incident_number: 'INC-2026-000196', document_number: '019', invoice_number: '4300195182',
    supplier_id: 's1', supplier_nombre: 'ORION S.R.L.', warehouse_id: 'w1',
    reason: 'SOBRANTE', status: 'PENDIENTE', priority: 'NORMAL',
    description: 'Se recibieron unidades de más en la última recepción.',
    created_by: 'u1', created_by_nombre: 'David Espínola', assigned_to: null,
    emission_date: hoursAgo(3), created_at: hoursAgo(3), updated_at: hoursAgo(3),
    items_count: 1, affected_units: 20, evidences_count: 3,
  },
  {
    id: '2', incident_number: 'INC-2026-000191', document_number: '017', invoice_number: '4300194771',
    supplier_id: 's2', supplier_nombre: 'ZR DISTRIBUIDORA', warehouse_id: 'w1',
    reason: 'AVERIADO', status: 'EN_REVISION', priority: 'ALTA',
    created_by: 'u2', created_by_nombre: 'José Villalba', assigned_to: 'u3', assigned_to_nombre: 'Supervisor Recepción',
    emission_date: hoursAgo(52), created_at: hoursAgo(52), updated_at: hoursAgo(20),
    items_count: 2, affected_units: 8, evidences_count: 2,
  },
  {
    id: '3', incident_number: 'INC-2026-000188', document_number: '015', invoice_number: '4300194120',
    supplier_id: 's3', supplier_nombre: 'ATLANTIC S.A.E.', warehouse_id: 'w2',
    reason: 'FALTANTE', status: 'EN_RESOLUCION', priority: 'CRITICA',
    created_by: 'u1', created_by_nombre: 'David Espínola', assigned_to: 'u4', assigned_to_nombre: 'Compras',
    emission_date: hoursAgo(78), created_at: hoursAgo(78), updated_at: hoursAgo(6),
    items_count: 3, affected_units: 40, evidences_count: 1,
  },
  {
    id: '4', incident_number: 'INC-2026-000180', document_number: '012', invoice_number: '4300193004',
    supplier_id: 's1', supplier_nombre: 'ORION S.R.L.', warehouse_id: 'w1',
    reason: 'SOBRANTE', status: 'TERMINADO', priority: 'BAJA',
    created_by: 'u2', created_by_nombre: 'José Villalba', assigned_to: 'u3', assigned_to_nombre: 'Supervisor Recepción',
    emission_date: hoursAgo(120), created_at: hoursAgo(120), updated_at: hoursAgo(90),
    verified_at: hoursAgo(100), resolved_at: hoursAgo(92), closed_at: hoursAgo(90),
    items_count: 1, affected_units: 5, evidences_count: 2,
  },
  {
    id: '5', incident_number: 'INC-2026-000175', document_number: '009', invoice_number: '4300192550',
    supplier_id: 's4', supplier_nombre: 'FORTLEV INDUSTRIA', warehouse_id: 'w2',
    reason: 'FALTANTE', status: 'VERIFICADO', priority: 'NORMAL',
    created_by: 'u1', created_by_nombre: 'David Espínola', assigned_to: 'u3', assigned_to_nombre: 'Supervisor Recepción',
    emission_date: hoursAgo(30), created_at: hoursAgo(30), updated_at: hoursAgo(10), verified_at: hoursAgo(10),
    items_count: 1, affected_units: 12, evidences_count: 4,
  },
];
