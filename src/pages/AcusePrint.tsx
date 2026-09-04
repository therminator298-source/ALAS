import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { getAcuse } from '@/features/acuses/acuseApi';
import { estadoKey, type AcuseFull } from '@/features/acuses/types';
import '@/features/incidents/incident-print.css';

const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', en_reparto: 'En Reparto', entregado: 'Entregado', anulado: 'Anulado' };
const fmt = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function AcusePrint() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [acuse, setAcuse] = useState<AcuseFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const numId = Number(id);
    getAcuse(numId).then((a) => {
      if (!alive) return;
      setAcuse(a); setLoading(false);
      if (a) document.title = `${a.nro_acuse} · ${a.cliente_nombre ?? ''}`.trim();
    });
    return () => { alive = false; document.title = 'Incidencias de Recepción'; };
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-ink-3">Preparando documento…</div>;
  if (!acuse) return <div className="p-6 text-sm text-ink-3">No se encontró el acuse {id}.</div>;

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=84x84&margin=0&data=${encodeURIComponent(`https://alas.com.py/ acuse ${acuse.nro_acuse}`)}`;

  return (
    <div className="pd-viewport">
      <div className="pd-toolbar no-print">
        <button onClick={() => navigate('/acuses')} className="btn-secondary h-9">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Volver
        </button>
        <button onClick={() => window.print()} className="btn-primary h-9 ml-auto">
          <Printer className="h-4 w-4" strokeWidth={2.5} /> Imprimir / Guardar PDF
        </button>
      </div>

      <div className="pd-sheet">
        {/* Encabezado */}
        <div className="pd-head">
          <div>
            <img src="/logo-alas.png" alt="ALAS" style={{ height: 40, width: 'auto' }} />
            <div className="pd-brand-sub">ALAS S.A. · Sistema Logístico</div>
            <div className="pd-brand-addr">Acuse de recibo de mercadería</div>
          </div>
          <div className="pd-doc" style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, alignItems: 'flex-start' }}>
            <div>
              <div className="pd-doc-title">Acuse de Recibo</div>
              <div className="pd-doc-number" style={{ color: '#0b5f8d' }}>{acuse.nro_acuse}</div>
              <div><span className="pd-doc-status">{ESTADO_LABEL[estadoKey(acuse.estado)]}</span></div>
            </div>
            <img src={qr} alt="QR" width={84} height={84} style={{ marginTop: 2 }} />
          </div>
        </div>

        {/* Cliente */}
        <div className="pd-section-title" style={{ color: '#0b5f8d' }}>Cliente</div>
        <div className="pd-meta">
          <Field label="Nombre" value={acuse.cliente_nombre ?? acuse.cod_cliente} />
          <Field label="RUC" value={acuse.cliente_ruc} mono />
          <Field label="Código" value={acuse.cod_cliente} mono />
          <Field label="Dirección" value={acuse.cliente_direccion} />
          <Field label="Ciudad" value={acuse.cliente_ciudad} />
          <Field label="Teléfono" value={acuse.cliente_telefono} />
        </div>

        {/* Datos del acuse */}
        <div className="pd-section-title" style={{ color: '#0b5f8d' }}>Datos del acuse</div>
        <div className="pd-meta">
          <Field label="Fecha de emisión" value={fmt(acuse.fecha_emision)} />
          <Field label="Fecha de entrega" value={fmt(acuse.fecha_entrega)} />
          <Field label="Zona / ruta" value={acuse.zona} />
          <Field label="Repartidor" value={acuse.repartidor_nombre} />
          <Field label="Registrado por" value={acuse.usuario} />
          <Field label="Estado" value={ESTADO_LABEL[estadoKey(acuse.estado)]} />
        </div>
        {acuse.observacion && <div className="pd-desc">{acuse.observacion}</div>}

        {/* Detalle */}
        <div className="pd-section-title" style={{ color: '#0b5f8d' }}>Detalle de mercadería</div>
        <table className="pd-table">
          <thead>
            <tr>
              <th style={{ width: '18%' }}>Código</th><th>Descripción</th>
              <th className="pd-num" style={{ width: '14%' }}>Cantidad</th>
              <th style={{ width: '10%' }}>UM</th><th style={{ width: '24%' }}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {acuse.detalles.length === 0 ? (
              <tr><td colSpan={5} className="pd-empty">Sin detalle</td></tr>
            ) : acuse.detalles.map((d, i) => (
              <tr key={i}>
                <td className="pd-mono">{d.cod_mercaderia}</td>
                <td>{d.descripcion ?? '—'}</td>
                <td className="pd-num">{d.cantidad}</td>
                <td>{d.um ?? '—'}</td>
                <td>{d.nota ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Firmas */}
        <div className="pd-signs">
          <div className="pd-sign">
            <div className="pd-sign-line" />
            <div className="pd-sign-role">Recibí conforme</div>
            <div className="pd-sign-name">{acuse.cliente_nombre ?? ''}</div>
          </div>
          <div className="pd-sign">
            <div className="pd-sign-line" />
            <div className="pd-sign-role">Repartidor</div>
            <div className="pd-sign-name">{acuse.repartidor_nombre ?? ''}</div>
          </div>
        </div>

        {/* Pie */}
        <div className="pd-foot">
          <span>Documento generado el {new Date().toLocaleString('es-PY')}</span>
          <span>ALAS · Acuses de recibo</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="pd-field">
      <span className="pd-label">{label}</span>
      <span className={mono ? 'pd-value mono' : 'pd-value'}>{value || '—'}</span>
    </div>
  );
}
