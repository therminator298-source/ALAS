import { PackagePlus, PackageMinus, PackageX, Check, type LucideIcon } from 'lucide-react';
import type { IncidentReason } from '@/types';
import { cn } from '@/lib/utils';

interface ReasonDef {
  code: IncidentReason;
  name: string;
  desc: string;
  icon: LucideIcon;
  ring: string;
  iconBg: string;
  iconText: string;
}

const REASONS: ReasonDef[] = [
  { code: 'SOBRANTE', name: 'Sobrante', desc: 'Se recibió más de lo esperado', icon: PackagePlus, ring: 'ring-sobrante border-sobrante', iconBg: 'bg-sobrante/10', iconText: 'text-sobrante' },
  { code: 'FALTANTE', name: 'Faltante', desc: 'Se recibió menos de lo esperado', icon: PackageMinus, ring: 'ring-faltante border-faltante', iconBg: 'bg-faltante/10', iconText: 'text-faltante' },
  { code: 'AVERIADO', name: 'Averiado', desc: 'Mercadería dañada o rota', icon: PackageX, ring: 'ring-averiado border-averiado', iconBg: 'bg-averiado/10', iconText: 'text-averiado' },
];

export function ReasonCards({ value, onChange }: { value: IncidentReason | null; onChange: (r: IncidentReason) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {REASONS.map((r) => {
        const active = value === r.code;
        const Icon = r.icon;
        return (
          <button
            key={r.code}
            type="button"
            onClick={() => onChange(r.code)}
            className={cn(
              'relative flex items-center gap-3 p-4 rounded-card border text-left transition-all duration-200 ease-smooth',
              active
                ? cn('ring-2 bg-surface -translate-y-0.5 shadow-card', r.ring)
                : 'border-border bg-surface hover:border-border-strong hover:-translate-y-0.5 hover:shadow-card',
            )}
          >
            <div className={cn('grid place-items-center h-11 w-11 rounded-lg shrink-0', r.iconBg, r.iconText)}>
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink">{r.name}</div>
              <div className="text-2xs text-ink-3 leading-tight">{r.desc}</div>
            </div>
            {active && (
              <span className={cn('absolute top-2.5 right-2.5 grid place-items-center h-5 w-5 rounded-full text-white', r.iconText.replace('text-', 'bg-'))}>
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
