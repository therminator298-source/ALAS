import { supabaseAcuse, isAcuseReady } from '@/lib/supabaseAcuse';
import type {
  AcuseRow, AcuseDashboard, AcuseFilters, AcuseSummary, AcuseFull, AcuseHistorial,
  Repartidor, ClienteCat, ArticuloCat, AcuseDetalle,
} from './types';
import { estadoKey } from './types';

export interface NewAcuseInput {
  cod_cliente: string; cliente_nombre?: string | null; cliente_ruc?: string | null;
  cliente_direccion?: string | null; cliente_ciudad?: string | null; cliente_telefono?: string | null;
  zona?: string | null; estado: string; fecha_emision: string; fecha_entrega?: string | null;
  repartidor_id: number | null; repartidor_nombre?: string | null; observacion?: string | null;
  usuario?: string | null; detalles: AcuseDetalle[];
}

const PAGE = 25;

/* ─────────────────────────── DEMO (mock) ─────────────────────────── */
const MOCK_REPART: Repartidor[] = [
  { id: 1, codigo: 'R01', nombre: 'Amilcar García', activo: true },
  { id: 2, codigo: 'R02', nombre: 'Jonathan Peralta', activo: true },
  { id: 3, codigo: 'R03', nombre: 'Lisandro López', activo: true },
];
function mockAcuses(): AcuseRow[] {
  const hoy = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const mk = (i: number, estado: string, dOff: number, rep: Repartidor): AcuseRow => ({
    id: i,
    nro_acuse: `AC-${String(i).padStart(4, '0')}`,
    cod_cliente: `C${1000 + i}`,
    cliente_nombre: ['ATLANTIC S.A.E.', 'ZR DISTRIBUIDORA', 'FORTLEV INDUSTRIA', 'ORION S.R.L.'][i % 4] ?? 'CLIENTE',
    cliente_ciudad: ['Luque', 'Asunción', 'San Lorenzo', 'Capiatá'][i % 4] ?? null,
    zona: ['Central', 'Interior'][i % 2] ?? null,
    estado,
    fecha_emision: iso(new Date(hoy.getTime() - dOff * 86400000)),
    fecha_entrega: estado === 'Entregado' ? iso(hoy) : null,
    repartidor_id: rep.id,
    repartidor_nombre: rep.nombre,
    observacion: null,
    usuario: 'Operador General',
    activo: estado !== 'Anulado',
    created_at: new Date(hoy.getTime() - dOff * 86400000).toISOString(),
    items: 2 + (i % 3),
    unidades: 10 * (1 + (i % 4)),
  });
  return [
    mk(6, 'Pendiente', 0, MOCK_REPART[0]!),
    mk(5, 'En Reparto', 0, MOCK_REPART[1]!),
    mk(4, 'Entregado', 1, MOCK_REPART[2]!),
    mk(3, 'Pendiente', 1, MOCK_REPART[0]!),
    mk(2, 'Entregado', 2, MOCK_REPART[1]!),
    mk(1, 'Anulado', 3, MOCK_REPART[2]!),
  ];
}

function summarize(rows: { estado: string }[]): AcuseSummary {
  const s: AcuseSummary = { pendiente: 0, en_reparto: 0, entregado: 0, anulado: 0 };
  rows.forEach((r) => { s[estadoKey(r.estado)] += 1; });
  return s;
}

/* ─────────────────────────── Lecturas ─────────────────────────── */
export async function listAcuses(
  filters: AcuseFilters = {},
  page = 1,
): Promise<{ rows: AcuseRow[]; total: number; summary: AcuseSummary; live: boolean }> {
  if (!isAcuseReady || !supabaseAcuse) {
    let rows = mockAcuses();
    if (filters.estado && filters.estado !== 'all') rows = rows.filter((r) => r.estado === filters.estado);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((r) => `${r.nro_acuse} ${r.cliente_nombre} ${r.repartidor_nombre}`.toLowerCase().includes(q));
    }
    return { rows, total: rows.length, summary: summarize(rows), live: false };
  }

  let q = supabaseAcuse
    .from('acuses')
    .select('id,nro_acuse,cod_cliente,cliente_nombre,cliente_ciudad,zona,estado,fecha_emision,fecha_entrega,repartidor_id,repartidor_nombre,observacion,usuario,activo,created_at,acuse_detalle(cantidad)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);

  if (filters.estado && filters.estado !== 'all') q = q.eq('estado', filters.estado);
  if (filters.repartidorId) q = q.eq('repartidor_id', filters.repartidorId);
  if (filters.fechaDesde) q = q.gte('fecha_emision', filters.fechaDesde);
  if (filters.fechaHasta) q = q.lte('fecha_emision', filters.fechaHasta);
  if (filters.search) q = q.or(`nro_acuse.ilike.%${filters.search}%,cliente_nombre.ilike.%${filters.search}%,repartidor_nombre.ilike.%${filters.search}%`);

  const { data, error, count } = await q;
  if (error) { console.error('[acuses] listAcuses', error); return { rows: [], total: 0, summary: { pendiente: 0, en_reparto: 0, entregado: 0, anulado: 0 }, live: true }; }

  const rows: AcuseRow[] = (data ?? []).map((r) => {
    const rec = r as Record<string, unknown>;
    const det = (rec.acuse_detalle ?? []) as { cantidad: number }[];
    return {
      id: Number(rec.id),
      nro_acuse: String(rec.nro_acuse ?? ''),
      cod_cliente: (rec.cod_cliente as string) ?? null,
      cliente_nombre: (rec.cliente_nombre as string) ?? null,
      cliente_ciudad: (rec.cliente_ciudad as string) ?? null,
      zona: (rec.zona as string) ?? null,
      estado: String(rec.estado ?? 'Pendiente'),
      fecha_emision: String(rec.fecha_emision ?? ''),
      fecha_entrega: (rec.fecha_entrega as string) ?? null,
      repartidor_id: rec.repartidor_id != null ? Number(rec.repartidor_id) : null,
      repartidor_nombre: (rec.repartidor_nombre as string) ?? null,
      observacion: (rec.observacion as string) ?? null,
      usuario: (rec.usuario as string) ?? null,
      activo: Boolean(rec.activo),
      created_at: String(rec.created_at ?? ''),
      items: det.length,
      unidades: det.reduce((a, d) => a + (Number(d.cantidad) || 0), 0),
    };
  });
  return { rows, total: count ?? rows.length, summary: summarize(rows), live: true };
}

async function countBy(filter: (q: any) => any): Promise<number> {
  if (!supabaseAcuse) return 0;
  const q = filter(supabaseAcuse.from('acuses').select('*', { count: 'exact', head: true }));
  const { count, error } = await q;
  if (error) { console.error('[acuses] count', error); return 0; }
  return count ?? 0;
}

export async function getAcuseDashboard(): Promise<AcuseDashboard> {
  if (!isAcuseReady || !supabaseAcuse) {
    const rows = mockAcuses();
    const s = summarize(rows);
    return {
      total: rows.length, pendientes: s.pendiente, enReparto: s.en_reparto, entregados: s.entregado, anulados: s.anulado,
      hoy: 2, proximas: 0, repartidores: MOCK_REPART.length,
      porDia: last7Days().map((f, i) => ({ fecha: f, total: [0, 1, 0, 2, 1, 3, 2][i] ?? 0 })),
      live: false,
    };
  }
  const hoy = new Date().toISOString().slice(0, 10);
  const [total, pendientes, enReparto, entregados, anulados, hoyC, proximas] = await Promise.all([
    countBy((q) => q.eq('activo', true)),
    countBy((q) => q.eq('estado', 'Pendiente').eq('activo', true)),
    countBy((q) => q.eq('estado', 'En Reparto').eq('activo', true)),
    countBy((q) => q.eq('estado', 'Entregado').eq('activo', true)),
    countBy((q) => q.eq('estado', 'Anulado')),
    countBy((q) => q.eq('fecha_emision', hoy).eq('activo', true)),
    countBy((q) => q.gt('fecha_emision', hoy).eq('activo', true)),
  ]);
  let repartidores = 0;
  try {
    const { count } = await supabaseAcuse.from('repartidores').select('*', { count: 'exact', head: true }).eq('activo', true);
    repartidores = count ?? 0;
  } catch { /* noop */ }

  return { total, pendientes, enReparto, entregados, anulados, hoy: hoyC, proximas, repartidores, porDia: await porDia(), live: true };
}

function last7Days(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  return out;
}

async function porDia(): Promise<{ fecha: string; total: number }[]> {
  if (!supabaseAcuse) return [];
  const desde = last7Days()[0]!;
  const { data } = await supabaseAcuse.from('acuses').select('fecha_emision').gte('fecha_emision', desde).eq('activo', true);
  const map = new Map<string, number>();
  (data ?? []).forEach((r) => { const f = String(r.fecha_emision); map.set(f, (map.get(f) ?? 0) + 1); });
  return last7Days().map((f) => ({ fecha: f, total: map.get(f) ?? 0 }));
}

export async function listRepartidores(): Promise<Repartidor[]> {
  if (!isAcuseReady || !supabaseAcuse) return MOCK_REPART;
  const { data, error } = await supabaseAcuse.from('repartidores').select('id,codigo,nombre,activo').eq('activo', true).order('nombre');
  if (error) { console.error('[acuses] repartidores', error); return []; }
  return (data ?? []) as Repartidor[];
}

const MOCK_CLIENTES: ClienteCat[] = [
  { cod_cliente: 'C1001', nombre: 'ATLANTIC S.A.E.', ruc: '80012345-6', direccion: 'Av. Artigas 1200', ciudad: 'Asunción', zona: 'Central', telefono: '021 555 100' },
  { cod_cliente: 'C1002', nombre: 'ZR DISTRIBUIDORA', ruc: '80023456-7', direccion: 'Ruta 2 km 18', ciudad: 'San Lorenzo', zona: 'Central', telefono: '021 555 200' },
  { cod_cliente: 'C1003', nombre: 'FORTLEV INDUSTRIA', ruc: '80034567-8', direccion: 'Parque Industrial', ciudad: 'Luque', zona: 'Central', telefono: '021 555 300' },
  { cod_cliente: 'C1004', nombre: 'ORION S.R.L.', ruc: '80045678-9', direccion: 'Calle Última 456', ciudad: 'Capiatá', zona: 'Interior', telefono: '0228 555 400' },
];
const MOCK_ARTICULOS: ArticuloCat[] = [
  { material: '100023', descripcion: 'Caño PVC 100mm', um: 'UN', status: 'Activo' },
  { material: '100048', descripcion: 'Codo PVC 90°', um: 'UN', status: 'Activo' },
  { material: '100112', descripcion: 'Cemento bolsa 50kg', um: 'BOL', status: 'Activo' },
  { material: '100205', descripcion: 'Hierro 8mm x 12m', um: 'UN', status: 'Activo' },
];

export async function searchClientes(term: string): Promise<ClienteCat[]> {
  const t0 = term.trim().toLowerCase();
  if (!isAcuseReady || !supabaseAcuse) {
    return MOCK_CLIENTES.filter((c) => !t0 || `${c.cod_cliente} ${c.nombre}`.toLowerCase().includes(t0));
  }
  const t = term.trim();
  let q = supabaseAcuse.from('clientes').select('cod_cliente,nombre,ruc,direccion,ciudad,zona,telefono').limit(20);
  if (t) q = q.or(`cod_cliente.ilike.%${t}%,nombre.ilike.%${t}%`);
  const { data, error } = await q;
  if (error) { console.error('[acuses] clientes', error); return []; }
  return (data ?? []) as ClienteCat[];
}

export async function searchArticulos(term: string): Promise<ArticuloCat[]> {
  const t0 = term.trim().toLowerCase();
  if (!isAcuseReady || !supabaseAcuse) {
    return MOCK_ARTICULOS.filter((a) => !t0 || `${a.material} ${a.descripcion}`.toLowerCase().includes(t0));
  }
  const t = term.trim();
  let q = supabaseAcuse.from('articulos').select('material,descripcion,um,status').limit(20);
  if (t) q = q.or(`material.ilike.%${t}%,descripcion.ilike.%${t}%`);
  const { data, error } = await q;
  if (error) { console.error('[acuses] articulos', error); return []; }
  return (data ?? []) as ArticuloCat[];
}

/* ─────────────────────────── Detalle / edición ─────────────────────────── */
export async function getAcuse(id: number): Promise<AcuseFull | null> {
  if (!isAcuseReady || !supabaseAcuse) {
    const base = mockAcuses().find((a) => a.id === id);
    if (!base) return null;
    return {
      ...base,
      cliente_ruc: '80012345-6', cliente_direccion: 'Av. Ejemplo 123', cliente_telefono: '021 555 000',
      detalles: [
        { id: 1, cod_mercaderia: '100023', descripcion: 'Artículo demo A', cantidad: 10, um: 'UN', nota: null },
        { id: 2, cod_mercaderia: '100048', descripcion: 'Artículo demo B', cantidad: 5, um: 'CJ', nota: 'Frágil' },
      ],
      historial: [{ id: 1, estado: base.estado, usuario: base.usuario, observacion: 'Creación del acuse', created_at: base.created_at }],
    };
  }
  const { data, error } = await supabaseAcuse.from('acuses').select('*').eq('id', id).single();
  if (error || !data) { console.error('[acuses] getAcuse', error); return null; }
  const rec = data as Record<string, unknown>;
  const [detRes, histRes] = await Promise.all([
    supabaseAcuse.from('acuse_detalle').select('id,cod_mercaderia,descripcion,cantidad,um,nota').eq('acuse_id', id).order('id'),
    supabaseAcuse.from('acuse_historial').select('id,estado,usuario,observacion,created_at').eq('acuse_id', id).order('created_at', { ascending: false }),
  ]);
  const detalles = (detRes.data ?? []) as AcuseDetalle[];
  return {
    id: Number(rec.id),
    nro_acuse: String(rec.nro_acuse ?? ''),
    cod_cliente: (rec.cod_cliente as string) ?? null,
    cliente_nombre: (rec.cliente_nombre as string) ?? null,
    cliente_ciudad: (rec.cliente_ciudad as string) ?? null,
    cliente_ruc: (rec.cliente_ruc as string) ?? null,
    cliente_direccion: (rec.cliente_direccion as string) ?? null,
    cliente_telefono: (rec.cliente_telefono as string) ?? null,
    zona: (rec.zona as string) ?? null,
    estado: String(rec.estado ?? 'Pendiente'),
    fecha_emision: String(rec.fecha_emision ?? ''),
    fecha_entrega: (rec.fecha_entrega as string) ?? null,
    repartidor_id: rec.repartidor_id != null ? Number(rec.repartidor_id) : null,
    repartidor_nombre: (rec.repartidor_nombre as string) ?? null,
    observacion: (rec.observacion as string) ?? null,
    usuario: (rec.usuario as string) ?? null,
    activo: Boolean(rec.activo),
    created_at: String(rec.created_at ?? ''),
    items: detalles.length,
    unidades: detalles.reduce((a, d) => a + (Number(d.cantidad) || 0), 0),
    detalles,
    historial: (histRes.data ?? []) as AcuseHistorial[],
  };
}

/* ─────────────────────────── Escrituras ─────────────────────────── */
export async function createAcuse(input: NewAcuseInput): Promise<{ id: number; nro_acuse: string }> {
  if (!supabaseAcuse) throw new Error('Sin conexión con la base de Acuses');
  const { detalles, ...head } = input;
  const { data, error } = await supabaseAcuse.from('acuses').insert({ ...head, activo: true }).select('id,nro_acuse').single();
  if (error) throw error;
  const id = (data as { id: number }).id;
  if (detalles.length) {
    const rows = detalles.map((d) => ({ acuse_id: id, cod_mercaderia: d.cod_mercaderia, descripcion: d.descripcion, cantidad: d.cantidad, um: d.um, nota: d.nota }));
    const { error: e2 } = await supabaseAcuse.from('acuse_detalle').insert(rows);
    if (e2) throw e2;
  }
  await supabaseAcuse.from('acuse_historial').insert({ acuse_id: id, estado: input.estado, usuario: input.usuario ?? null, observacion: 'Creación del acuse' });
  await supabaseAcuse.from('acuse_log').insert({ acuse_id: id, accion: 'CREAR', usuario: input.usuario ?? null, observacion: 'Acuse creado desde el módulo' });
  return data as { id: number; nro_acuse: string };
}

export async function changeEstado(id: number, estado: string, usuario: string | null, observacion?: string | null, fechaEntrega?: string | null): Promise<void> {
  if (!supabaseAcuse) throw new Error('Sin conexión con la base de Acuses');
  const patch: Record<string, unknown> = { estado };
  if (fechaEntrega) patch.fecha_entrega = fechaEntrega;
  const { error } = await supabaseAcuse.from('acuses').update(patch).eq('id', id);
  if (error) throw error;
  await supabaseAcuse.from('acuse_historial').insert({ acuse_id: id, estado, usuario, observacion: observacion ?? null });
  await supabaseAcuse.from('acuse_log').insert({ acuse_id: id, accion: 'CAMBIO_ESTADO', usuario, observacion: observacion ?? null });
}

export async function anularAcuse(id: number, usuario: string | null, observacion: string): Promise<void> {
  if (!supabaseAcuse) throw new Error('Sin conexión con la base de Acuses');
  const { error } = await supabaseAcuse.from('acuses').update({ estado: 'Anulado', activo: false }).eq('id', id);
  if (error) throw error;
  await supabaseAcuse.from('acuse_historial').insert({ acuse_id: id, estado: 'Anulado', usuario, observacion });
  await supabaseAcuse.from('acuse_log').insert({ acuse_id: id, accion: 'ANULAR', usuario, observacion });
}

export async function updateAcuse(id: number, input: NewAcuseInput): Promise<void> {
  if (!supabaseAcuse) throw new Error('Sin conexión con la base de Acuses');
  const { detalles, ...head } = input;
  const { error } = await supabaseAcuse.from('acuses').update(head).eq('id', id);
  if (error) throw error;
  await supabaseAcuse.from('acuse_detalle').delete().eq('acuse_id', id);
  if (detalles.length) {
    const rows = detalles.map((d) => ({ acuse_id: id, cod_mercaderia: d.cod_mercaderia, descripcion: d.descripcion, cantidad: d.cantidad, um: d.um, nota: d.nota }));
    const { error: e2 } = await supabaseAcuse.from('acuse_detalle').insert(rows);
    if (e2) throw e2;
  }
  await supabaseAcuse.from('acuse_historial').insert({ acuse_id: id, estado: input.estado, usuario: input.usuario ?? null, observacion: 'Edición del acuse' });
  await supabaseAcuse.from('acuse_log').insert({ acuse_id: id, accion: 'EDITAR', usuario: input.usuario ?? null, observacion: 'Acuse actualizado desde el módulo' });
}

/* ─────────────────────────── Export CSV ─────────────────────────── */
export async function downloadAcusesCsv(filters: AcuseFilters = {}): Promise<number> {
  let rows: AcuseRow[];
  if (!isAcuseReady || !supabaseAcuse) {
    rows = mockAcuses();
  } else {
    let q = supabaseAcuse
      .from('acuses')
      .select('nro_acuse,cod_cliente,cliente_nombre,cliente_ciudad,zona,estado,fecha_emision,fecha_entrega,repartidor_nombre,usuario')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (filters.estado && filters.estado !== 'all') q = q.eq('estado', filters.estado);
    if (filters.search) q = q.or(`nro_acuse.ilike.%${filters.search}%,cliente_nombre.ilike.%${filters.search}%,repartidor_nombre.ilike.%${filters.search}%`);
    const { data, error } = await q;
    if (error) throw error;
    rows = (data ?? []) as unknown as AcuseRow[];
  }

  const headers = ['N° Acuse', 'Cód. Cliente', 'Cliente', 'Ciudad', 'Zona', 'Estado', 'Emisión', 'Entrega', 'Repartidor', 'Usuario'];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(';')];
  rows.forEach((r) => lines.push([
    r.nro_acuse, r.cod_cliente, r.cliente_nombre, r.cliente_ciudad, r.zona,
    r.estado, r.fecha_emision, r.fecha_entrega, r.repartidor_nombre, r.usuario,
  ].map(esc).join(';')));

  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acuses_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return rows.length;
}
