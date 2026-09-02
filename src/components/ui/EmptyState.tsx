import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
      <div className="grid place-items-center h-14 w-14 rounded-full bg-surface-3 text-ink-3">
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-base font-bold text-ink">{title}</div>
      {message && <p className="text-sm text-ink-3 max-w-sm">{message}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
