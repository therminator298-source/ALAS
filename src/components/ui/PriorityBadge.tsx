import type { IncidentPriority } from '@/types';
import { PRIORITY_LABELS, PRIORITY_STYLES } from '@/config/constants';
import { cn } from '@/lib/utils';

export function PriorityBadge({ priority, className }: { priority: IncidentPriority; className?: string }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className={cn('chip', s.soft, s.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
