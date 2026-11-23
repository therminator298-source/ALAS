import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Trash2, User } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { cn } from '@/lib/utils';
import {
  createAcuse, getAcuse, listRepartidores, searchArticulos, searchClientes, updateAcuse,
} from './acuseApi';
import { ACUSE_ESTADOS } from './types';
import type { AcuseDetalle, ArticuloCat, ClienteCat, Repartidor } from './types';

/** Hoy en Paraguay, no en UTC: toISOString() adelanta el día después de las 21:00. */
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Cabecera {
  cod_cliente: string;
  cliente_nombre: string;
  cliente_ruc: string;
  cliente_direccion: string;
  cliente_ciudad: string;
  cliente_telefono: string;
  zona: string;
  estado: string;
  fecha_emision: string;
  fecha_entrega: string;
  repartidor_id: number | null;
  observacion: string;
}

const VACIA: Cabecera = {
  cod_cliente: '', cliente_nombre: '', cliente_ruc: '', cliente_direccion: '',
  cliente_ciudad: '', cliente_telefono: '', zona: '', estado: 'Pendiente',
  fecha_emision: hoyLocal(), fecha_entrega: '', repartidor_id: null, observacion: '',
};

type Linea = AcuseDetalle & { k: number };
let semilla = 1;
const lineaVacia = (): Linea => ({ k: semilla++, cod_mercaderia: '', descripcion: '', cantidad: 1, um: '', nota: '' });

export function AcuseFormModal({
  open, acuseId, onClose, onSaved,
}: {
  open: boolean;
  /** null = alta; un id = edición. */
  acuseId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useSession();
  const [cab, setCab] = useState<Cabecera>(VACIA);
  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    listRepartidores().then(setRepartidores);
    if (acuseId == null) {
      setCab({ ...VACIA, fecha_emision: hoyLocal() });
      setLineas([lineaVacia()]);
      return;
    }
    setCargando(true);
    getAcuse(acuseId).then((a) => {
      setCargando(false);
      if (!a) { toast('No se encontró el acuse', 'err'); onClose(); return; }
      setCab({
        cod_cliente: a.cod_cliente ?? '', cliente_nombre: a.cliente_nombre ?? '',
        cliente_ruc: a.cliente_ruc ?? '', cliente_direccion: a.cliente_direccion ?? '',
        cliente_ciudad: a.cliente_ciudad ?? '', cliente_telefono: a.cliente_telefono ?? '',
        zona: a.zona ?? '', estado: a.estado, fecha_emision: a.fecha_emision,
        fecha_entrega: a.fecha_entrega ?? '', repartidor_id: a.repartidor_id,
        observacion: a.observacion ?? '',
      });
      setLineas(a.detalles.length ? a.detalles.map((d) => ({ ...d, k: semilla++ })) : [lineaVacia()]);
    });
  }, [open, acuseId, onClose]);

  function elegirCliente(c: ClienteCat) {
    setCab((v) => ({
      ...v,
      cod_cliente: c.cod_cliente,
      cliente_nombre: c.nombre ?? '',
      cliente_ruc: c.ruc ?? '',
      cliente_direccion: c.direccion ?? '',
      cliente_ciudad: c.ciudad ?? '',
      cliente_telefono: c.telefono ?? '',
      zona: c.zona ?? '',
    }));
  }

  function setLinea(k: number, patch: Partial<Linea>) {
    setLineas((v) => v.map((l) => (l.k === k ? { ...l, ...patch } : l)));
  }

  async function guardar() {
    if (!cab.cod_cliente.trim()) { toast('Elegí el cliente', 'err'); return; }
    const vivas = lineas.filter((l) => l.cod_mercaderia.trim());
    if (!vivas.length) { toast('Cargá al menos una mercadería', 'err'); return; }
    if (vivas.some((l) => !(Number(l.cantidad) > 0))) { toast('Las cantidades tienen que ser mayores a cero', 'err'); return; }

    setGuardando(true);
    const payload = {
      cod_cliente: cab.cod_cliente.trim(),
      cliente_nombre: cab.cliente_nombre || null,
      cliente_ruc: cab.cliente_ruc || null,
      cliente_direccion: cab.cliente_direccion || null,
      cliente_ciudad: cab.cliente_ciudad || null,
      cliente_telefono: cab.cliente_telefono || null,
      zona: cab.zona || null,
      estado: cab.estado,
      fecha_emision: cab.fecha_emision,
      fecha_entrega: cab.fecha_entrega || null,
      repartidor_id: cab.repartidor_id,
      repartidor_nombre: repartidores.find((r) => r.id === cab.repartidor_id)?.nombre ?? null,
      observacion: cab.observacion || null,
      usuario: user?.nombre ?? null,
      detalles: vivas.map(({ k: _k, ...d }) => ({ ...d, cantidad: Number(d.cantidad) || 0 })),
    };
    try {
      if (acuseId == null) {
        const r = await createAcuse(payload);
        toast(`Acuse ${r.nro_acuse} creado`, 'ok');
      } else {
        await updateAcuse(acuseId, payload);
        toast('Acuse actualizado', 'ok');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast('No se pudo guardar: ' + (err as Error).message, 'err');
    } finally {
      setGuardando(false);
    }
  }

  const unidades = lineas.reduce((a, l) => a + (Number(l.cantidad) || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="Acuses"
      title={acuseId == null ? 'Nuevo acuse' : 'Editar acuse'}
      subtitle={acuseId == null ? 'Se numera solo al guardar (AC-0001, AC-0002…)' : undefined}
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-2xs font-bold text-ink-3 tabular-nums">
            {lineas.filter((l) => l.cod_mercaderia.trim()).length} ítem(s) · {unidades} unidades
          </span>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={guardando || cargando}>
              {guardando ? 'Guardando…' : acuseId == null ? 'Crear acuse' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      }
    >
      {cargando ? (
        <div className="grid place-items-center py-16"><span className="alas-boot" role="status" aria-label="Cargando" /></div>
      ) : (
        <div className="space-y-5">
          {/* Cliente */}
          <section>
            <h3 className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-2">Cliente</h3>
            <BuscadorCliente onElegir={elegirCliente} />
            {cab.cod_cliente && (
              <div className="mt-2 flex items-start gap-3 rounded-lg border border-border bg-surface-3 px-3 py-2">
                <User className="h-4 w-4 mt-0.5 text-ink-3 shrink-0" />
                <div className="min-w-0 text-sm">
                  <div className="font-bold text-ink truncate">{cab.cliente_nombre || cab.cod_cliente}</div>
                  <div className="text-2xs text-ink-3">
                    {[cab.cod_cliente, cab.cliente_ruc, cab.cliente_ciudad, cab.zona].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Cabecera */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Campo label="Emisión">
              <input type="date" className="input" value={cab.fecha_emision}
                onChange={(e) => setCab((v) => ({ ...v, fecha_emision: e.target.value }))} />
            </Campo>
            <Campo label="Entrega">
              <input type="date" className="input" value={cab.fecha_entrega}
                onChange={(e) => setCab((v) => ({ ...v, fecha_entrega: e.target.value }))} />
            </Campo>
            <Campo label="Repartidor">
              <select className="input" value={cab.repartidor_id ?? ''}
                onChange={(e) => setCab((v) => ({ ...v, repartidor_id: e.target.value === '' ? null : Number(e.target.value) }))}>
                <option value="">Sin asignar</option>
                {repartidores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </Campo>
            <Campo label="Estado">
              <select className="input" value={cab.estado}
                onChange={(e) => setCab((v) => ({ ...v, estado: e.target.value }))}>
                {ACUSE_ESTADOS.filter((e) => e !== 'Anulado').map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </Campo>
          </section>

          {/* Mercaderías */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xs font-bold uppercase tracking-wide text-ink-3">Mercaderías</h3>
              <button className="btn-ghost h-8 px-2.5 text-xs" onClick={() => setLineas((v) => [...v, lineaVacia()])}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2.6} /> Agregar línea
              </button>
            </div>
            <div className="space-y-2">
              {lineas.map((l) => (
                <div key={l.k} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
                  <BuscadorArticulo
                    valor={l.cod_mercaderia}
                    descripcion={l.descripcion ?? ''}
                    onElegir={(a) => setLinea(l.k, { cod_mercaderia: a.material, descripcion: a.descripcion, um: a.um })}
                    onTexto={(t) => setLinea(l.k, { cod_mercaderia: t })}
                  />
                  <input className="input w-[90px] text-right" inputMode="numeric" value={l.cantidad}
                    aria-label="Cantidad"
                    onChange={(e) => setLinea(l.k, { cantidad: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
                  <input className="input w-[80px]" placeholder="UM" value={l.um ?? ''}
                    aria-label="Unidad de medida"
                    onChange={(e) => setLinea(l.k, { um: e.target.value })} />
                  <button
                    className="grid place-items-center h-10 w-10 rounded-lg text-ink-3 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
                    onClick={() => setLineas((v) => (v.length > 1 ? v.filter((x) => x.k !== l.k) : v))}
                    disabled={lineas.length <= 1}
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <Campo label="Observación">
            <textarea className="input h-20 py-2 resize-none" value={cab.observacion}
              onChange={(e) => setCab((v) => ({ ...v, observacion: e.target.value }))}
              placeholder="Notas para el repartidor o para el cliente…" />
          </Campo>
        </div>
      )}
    </Modal>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-2xs font-bold uppercase tracking-wide text-ink-3 mb-1">{label}</span>
      {children}
    </label>
  );
}

/* Los catálogos tienen 13.800 clientes y 20.330 artículos: se buscan en el
   servidor con un retardo, nunca se traen enteros al navegador. */
function BuscadorCliente({ onElegir }: { onElegir: (c: ClienteCat) => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<ClienteCat[]>([]);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const t = setTimeout(() => { searchClientes(q.trim()).then(setRes); }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  return (
    <div className="relative" ref={caja}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
      <input
        className="input pl-9"
        value={q}
        onChange={(e) => { setQ(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        placeholder="Buscar cliente por código o nombre (mínimo 2 letras)…"
        aria-label="Buscar cliente"
      />
      {abierto && res.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border bg-surface shadow-pop">
          {res.map((c) => (
            <li key={c.cod_cliente}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-surface-3 transition-colors"
                onClick={() => { onElegir(c); setAbierto(false); setQ(''); }}
              >
                <div className="text-sm font-semibold text-ink truncate">{c.nombre ?? c.cod_cliente}</div>
                <div className="text-2xs text-ink-3">{[c.cod_cliente, c.ciudad, c.zona].filter(Boolean).join(' · ')}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BuscadorArticulo({
  valor, descripcion, onElegir, onTexto,
}: {
  valor: string;
  descripcion: string;
  onElegir: (a: ArticuloCat) => void;
  onTexto: (t: string) => void;
}) {
  const [res, setRes] = useState<ArticuloCat[]>([]);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (valor.trim().length < 2 || !abierto) { setRes([]); return; }
    const t = setTimeout(() => { searchArticulos(valor.trim()).then(setRes); }, 280);
    return () => clearTimeout(t);
  }, [valor, abierto]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  return (
    <div className="relative min-w-0" ref={caja}>
      <input
        className={cn('input', descripcion && 'font-semibold')}
        value={valor}
        onChange={(e) => { onTexto(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        placeholder="Código o descripción de la mercadería…"
        aria-label="Mercadería"
      />
      {descripcion && !abierto && (
        <span className="block mt-1 text-2xs text-ink-3 truncate">{descripcion}</span>
      )}
      {abierto && res.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-border bg-surface shadow-pop">
          {res.map((a) => (
            <li key={a.material}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-surface-3 transition-colors"
                onClick={() => { onElegir(a); setAbierto(false); }}
              >
                <div className="text-sm font-semibold text-ink truncate">{a.descripcion ?? a.material}</div>
                <div className="text-2xs text-ink-3">{[a.material, a.um].filter(Boolean).join(' · ')}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
