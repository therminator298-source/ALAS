import { Ban, CheckCircle2, Clock, Truck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { estadoKey } from './types';

/* Los estados de Acuses no son los de Incidencias, por eso no sirve
   StatusBadge: son cuatro y el flujo es otro (emitido → en la calle →
   firmado por el cliente, o anulado). */
/* Tipado por la union que devuelve estadoKey, no por string: asi el compilador
   sabe que siempre hay entrada y no hace falta chequear undefined. */
const ESTADOS: Record<ReturnType<typeof estadoKey>, { label: string; soft: string; text: string; dot: string; icon: LucideIcon }> = {
  pendiente: { label: 'Pendiente', soft: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', icon: Clock },
  en_reparto: { label: 'En reparto', soft: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: Truck },
  entregado: { label: 'Entregado', soft: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  anulado: { label: 'Anulado', soft: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', icon: Ban },
};

export function AcuseEstadoBadge({ estado, className }: { estado: string; className?: string }) {
  const e = ESTADOS[estadoKey(estado)];
  return (
    <span className={cn('chip', e.soft, e.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', e.dot)} aria-hidden />
      {e.label}
    </span>
  );
}

export { ESTADOS as ACUSE_ESTADO_UI };
