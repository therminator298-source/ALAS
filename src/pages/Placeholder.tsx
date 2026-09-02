import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export function Placeholder({ title, phase }: { title: string; phase?: string }) {
  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader title={title} />
      <div className="card p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="grid place-items-center h-14 w-14 rounded-full bg-surface-3 text-ink-3">
          <Construction className="h-7 w-7" />
        </div>
        <div className="text-base font-bold text-ink">Módulo en construcción</div>
        <p className="text-sm text-ink-3 max-w-sm">
          Esta sección se implementará {phase ? `en la ${phase}` : 'en una próxima fase'} del desarrollo.
        </p>
      </div>
    </div>
  );
}
