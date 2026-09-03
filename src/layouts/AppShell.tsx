import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import gsap from 'gsap';
import { CommandPalette } from '@/components/CommandPalette';
import { MobileNav } from '@/components/MobileNav';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { ToastHost } from '@/components/ui/toast';
import { useSession } from '@/store/session';

export function AppShell() {
  const { user, loading, source, error, requireSso, signOut, goToLauncher } = useSession();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' },
      );
    }, el);
    return () => ctx.revert();
  }, [location.pathname]);

  if (loading) return <SessionLoading />;
  if (requireSso && error) return <SessionRequired error={error} onLogin={goToLauncher} />;

  return (
    <div className="alas-model-layout">
      <div className="alas-model-shell">
        <Sidebar
          user={user}
          sessionSource={source}
          onLogout={signOut}
          onReturnToLauncher={goToLauncher}
        />
        <section className="alas-model-stage">
          <Topbar notifCount={0} />
          <main ref={mainRef} className="alas-model-content pb-16 md:pb-0">
            <Outlet />
          </main>
        </section>
        <MobileNav />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <ToastHost />
      </div>
    </div>
  );
}

function SessionLoading() {
  return (
    <div className="alas-model-layout">
      <div className="alas-model-shell grid place-items-center">
        <div className="alas-session-panel flex flex-col items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-white shadow-pop">
            <img src="/icon-192.png" alt="ALAS" className="h-12 w-12 rounded-xl object-contain" />
          </div>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-brand">ALAS</p>
            <h1 className="text-xl font-extrabold text-ink">Validando acceso</h1>
            <p className="mt-1 text-sm font-medium text-ink-2">Conectando calendario con el launcher.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionRequired({ error, onLogin }: { error: string; onLogin: () => void }) {
  const isPermissionError = error === 'NO_PERMISSION';

  return (
    <div className="alas-model-layout">
      <div className="alas-model-shell grid place-items-center px-4">
        <section className="alas-session-panel">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-brand-soft text-brand">
            {isPermissionError ? <ShieldAlert className="h-7 w-7" /> : <LogIn className="h-7 w-7" />}
          </div>
          <img src="/logo-alas.png" alt="ALAS" className="mx-auto mt-5 h-8 w-auto" />
          <h1 className="mt-5 text-xl font-extrabold text-ink">
            {isPermissionError ? 'Sin permiso para Calendario' : 'Iniciar sesion desde el launcher'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            {isPermissionError
              ? 'Tu usuario esta conectado, pero no tiene habilitado el modulo calendario.'
              : 'Para abrir este modulo en produccion, entra desde el launcher ALAS con tu usuario.'}
          </p>
          <button onClick={onLogin} className="btn-primary mt-6 w-full">
            <LogIn className="h-4 w-4" />
            Volver al launcher
          </button>
        </section>
      </div>
    </div>
  );
}
