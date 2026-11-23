import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { Placeholder } from '@/pages/Placeholder';
import { IncidentsBoard } from '@/features/incidents/board/IncidentsBoard';
import { useSession } from '@/store/session';

/* Cada apartado se baja cuando se entra, no en el arranque. El tablero queda
   estatico porque es la pantalla de entrada: hacerlo diferido agregaria un
   viaje de red antes del primer dibujo. */
const IncidentsView = lazy(() => import('@/features/incidents/IncidentsView').then(m => ({ default: m.IncidentsView })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const NewIncident = lazy(() => import('@/features/incidents/NewIncident').then(m => ({ default: m.NewIncident })));
const IncidentDetail = lazy(() => import('@/features/incidents/IncidentDetail').then(m => ({ default: m.IncidentDetail })));
const Reports = lazy(() => import('@/pages/Reports').then(m => ({ default: m.Reports })));
const Suppliers = lazy(() => import('@/pages/Suppliers').then(m => ({ default: m.Suppliers })));
const Products = lazy(() => import('@/pages/Products').then(m => ({ default: m.Products })));
const IncidentPrint = lazy(() => import('@/pages/IncidentPrint').then(m => ({ default: m.IncidentPrint })));
const Audit = lazy(() => import('@/pages/Audit').then(m => ({ default: m.Audit })));
const AcusesView = lazy(() => import('@/features/acuses/AcusesView').then(m => ({ default: m.AcusesView })));
const CalendarioView = lazy(() => import('@/features/calendario/CalendarioView').then(m => ({ default: m.CalendarioView })));

function HomeRedirect() {
  const { user } = useSession();
  /* La entrada es Acuses para todos. La única excepción es el rol CALENDARIO,
     que no tiene permiso para ningún otro apartado: mandarlo a /acuses lo haría
     rebotar en SectionRouteGuard y volver igual a /calendario. */
  const target = user.rol === 'CALENDARIO' ? '/calendario' : '/acuses';
  return <Navigate to={target} replace />;
}

type AppSection = 'recepcion' | 'calendario' | 'acuses';

function SectionRouteGuard({ section }: { section: AppSection }) {
  const { user, loading } = useSession();
  if (loading) return null;
  if (user.rol === 'CALENDARIO' && section !== 'calendario') {
    return <Navigate to="/calendario" replace />;
  }
  if (user.rol === 'ACUSES' && section !== 'acuses') {
    return <Navigate to="/acuses" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Documentos imprimibles A4 — fuera del AppShell (sin sidebar/topbar) */}
        <Route element={<SectionRouteGuard section="recepcion" />}>
          <Route path="/incidents/:id/print" element={<Suspense fallback={null}><IncidentPrint /></Suspense>} />
        </Route>

        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />

          <Route element={<SectionRouteGuard section="recepcion" />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* El tablero es la vista principal de Incidencias. La tabla no se
                fue: vive en /incidents/list, que sigue siendo mejor para
                buscar por número o exportar. El segmento estático le gana al
                :id de más abajo en el ranking de React Router, así que no hay
                que ordenarlas a mano. */}
            <Route path="/incidents" element={<IncidentsBoard />} />
            <Route path="/incidents/list" element={<IncidentsView title="Todas las incidencias" subtitle="Listado completo" />} />
            <Route path="/incidents/new" element={<NewIncident />} />
            <Route path="/incidents/pending" element={<IncidentsView title="Pendientes" fixedStatus="PENDIENTE" />} />
            <Route path="/incidents/review" element={<IncidentsView title="En revisión" fixedStatus="EN_REVISION" />} />
            <Route path="/incidents/verified" element={<IncidentsView title="Verificadas" fixedStatus="VERIFICADO" />} />
            <Route path="/incidents/resolution" element={<IncidentsView title="En resolución" fixedStatus="EN_RESOLUCION" />} />
            <Route path="/incidents/completed" element={<IncidentsView title="Terminadas" fixedStatus="TERMINADO" />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />

            <Route path="/reports" element={<Reports />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/settings" element={<Placeholder title="Configuración" phase="Fase 12" />} />

          </Route>
          <Route element={<SectionRouteGuard section="acuses" />}>
            <Route path="/acuses" element={<AcusesView />} />
          </Route>
          <Route element={<SectionRouteGuard section="calendario" />}>
            <Route path="/calendario" element={<CalendarioView />} />
          </Route>

          <Route path="*" element={<Placeholder title="Página no encontrada" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
