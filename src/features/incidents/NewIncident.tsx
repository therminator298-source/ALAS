import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, FileText, Package, Building2, type LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ReasonCards } from './ReasonCards';
import { ProductSelectorModal } from './ProductSelectorModal';
import { toast } from '@/components/ui/toast';
import { listSuppliers, listWarehouses } from '@/services/catalogs';
import { createIncident, type NewIncidentItem, type NewIncidentPayload } from '@/services/incidents';
import { useSession } from '@/store/session';
import type { IncidentReason, Supplier, Warehouse } from '@/types';

const DRAFT_KEY = 'inc.new.draft';

interface DraftState {
  emission_date: string;
  document_number: string;
  invoice_number: string;
  supplier_id: string;
  warehouse_id: string;
  reason: IncidentReason | null;
  priority: string;
  description: string;
  items: NewIncidentItem[];
}

const emptyDraft = (): DraftState => ({
  emission_date: new Date().toISOString().slice(0, 10),
  document_number: '',
  invoice_number: '',
  supplier_id: '',
  warehouse_id: '',
  reason: null,
  priority: 'NORMAL',
  description: '',
  items: [],
});

export function NewIncident() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [draft, setDraft] = useState<DraftState>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...emptyDraft(), ...JSON.parse(raw) } : emptyDraft();
    } catch {
      return emptyDraft();
    }
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productModal, setProductModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSuppliers().then(setSuppliers);
    listWarehouses().then(setWarehouses);
  }, []);

  // Autoguardado de borrador (sección 51)
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* noop */
    }
  }, [draft]);

  const set = <K extends keyof DraftState>(k: K, v: DraftState[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const addItem = (it: NewIncidentItem) => setDraft((d) => ({ ...d, items: [...d.items, it] }));
  const removeItem = (i: number) => setDraft((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));

  function validate(): string | null {
    if (!draft.supplier_id) return 'Elegí un proveedor.';
    if (!draft.reason) return 'Elegí el tipo de incidencia.';
    if (draft.items.length === 0) return 'Agregá al menos un producto.';
    return null;
  }

  async function save(asDraft: boolean) {
    if (!asDraft) {
      const err = validate();
      if (err) {
        toast(err, 'err');
        return;
      }
    }
    if (!draft.reason) {
      toast('Elegí el tipo de incidencia.', 'err');
      return;
    }
    setSaving(true);
    const payload: NewIncidentPayload = {
      document_number: draft.document_number || null,
      invoice_number: draft.invoice_number || null,
      supplier_id: draft.supplier_id || null,
      warehouse_id: draft.warehouse_id || null,
      reason: draft.reason,
      priority: draft.priority,
      description: draft.description || null,
      emission_date: new Date(draft.emission_date).toISOString(),
      status: asDraft ? 'BORRADOR' : 'PENDIENTE',
      items: draft.items,
    };
    try {
      const created = await createIncident(user.id, payload);
      localStorage.removeItem(DRAFT_KEY);
      toast(`Incidencia ${created.incident_number} creada correctamente.`, 'ok');
      navigate(`/incidents/${created.incident_number}`);
    } catch (e) {
      toast((e as Error).message || 'No se pudo guardar la incidencia.', 'err');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto pb-24">
      <PageHeader title="Nueva incidencia" subtitle="Registrá una diferencia detectada en la recepción" />

      {/* BLOQUE 1 · Documental */}
      <Section icon={FileText} title="Información documental">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Fecha de emisión *">
            <input type="date" className="input" value={draft.emission_date} onChange={(e) => set('emission_date', e.target.value)} />
          </Field>
          <Field label="Proveedor *">
            <select className="input" value={draft.supplier_id} onChange={(e) => set('supplier_id', e.target.value)}>
              <option value="">Seleccionar proveedor…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </Field>
          <Field label="Número de documento">
            <input className="input" value={draft.document_number} onChange={(e) => set('document_number', e.target.value)} placeholder="Ej: 019" />
          </Field>
          <Field label="Número de factura">
            <input className="input" value={draft.invoice_number} onChange={(e) => set('invoice_number', e.target.value)} placeholder="Ej: 4300195182" />
          </Field>
          <Field label="Depósito">
            <select className="input" value={draft.warehouse_id} onChange={(e) => set('warehouse_id', e.target.value)}>
              <option value="">Seleccionar depósito…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
          </Field>
          <Field label="Prioridad">
            <select className="input" value={draft.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="BAJA">Baja</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* BLOQUE 2 · Tipo */}
      <Section icon={Building2} title="Tipo de incidencia">
        <ReasonCards value={draft.reason} onChange={(r) => set('reason', r)} />
      </Section>

      {/* BLOQUE 3 · Productos */}
      <Section
        icon={Package}
        title="Productos afectados"
        action={
          <button className="btn-secondary h-9" onClick={() => setProductModal(true)} disabled={!draft.reason}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Agregar producto
          </button>
        }
      >
        {!draft.reason && <p className="text-sm text-ink-3">Elegí primero el tipo de incidencia.</p>}
        {draft.reason && draft.items.length === 0 && (
          <div className="border border-dashed border-border rounded-lg py-8 text-center text-sm text-ink-3">
            Sin productos. Agregá al menos uno.
          </div>
        )}
        {draft.items.length > 0 && (
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-3 text-left text-2xs font-bold uppercase tracking-wide text-ink-3">
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2 text-right">Esperado</th>
                  <th className="px-3 py-2 text-right">Recibido</th>
                  <th className="px-3 py-2 text-right">Dañado</th>
                  <th className="px-3 py-2 text-right">Diferencia</th>
                  <th className="px-3 py-2">UM</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {draft.items.map((it, i) => (
                  <tr key={i} className="hover:bg-surface-3">
                    <td className="px-3 py-2 font-mono text-xs font-bold">{it.codigo}</td>
                    <td className="px-3 py-2 max-w-[260px] truncate">{it.descripcion}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.expected_qty ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.received_qty ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.affected_qty ?? 0}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold tabular-nums">
                      {(it.difference_qty ?? 0) > 0 ? '+' : ''}{it.difference_qty ?? 0}
                    </td>
                    <td className="px-3 py-2 text-ink-3">{it.unit}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => removeItem(i)} className="text-ink-3 hover:text-faltante" aria-label="Quitar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Descripción */}
      <Section icon={FileText} title="Descripción de la incidencia">
        <textarea
          className="input min-h-[96px] py-2.5 resize-y"
          maxLength={2000}
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Detalle de lo detectado en la recepción…"
        />
        <div className="text-2xs text-ink-3 mt-1 text-right">{draft.description.length}/2000</div>
      </Section>

      {/* Barra de acciones fija */}
      <div className="fixed bottom-0 left-0 right-0 md:pl-64 bg-surface/90 backdrop-blur border-t border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-2 px-6 py-3">
          <button className="btn-ghost" onClick={() => navigate('/incidents')} disabled={saving}>Cancelar</button>
          <button className="btn-secondary" onClick={() => save(true)} disabled={saving}>
            <Save className="h-4 w-4" /> Guardar borrador
          </button>
          <button className="btn-primary" onClick={() => save(false)} disabled={saving}>
            {saving ? 'Guardando…' : 'Crear incidencia'}
          </button>
        </div>
      </div>

      <ProductSelectorModal open={productModal} reason={draft.reason} onClose={() => setProductModal(false)} onAdd={addItem} />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand" strokeWidth={2} />
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
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
