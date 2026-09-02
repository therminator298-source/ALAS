import type { IncidentStatus } from '@/types';
import { STATUS_LABELS, STATUS_STYLES } from '@/config/constants';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn('chip', s.soft, s.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
