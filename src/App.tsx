import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { Placeholder } from '@/pages/Placeholder';
import { IncidentsView } from '@/features/incidents/IncidentsView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/incidents" element={<IncidentsView title="Todas las incidencias" subtitle="Listado completo" />} />
          <Route path="/incidents/new" element={<Placeholder title="Nueva incidencia" phase="Fase 5" />} />
          <Route path="/incidents/pending" element={<IncidentsView title="Pendientes" fixedStatus="PENDIENTE" />} />
          <Route path="/incidents/review" element={<IncidentsView title="En revisión" fixedStatus="EN_REVISION" />} />
          <Route path="/incidents/verified" element={<IncidentsView title="Verificadas" fixedStatus="VERIFICADO" />} />
          <Route path="/incidents/resolution" element={<IncidentsView title="En resolución" fixedStatus="EN_RESOLUCION" />} />
          <Route path="/incidents/completed" element={<IncidentsView title="Terminadas" fixedStatus="TERMINADO" />} />
          <Route path="/incidents/:id" element={<Placeholder title="Detalle de incidencia" phase="Fase 6 (Drawer)" />} />

          <Route path="/reports" element={<Placeholder title="Reportes" phase="Fase 9" />} />
          <Route path="/suppliers" element={<Placeholder title="Proveedores" phase="Fase 9" />} />
          <Route path="/suppliers/:id" element={<Placeholder title="Perfil de proveedor" phase="Fase 9" />} />
          <Route path="/products" element={<Placeholder title="Productos" phase="Fase 9" />} />
          <Route path="/audit" element={<Placeholder title="Auditoría" phase="Fase 10" />} />
          <Route path="/settings" element={<Placeholder title="Configuración" phase="Fase 12" />} />

          <Route path="*" element={<Placeholder title="Página no encontrada" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
