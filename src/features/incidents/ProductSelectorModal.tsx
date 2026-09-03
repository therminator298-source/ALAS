import { useEffect, useRef, useState } from 'react';
import { Search, Package, Check, Plus, CornerDownLeft } from 'lucide-react';
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

const REASON_LABEL: Record<string, string> = { SOBRANTE: 'sobrante', FALTANTE: 'faltante', AVERIADO: 'averiado' };

export function ProductSelectorModal({ open, reason, onClose, onAdd }: Props) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Product | null>(null);
  const [expected, setExpected] = useState('0');
  const [received, setReceived] = useState('0');
  const [affected, setAffected] = useState('0');
  const [lot, setLot] = useState('');
  const [obs, setObs] = useState('');
  const [addedCount, setAddedCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAveriado = reason === 'AVERIADO';

  function resetFields() {
    setPicked(null); setExpected('0'); setReceived('0'); setAffected('0'); setLot(''); setObs('');
  }

  useEffect(() => {
    if (open) {
      setTerm(''); setActive(0); setAddedCount(0); resetFields();
      setLoading(true);
      searchProducts('').then((r) => { setResults(r); setLoading(false); });
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => {
      searchProducts(term).then((r) => { setResults(r); setActive(0); setLoading(false); });
    }, 220);
    return () => clearTimeout(t);
  }, [term, open]);

  function pick(p: Product) {
    setPicked(p);
    requestAnimationFrame(() => qtyRef.current?.focus());
  }

  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]); }
  }

  // Autoscroll de la fila activa
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const exp = Number(expected) || 0;
  const rec = Number(received) || 0;
  const aff = Number(affected) || 0;
  const diff = reason === 'SOBRANTE' ? rec - exp : reason === 'FALTANTE' ? exp - rec : aff;
  const canConfirm = !!picked && (isAveriado ? aff > 0 : exp > 0 || rec > 0);

  function buildItem(): NewIncidentItem | null {
    if (!picked) return null;
    return {
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
    };
  }

  function confirm(keepOpen: boolean) {
    const item = buildItem();
    if (!item) return;
    onAdd(item);
    if (keepOpen) {
      setAddedCount((n) => n + 1);
      resetFields();
      setTerm('');
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar producto"
      size="lg"
      footer={
        <>
          {addedCount > 0 && (
            <span className="mr-auto text-2xs font-bold text-terminado">{addedCount} agregado{addedCount === 1 ? '' : 's'}</span>
          )}
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="btn-secondary" onClick={() => confirm(true)} disabled={!canConfirm}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Agregar y otro
          </button>
          <button className="btn-primary" onClick={() => confirm(false)} disabled={!canConfirm}>
            <Check className="h-4 w-4" strokeWidth={2.5} /> Agregar
          </button>
        </>
      }
    >
      {/* Buscador */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
        <input
          ref={searchRef}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={onSearchKey}
          placeholder="Buscar por código o descripción…"
          className="input pl-9 pr-24"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-semibold text-ink-3 tabular-nums">
          {loading ? '…' : `${results.length} result.`}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-3 text-2xs text-ink-3">
        <CornerDownLeft className="h-3 w-3" /> Enter selecciona · ↑↓ navega
      </div>

      {/* Resultados */}
      <div ref={listRef} className="border border-border rounded-lg divide-y divide-border max-h-56 overflow-y-auto mb-4">
        {!loading && results.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-ink-3">Sin resultados para “{term}”.</div>
        )}
        {results.map((p, idx) => {
          const sel = picked?.id === p.id;
          const isActive = idx === active;
          return (
            <button
              key={p.id}
              data-idx={idx}
              onMouseEnter={() => setActive(idx)}
              onClick={() => pick(p)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                sel ? 'bg-brand-soft' : isActive ? 'bg-surface-3' : 'hover:bg-surface-3',
              )}
            >
              <Package className={cn('h-4 w-4 shrink-0', sel ? 'text-brand' : 'text-ink-3')} />
              <span className="font-mono text-xs font-bold text-ink w-28 shrink-0">{p.codigo}</span>
              <span className="text-sm text-ink truncate flex-1">{p.descripcion}</span>
              <span className="text-2xs font-semibold text-ink-3">{p.um}</span>
              {sel && <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>

      {/* Detalle del producto elegido */}
      {picked && (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-ink">{picked.codigo}</div>
              <div className="text-sm text-ink-2 truncate">{picked.descripcion}</div>
            </div>
            <div className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-center',
              diff !== 0 ? 'bg-brand-soft' : 'bg-surface-3',
            )}>
              <div className="text-2xs font-bold uppercase tracking-wide text-ink-3">{REASON_LABEL[reason ?? ''] ?? 'dif.'}</div>
              <div className="font-mono text-base font-extrabold tabular-nums text-brand leading-none">
                {diff > 0 ? '+' : ''}{diff} <span className="text-2xs text-ink-3">{picked.um}</span>
              </div>
            </div>
          </div>

          {isAveriado ? (
            <Field label="Cantidad dañada *">
              <input ref={qtyRef} type="number" min="0" className="input" value={affected}
                onChange={(e) => setAffected(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && canConfirm) confirm(false); }} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad esperada">
                <input ref={qtyRef} type="number" min="0" className="input" value={expected} onChange={(e) => setExpected(e.target.value)} />
              </Field>
              <Field label="Cantidad recibida">
                <input type="number" min="0" className="input" value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canConfirm) confirm(false); }} />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lote (opcional)">
              <input className="input" value={lot} onChange={(e) => setLot(e.target.value)} />
            </Field>
            <Field label="Unidad">
              <input className="input bg-surface-2" value={picked.um} readOnly tabIndex={-1} />
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
