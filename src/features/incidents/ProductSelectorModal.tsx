import { useEffect, useRef, useState } from 'react';
import { Search, Package, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { searchProducts } from '@/services/catalogs';
import { cn } from '@/lib/utils';
import type { Product, IncidentReason } from '@/types';
import type { NewIncidentItem } from '@/services/incidents';

interface Props {
  open: boolean;
  reason: IncidentReason | null;
  onClose: () => void;
  onAdd: (item: NewIncidentItem) => void;
}

export function ProductSelectorModal({ open, reason, onClose, onAdd }: Props) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [picked, setPicked] = useState<Product | null>(null);
  const [expected, setExpected] = useState('0');
  const [received, setReceived] = useState('0');
  const [affected, setAffected] = useState('0');
  const [lot, setLot] = useState('');
  const [obs, setObs] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTerm(''); setPicked(null); setExpected('0'); setReceived('0'); setAffected('0'); setLot(''); setObs('');
      searchProducts('').then(setResults);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchProducts(term).then(setResults), 220);
    return () => clearTimeout(t);
  }, [term, open]);

  const isAveriado = reason === 'AVERIADO';

  function confirm() {
    if (!picked) return;
    const exp = Number(expected) || 0;
    const rec = Number(received) || 0;
    const aff = Number(affected) || 0;
    const diff = reason === 'SOBRANTE' ? rec - exp : reason === 'FALTANTE' ? exp - rec : aff;
    onAdd({
      product_id: picked.id.startsWith('m-') ? null : picked.id,
      codigo: picked.codigo,
      descripcion: picked.descripcion,
      expected_qty: exp,
      received_qty: rec,
      affected_qty: aff,
      difference_qty: diff,
      unit: picked.um,
      lot: lot.trim() || null,
      observation: obs.trim() || null,
    });
    onClose();
  }

  const canConfirm = !!picked && (isAveriado ? Number(affected) > 0 : Number(expected) >= 0 && Number(received) >= 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar producto"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={confirm} disabled={!canConfirm}>
            <Check className="h-4 w-4" strokeWidth={2.5} /> Agregar producto
          </button>
        </>
      }
    >
      {/* Buscador */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
        <input
          ref={searchRef}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) { e.preventDefault(); setPicked(results[0]); } }}
          placeholder="Buscar por código, descripción, EAN o SKU…"
          className="input pl-9"
        />
      </div>

      {/* Resultados */}
      <div className="border border-border rounded-lg divide-y divide-border max-h-56 overflow-y-auto mb-4">
        {results.length === 0 && <div className="px-3 py-6 text-center text-sm text-ink-3">Sin resultados</div>}
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => setPicked(p)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
              picked?.id === p.id ? 'bg-brand-soft' : 'hover:bg-surface-3',
            )}
          >
            <Package className="h-4 w-4 text-ink-3 shrink-0" />
            <span className="font-mono text-xs font-bold text-ink w-28 shrink-0">{p.codigo}</span>
            <span className="text-sm text-ink truncate flex-1">{p.descripcion}</span>
            <span className="text-2xs font-semibold text-ink-3">{p.um}</span>
            {picked?.id === p.id && <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />}
          </button>
        ))}
      </div>

      {/* Cantidades (según motivo) */}
      {picked && (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="text-2xs font-bold uppercase tracking-wide text-ink-3">
            {picked.codigo} · {picked.descripcion}
          </div>
          {isAveriado ? (
            <Field label="Cantidad dañada *">
              <input type="number" min="0" className="input" value={affected} onChange={(e) => setAffected(e.target.value)} autoFocus />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad esperada">
                <input type="number" min="0" className="input" value={expected} onChange={(e) => setExpected(e.target.value)} />
              </Field>
              <Field label="Cantidad recibida">
                <input type="number" min="0" className="input" value={received} onChange={(e) => setReceived(e.target.value)} />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lote (opcional)">
              <input className="input" value={lot} onChange={(e) => setLot(e.target.value)} />
            </Field>
            <Field label="Unidad">
              <input className="input bg-surface-2" value={picked.um} readOnly />
            </Field>
          </div>
          <Field label="Observación (opcional)">
            <input className="input" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej: SOLO LAS TAPAS" />
          </Field>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-2 mb-1">{label}</span>
      {children}
    </label>
  );
}
