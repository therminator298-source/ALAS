import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { Placeholder } from '@/pages/Placeholder';
import { IncidentsView } from '@/features/incidents/IncidentsView';
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
  return <Navigate to={user.rol === 'CALENDARIO' ? '/calendario' : '/incidents'} replace />;
}

function ReceptionRouteGuard() {
  const { user, loading } = useSession();
  if (loading) return null;
  return user.rol === 'CALENDARIO' ? <Navigate to="/calendario" replace /> : <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Documentos imprimibles A4 — fuera del AppShell (sin sidebar/topbar) */}
        <Route element={<ReceptionRouteGuard />}>
          <Route path="/incidents/:id/print" element={<IncidentPrint />} />
        </Route>

        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />

          <Route element={<ReceptionRouteGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/incidents" element={<IncidentsView title="Todas las incidencias" subtitle="Listado completo" />} />
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

            {/* Apartados nuevos (se construyen por fase, cada uno con su Supabase) */}
            <Route path="/acuses" element={<AcusesView />} />
          </Route>
          <Route path="/calendario" element={<CalendarioView />} />

          <Route path="*" element={<Placeholder title="Página no encontrada" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
