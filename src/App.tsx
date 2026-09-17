import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { Placeholder } from '@/pages/Placeholder';
import { IncidentsView } from '@/features/incidents/IncidentsView';
import { IncidentsBoard } from '@/features/incidents/board/IncidentsBoard';
import { NewIncident } from '@/features/incidents/NewIncident';
import { IncidentDetail } from '@/features/incidents/IncidentDetail';
import { Reports } from '@/pages/Reports';
import { Suppliers } from '@/pages/Suppliers';
import { Products } from '@/pages/Products';
import { IncidentPrint } from '@/pages/IncidentPrint';
import { Audit } from '@/pages/Audit';
import { AcusesView } from '@/features/acuses/AcusesView';
import { CalendarioView } from '@/features/calendario/CalendarioView';
import { useSession } from '@/store/session';

function HomeRedirect() {
  const { user } = useSession();
  const target = user.rol === 'CALENDARIO'
    ? '/calendario'
    : user.rol === 'ACUSES'
      ? '/acuses'
      : '/incidents';
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
          <Route path="/incidents/:id/print" element={<IncidentPrint />} />
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
