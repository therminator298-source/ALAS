import type { IncidentDetail } from '@/services/incidentDetail';
import { COMPANY, APP_NAME, REASON_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/config/constants';
import { fmtDate, fmtDateTime } from '@/lib/utils';

/** Documento A4 imprimible de una incidencia (usa incident-print.css). */
export function IncidentPrintTemplate({ detail }: { detail: IncidentDetail }) {
  const i = detail.incident;
  const items = detail.items;

  return (
    <div className="pd-sheet">
      {/* Encabezado */}
      <header className="pd-head">
        <div>
          <div className="pd-brand-logo">{COMPANY.name}</div>
          <div className="pd-brand-sub">{COMPANY.branch}</div>
          <div className="pd-brand-addr">
            {COMPANY.address}<br />
            {COMPANY.city} · Tel. {COMPANY.phone}
          </div>
        </div>
        <div className="pd-doc">
          <div className="pd-doc-title">Informe de Incidencia de Recepción</div>
          <div className="pd-doc-number">{i.incident_number}</div>
          <span className="pd-doc-status">{STATUS_LABELS[i.status]}</span>
        </div>
      </header>

      {/* Datos generales */}
      <div className="pd-section-title">Datos de la incidencia</div>
      <div className="pd-meta">
        <Field label="Proveedor" value={i.supplier_nombre ?? '—'} />
        <Field label="Factura" value={i.invoice_number ?? '—'} mono />
        <Field label="Documento / Acuse" value={i.document_number ?? '—'} mono />
        <Field label="Motivo" value={REASON_LABELS[i.reason]} />
        <Field label="Prioridad" value={PRIORITY_LABELS[i.priority]} />
        <Field label="Fecha emisión" value={fmtDate(i.emission_date)} />
        <Field label="Creado por" value={i.created_by_nombre ?? '—'} />
        <Field label="Responsable" value={i.assigned_to_nombre ?? 'Sin asignar'} />
        <Field label="Registrado" value={fmtDateTime(i.created_at)} />
      </div>

      {i.description && (
        <>
          <div className="pd-section-title">Descripción</div>
          <div className="pd-desc">{i.description}</div>
        </>
      )}

      {/* Ítems */}
      <div className="pd-section-title">Detalle de productos ({items.length})</div>
      {items.length === 0 ? (
        <div className="pd-empty">Sin ítems registrados en esta incidencia.</div>
      ) : (
        <table className="pd-table">
          <thead>
            <tr>
              <th style={{ width: '4%' }}>#</th>
              <th style={{ width: '16%' }}>Código</th>
              <th>Descripción</th>
              <th style={{ width: '7%' }}>U.M.</th>
              <th style={{ width: '9%', textAlign: 'right' }}>Esperado</th>
              <th style={{ width: '9%', textAlign: 'right' }}>Recibido</th>
              <th style={{ width: '9%', textAlign: 'right' }}>Afectado</th>
              <th style={{ width: '9%', textAlign: 'right' }}>Dif.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td className="pd-num">{idx + 1}</td>
                <td className="pd-mono">{it.codigo}</td>
                <td>
                  {it.descripcion}
                  {it.observation ? <div style={{ color: '#6b7280', fontSize: '9px' }}>Obs.: {it.observation}</div> : null}
                </td>
                <td>{it.unit}</td>
                <td className="pd-num">{it.expected_qty}</td>
                <td className="pd-num">{it.received_qty}</td>
                <td className="pd-num">{it.affected_qty}</td>
                <td className="pd-num">{it.difference_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Firmas */}
      <div className="pd-signs">
        <div className="pd-sign">
          <div className="pd-sign-line" />
          <div className="pd-sign-role">Controlado por</div>
          <div className="pd-sign-name">{i.created_by_nombre ?? ''}</div>
        </div>
        <div className="pd-sign">
          <div className="pd-sign-line" />
          <div className="pd-sign-role">Jefe de Logística</div>
          <div className="pd-sign-name">{i.assigned_to_nombre ?? ''}</div>
        </div>
      </div>

      {/* Pie */}
      <footer className="pd-foot">
        <span>{APP_NAME} · {COMPANY.name}</span>
        <span>Generado el {fmtDateTime(new Date().toISOString())}</span>
      </footer>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="pd-field">
      <span className="pd-label">{label}</span>
      <span className={mono ? 'pd-value mono' : 'pd-value'}>{value}</span>
    </div>
  );
}
