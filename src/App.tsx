import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { Placeholder } from '@/pages/Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/incidents" element={<Placeholder title="Incidencias" phase="Fase 4 (Listado)" />} />
          <Route path="/incidents/new" element={<Placeholder title="Nueva incidencia" phase="Fase 5" />} />
          <Route path="/incidents/pending" element={<Placeholder title="Pendientes" phase="Fase 4" />} />
          <Route path="/incidents/review" element={<Placeholder title="En revisión" phase="Fase 4" />} />
          <Route path="/incidents/verified" element={<Placeholder title="Verificadas" phase="Fase 4" />} />
          <Route path="/incidents/resolution" element={<Placeholder title="En resolución" phase="Fase 4" />} />
          <Route path="/incidents/completed" element={<Placeholder title="Terminadas" phase="Fase 4" />} />
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
