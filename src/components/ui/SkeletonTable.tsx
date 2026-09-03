export function SkeletonTable({ rows = 8, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border" aria-hidden>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((__, c) => (
            <div
              key={c}
              className="h-4 rounded bg-surface-3 animate-pulse"
              style={{ width: c === 1 ? '30%' : c === 0 ? '9rem' : '10%' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
