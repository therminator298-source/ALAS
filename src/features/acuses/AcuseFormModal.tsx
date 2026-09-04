import { useEffect, useRef, useState } from 'react';
import { Search, Trash2, Package, Building2, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import {
  listRepartidores, searchClientes, searchArticulos, getAcuse, createAcuse, updateAcuse,
} from './acuseApi';
import { ACUSE_ESTADOS, type Repartidor, type ClienteCat, type ArticuloCat, type AcuseDetalle } from './types';

interface Props {
  open: boolean;
  acuseId: number | null; // null = nuevo
  onClose: () => void;
  onSaved: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function AcuseFormModal({ open, acuseId, onClose, onSaved }: Props) {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);

  const [cliente, setCliente] = useState<ClienteCat | null>(null);
  const [cliTerm, setCliTerm] = useState('');
  const [cliResults, setCliResults] = useState<ClienteCat[]>([]);
  const [cliOpen, setCliOpen] = useState(false);

  const [fechaEmision, setFechaEmision] = useState(today());
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [repartidorId, setRepartidorId] = useState<string>('');
  const [estado, setEstado] = useState<string>('Pendiente');
  const [zona, setZona] = useState('');
  const [observacion, setObservacion] = useState('');
  const [detalles, setDetalles] = useState<AcuseDetalle[]>([]);

  const [artTerm, setArtTerm] = useState('');
  const [artResults, setArtResults] = useState<ArticuloCat[]>([]);
  const [artOpen, setArtOpen] = useState(false);
  const cliBoxRef = useRef<HTMLDivElement>(null);
  const artBoxRef = useRef<HTMLDivElement>(null);

  // Reset / carga al abrir
  useEffect(() => {
    if (!open) return;
    listRepartidores().then(setRepartidores);
    if (acuseId == null) {
      setCliente(null); setCliTerm(''); setFechaEmision(today()); setFechaEntrega('');
      setRepartidorId(''); setEstado('Pendiente'); setZona(''); setObservacion(''); setDetalles([]);
      return;
    }
    setLoading(true);
    getAcuse(acuseId).then((a) => {
      if (!a) { toast('No se pudo cargar el acuse.', 'err'); onClose(); return; }
      setCliente({ cod_cliente: a.cod_cliente ?? '', nombre: a.cliente_nombre, ruc: a.cliente_ruc, direccion: a.cliente_direccion, ciudad: a.cliente_ciudad, zona: a.zona, telefono: a.cliente_telefono });
      setCliTerm(a.cliente_nombre ?? a.cod_cliente ?? '');
      setFechaEmision(a.fecha_emision || today());
      setFechaEntrega(a.fecha_entrega ?? '');
      setRepartidorId(a.repartidor_id != null ? String(a.repartidor_id) : '');
      setEstado(a.estado || 'Pendiente');
      setZona(a.zona ?? '');
      setObservacion(a.observacion ?? '');
      setDetalles(a.detalles);
      setLoading(false);
    });
  }, [open, acuseId, onClose]);

  // Búsqueda de cliente (debounce)
  useEffect(() => {
    if (!cliOpen) return;
    const t = setTimeout(() => { searchClientes(cliTerm).then(setCliResults); }, 220);
    return () => clearTimeout(t);
  }, [cliTerm, cliOpen]);

  // Búsqueda de artículo (debounce)
  useEffect(() => {
    if (!artOpen) return;
    const t = setTimeout(() => { searchArticulos(artTerm).then(setArtResults); }, 220);
    return () => clearTimeout(t);
  }, [artTerm, artOpen]);

  function pickCliente(c: ClienteCat) {
    setCliente(c); setCliTerm(c.nombre ?? c.cod_cliente); setCliOpen(false);
    if (c.zona) setZona(c.zona);
  }
  function addArticulo(a: ArticuloCat) {
    setDetalles((d) => {
      if (d.some((x) => x.cod_mercaderia === a.material)) return d;
      return [...d, { cod_mercaderia: a.material, descripcion: a.descripcion, cantidad: 1, um: a.um, nota: null }];
    });
    setArtTerm(''); setArtOpen(false);
  }
  function setDet(i: number, patch: Partial<AcuseDetalle>) {
    setDetalles((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeDet(i: number) { setDetalles((d) => d.filter((_, idx) => idx !== i)); }

  async function save() {
    if (!cliente || !cliente.cod_cliente) { toast('Elegí un cliente.', 'err'); return; }
    if (detalles.length === 0) { toast('Agregá al menos un artículo.', 'err'); return; }
    if (detalles.some((d) => !(Number(d.cantidad) > 0))) { toast('Cantidad inválida en el detalle.', 'err'); return; }
    const rep = repartidores.find((r) => String(r.id) === repartidorId);
    setSaving(true);
    const payload = {
      cod_cliente: cliente.cod_cliente,
      cliente_nombre: cliente.nombre, cliente_ruc: cliente.ruc, cliente_direccion: cliente.direccion,
      cliente_ciudad: cliente.ciudad, cliente_telefono: cliente.telefono,
      zona: zona || cliente.zona || null,
      estado, fecha_emision: fechaEmision, fecha_entrega: fechaEntrega || null,
      repartidor_id: rep ? rep.id : null, repartidor_nombre: rep ? rep.nombre : null,
      observacion: observacion || null, usuario: user.nombre,
      detalles: detalles.map((d) => ({ ...d, cantidad: Number(d.cantidad) })),
    };
    try {
      if (acuseId == null) {
        const created = await createAcuse(payload);
        toast(`Acuse ${created.nro_acuse} creado.`, 'ok');
      } else {
        await updateAcuse(acuseId, payload);
        toast('Acuse actualizado.', 'ok');
      }
      onSaved();
    } catch (e) {
      toast((e as Error).message || 'No se pudo guardar el acuse.', 'err');
    } finally {
      setSaving(false);
    }
  }

  const totalUnid = detalles.reduce((a, d) => a + (Number(d.cantidad) || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={acuseId == null ? 'Nuevo acuse' : 'Editar acuse'}
      subtitle={acuseId == null ? 'Registrá un nuevo acuse de recibo' : undefined}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-2xs font-semibold text-ink-3">{detalles.length} ítems · {totalUnid} unid.</span>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || loading}>
            <Check className="h-4 w-4" strokeWidth={2.5} /> {saving ? 'Guardando…' : 'Guardar acuse'}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="py-10 text-center text-sm text-ink-3">Cargando acuse…</div>
      ) : (
        <div className="space-y-4">
          {/* Cliente + datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Cliente *">
              <div ref={cliBoxRef} className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
                <input
                  className="input pl-9"
                  value={cliTerm}
                  onChange={(e) => { setCliTerm(e.target.value); setCliOpen(true); setCliente(null); }}
                  onFocus={() => setCliOpen(true)}
                  placeholder="Buscar cliente por código o nombre…"
                />
                {cliOpen && cliResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto card p-1 shadow-pop">
                    {cliResults.map((c) => (
                      <button key={c.cod_cliente} onClick={() => pickCliente(c)} className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-3">
                        <div className="text-sm font-semibold text-ink truncate">{c.nombre ?? c.cod_cliente}</div>
                        <div className="text-2xs text-ink-3">{c.cod_cliente} · {c.ciudad ?? '—'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {cliente && <span className="block text-2xs text-ink-3 mt-1">RUC {cliente.ruc ?? '—'} · {cliente.direccion ?? '—'}</span>}
            </Field>
            <Field label="Repartidor">
              <select className="input" value={repartidorId} onChange={(e) => setRepartidorId(e.target.value)}>
                <option value="">Sin asignar…</option>
                {repartidores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </Field>
            <Field label="Fecha de emisión *">
              <input type="date" className="input" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
            </Field>
            <Field label="Fecha de entrega">
              <input type="date" className="input" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
            </Field>
            <Field label="Estado">
              <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ACUSE_ESTADOS.filter((e) => e !== 'Anulado').map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="Zona">
              <input className="input" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Zona / ruta" />
            </Field>
          </div>

          {/* Detalle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-ink-2">Detalle de mercadería</span>
            </div>
            <div ref={artBoxRef} className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
              <input
                className="input pl-9"
                value={artTerm}
                onChange={(e) => { setArtTerm(e.target.value); setArtOpen(true); }}
                onFocus={() => setArtOpen(true)}
                placeholder="Buscar artículo por código o descripción…"
              />
              {artOpen && artResults.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto card p-1 shadow-pop">
                  {artResults.map((a) => (
                    <button key={a.material} onClick={() => addArticulo(a)} className="w-full flex items-center gap-3 text-left px-2.5 py-2 rounded-lg hover:bg-surface-3">
                      <Package className="h-4 w-4 text-ink-3 shrink-0" />
                      <span className="font-mono text-xs font-bold w-24 shrink-0">{a.material}</span>
                      <span className="text-sm text-ink truncate flex-1">{a.descripcion}</span>
                      <span className="text-2xs text-ink-3">{a.um}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {detalles.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg py-6 text-center text-sm text-ink-3">Sin artículos. Buscá y agregá arriba.</div>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-3 text-left text-2xs font-bold uppercase tracking-wide text-ink-3">
                      <th className="px-3 py-2">Código</th><th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2 w-28 text-right">Cantidad</th><th className="px-3 py-2 w-20">UM</th>
                      <th className="px-3 py-2">Nota</th><th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detalles.map((d, i) => (
                      <tr key={d.cod_mercaderia + i} className="hover:bg-surface-3">
                        <td className="px-3 py-2 font-mono text-xs font-bold">{d.cod_mercaderia}</td>
                        <td className="px-3 py-2 max-w-[220px] truncate">{d.descripcion}</td>
                        <td className="px-3 py-2 text-right">
                          <input type="number" min="0" className="input h-8 text-right w-24" value={d.cantidad} onChange={(e) => setDet(i, { cantidad: Number(e.target.value) })} />
                        </td>
                        <td className="px-3 py-2 text-ink-3">{d.um}</td>
                        <td className="px-3 py-2">
                          <input className="input h-8" value={d.nota ?? ''} onChange={(e) => setDet(i, { nota: e.target.value || null })} placeholder="—" />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => removeDet(i)} className="text-ink-3 hover:text-faltante" aria-label="Quitar"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Field label="Observación">
            <textarea className="input min-h-[72px] py-2.5 resize-y" value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Notas del acuse…" />
          </Field>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
