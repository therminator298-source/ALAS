import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { getIncident, type IncidentDetail as Detail } from '@/services/incidentDetail';
import { IncidentPrintTemplate } from '@/features/incidents/IncidentPrintTemplate';
import '@/features/incidents/incident-print.css';

export function IncidentPrint() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getIncident(id).then((d) => {
      if (!alive) return;
      setDetail(d);
      setLoading(false);
      if (d) document.title = `${d.incident.incident_number} · ${d.incident.supplier_nombre ?? ''}`.trim();
    });
    return () => {
      alive = false;
      document.title = 'Incidencias de Recepción';
    };
  }, [id]);

  if (loading) {
    return <div className="p-6 text-sm text-ink-3">Preparando documento…</div>;
  }
  if (!detail) {
    return <div className="p-6 text-sm text-ink-3">No se encontró la incidencia {id}.</div>;
  }

  return (
    <div className="pd-viewport">
      <div className="pd-toolbar no-print">
        <button onClick={() => navigate(`/incidents/${detail.incident.incident_number}`)} className="btn-secondary h-9">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Volver
        </button>
        <button onClick={() => window.print()} className="btn-primary h-9 ml-auto">
          <Printer className="h-4 w-4" strokeWidth={2.5} /> Imprimir / Guardar PDF
        </button>
      </div>
      <IncidentPrintTemplate detail={detail} />
    </div>
  );
}
