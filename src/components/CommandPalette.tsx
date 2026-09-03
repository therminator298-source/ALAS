import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  label: string;
  hint?: string;
  action: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      { label: 'Nueva incidencia', hint: 'Crear', action: () => navigate('/incidents/new') },
      { label: 'Ir a Pendientes', hint: 'Navegar', action: () => navigate('/incidents/pending') },
      { label: 'Ir a En revisión', hint: 'Navegar', action: () => navigate('/incidents/review') },
      { label: 'Ir a Verificadas', hint: 'Navegar', action: () => navigate('/incidents/verified') },
      { label: 'Ir a Terminadas', hint: 'Navegar', action: () => navigate('/incidents/completed') },
      { label: 'Ir al Dashboard', hint: 'Navegar', action: () => navigate('/dashboard') },
      { label: 'Ir a Proveedores', hint: 'Navegar', action: () => navigate('/suppliers') },
      { label: 'Ir a Reportes', hint: 'Navegar', action: () => navigate('/reports') },
    ],
    [navigate],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const run = (i: number) => {
    const cmd = results[i];
    if (cmd) {
      cmd.action();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal>
      <button className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Cerrar" />
      <div className="relative w-full max-w-xl card shadow-pop overflow-hidden">
        <div className="flex items-center gap-3 h-14 px-4 border-b border-border">
          <Search className="h-5 w-5 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); run(active); }
              else if (e.key === 'Escape') onClose();
            }}
            placeholder="Buscar acción, incidencia, proveedor…"
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-3"
          />
          <kbd className="font-mono text-2xs font-semibold px-1.5 py-0.5 rounded border border-border text-ink-3">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <div className="px-3 py-6 text-center text-sm text-ink-3">Sin resultados</div>}
          {results.map((c, i) => (
            <button
              key={c.label}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(i)}
              className={cn(
                'w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm text-left transition-colors',
                i === active ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-surface-3',
              )}
            >
              <span className="flex-1 font-medium">{c.label}</span>
              {c.hint && <span className="text-2xs font-semibold text-ink-3">{c.hint}</span>}
              {i === active && <CornerDownLeft className="h-4 w-4 text-brand" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
