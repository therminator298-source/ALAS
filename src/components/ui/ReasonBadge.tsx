import type { IncidentReason } from '@/types';
import { REASON_LABELS, REASON_STYLES } from '@/config/constants';
import { cn } from '@/lib/utils';

const FALLBACK = { text: 'text-ink-2', soft: 'bg-surface-3', ring: 'ring-border', dot: 'bg-ink-2' };

export function ReasonBadge({ reason, className }: { reason: IncidentReason; className?: string }) {
  const s = REASON_STYLES[reason] ?? FALLBACK;
  return (
    <span className={cn('chip', s.soft, s.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {REASON_LABELS[reason]}
    </span>
  );
}
