-- ============================================================================
--  MIGRACIÓN DE DATOS HISTÓRICOS (desde DATOS SISTEMA.xlsx)
--  Prerrequisito: importar db/products.csv en la tabla 'products' (Table Editor)
--  ANTES de correr esto, para que los ítems resuelvan product_id.
--  Idempotente (se puede correr más de una vez sin duplicar).
-- ============================================================================

-- 1) PROVEEDORES (desde Nombre Cliente)
insert into suppliers (nombre)
select v.nombre from (values
  ('ZR DISTRIBUIDORA E.A.S.'),
  ('SHANGHAI AMC INTERNATIONAL TRADING'),
  ('CORTAG INDUSTRIA E COMERCIO LTDA'),
  ('ELETRICA DANUBIO IN. E COMERCIO'),
  ('FERROPAR S.A.'),
  ('NISAN SRL'),
  ('ORION S.R.L.'),
  ('MARSEG S.A.'),
  ('ATLANTIC S.A.E'),
  ('VIQUA'),
  ('Kingspan'),
  ('M. ANDRION SA'),
  ('FORTLEV INDUSTRIA E COMERCIO LTDA'),
  ('ALINA'),
  ('GUANGZHOU ULIX IND.TRADE GROUP LTD'),
  ('KOMELON CORPORATION'),
  ('ANSA'),
  ('BEIJING SANI-METAL I&E CO. LTD'),
  ('SUPRENS'),
  ('HEBEI QUNKUN METAL PRODUCTS CO.,LTD'),
  ('PLASTIAGRO S.R.L'),
  ('DOCOL METAIS SANITARIOS LTDA'),
  ('NICE BRASIL INDUSTRIA E COMERCIO'),
  ('OURENSE DO BRASIL IND ART MET LTDA'),
  ('MAZZAFERRO S.A. (ARATY)'),
  ('ARTHERMO S.R.L.'),
  ('PAMPEANO'),
  ('MULTITRACK'),
  ('CONSTRUCTORA BAMETAL SA'),
  ('YACY S.R.L.'),
  ('KRONA'),
  ('SHING HUNG INDUSTRIAL LIMITED'),
  ('ISOLANT AISLANTES SMART PY S.A.'),
  ('MAX METALURGICA'),
  ('SHOPPING TODO HOGAR S.A.'),
  ('OPTIMA'),
  ('YIEH CORP.'),
  ('SIL'),
  ('CRESUR S.A.'),
  ('HIDRO FILTROS'),
  ('ALIANCA METALURGICA'),
  ('SCHWEERS'),
  ('ZHONGSHAN ANTO'),
  ('BIASSONI E HIJOS SAICA'),
  ('PINCEIS ROMA LTDA'),
  ('MGS INDUS.E COMER.DE PLASTICO'),
  ('CLAVOS Y CIA'),
  ('ORIGAMI'),
  ('PLASTCOR DO BRASIL LTDA.'),
  ('ADIVAN TRADING S.A.'),
  ('T.A.O'),
  ('MOBILLE EXPORTACAO'),
  ('INDUSTRIA METALURGICA FERROTODO SA')
) v(nombre)
where not exists (select 1 from suppliers x where x.nombre = v.nombre);

-- 2) USUARIO faltante
insert into users (nombre, rol)
select 'Adrian Gomez','SUPERVISOR_RECEPCION'
where not exists (select 1 from users where nombre = 'Adrian Gomez');

-- 3) INCIDENCIAS
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000001', '5', '4300193858',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'AVERIADO', 'VERIFICADO', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-09-17T06:50:32.000Z', '2025-09-17T06:50:32.000Z', '2025-09-17T06:50:32.000Z', '2025-09-17T06:50:32.000Z', null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000002', '2', '4500031488',
  (select id from suppliers where nombre = 'SHANGHAI AMC INTERNATIONAL TRADING' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-09-22T14:59:19.000Z', '2025-09-22T14:59:19.000Z', '2025-09-22T14:59:19.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000003', '7', '4500033157',
  (select id from suppliers where nombre = 'CORTAG INDUSTRIA E COMERCIO LTDA' limit 1),
  'FALTANTE', 'VERIFICADO', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-09-24T13:05:03.000Z', '2025-09-24T13:05:03.000Z', '2025-09-24T13:05:03.000Z', '2025-09-24T13:05:03.000Z', null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000004', '4', null,
  (select id from suppliers where nombre = 'ELETRICA DANUBIO IN. E COMERCIO' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-09-25T08:25:34.000Z', '2025-09-25T08:25:34.000Z', '2025-09-25T08:25:34.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000005', '5', '2617',
  (select id from suppliers where nombre = 'FERROPAR S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-09-27T08:58:40.000Z', '2025-09-27T08:58:40.000Z', '2025-09-27T08:58:40.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000006', '6', '4500031488',
  (select id from suppliers where nombre = 'SHANGHAI AMC INTERNATIONAL TRADING' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-01T09:41:10.000Z', '2025-10-01T09:41:10.000Z', '2025-10-01T09:41:10.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000007', '7', '4300195078',
  (select id from suppliers where nombre = 'NISAN SRL' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-03T12:21:08.000Z', '2025-10-03T12:21:08.000Z', '2025-10-03T12:21:08.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000008', '8', '4300195182',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-06T16:31:23.000Z', '2025-10-06T16:31:23.000Z', '2025-10-06T16:31:23.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000009', '9', '4300195182',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-06T16:33:06.000Z', '2025-10-06T16:33:06.000Z', '2025-10-06T16:33:06.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000010', '10', '4300195321',
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-09T12:54:31.000Z', '2025-10-09T12:54:31.000Z', '2025-10-09T12:54:31.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000011', '11', '4300195464',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-11T08:47:22.000Z', '2025-10-11T08:47:22.000Z', '2025-10-11T08:47:22.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000012', '12', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-11T10:56:17.000Z', '2025-10-11T10:56:17.000Z', '2025-10-11T10:56:17.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000013', '15', null,
  (select id from suppliers where nombre = 'VIQUA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-13T09:09:03.000Z', '2025-10-13T09:09:03.000Z', '2025-10-13T09:09:03.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000014', '15', null,
  (select id from suppliers where nombre = 'Kingspan' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'José Villalba' limit 1),
  '2025-10-13T10:38:45.000Z', '2025-10-13T10:38:45.000Z', '2025-10-13T10:38:45.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000015', '16', null,
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-13T10:58:51.000Z', '2025-10-13T10:58:51.000Z', '2025-10-13T10:58:51.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000016', '17', null,
  null,
  'OTRO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-13T11:46:43.000Z', '2025-10-13T11:46:43.000Z', '2025-10-13T11:46:43.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000017', '18', null,
  (select id from suppliers where nombre = 'M. ANDRION SA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-13T11:47:04.000Z', '2025-10-13T11:47:04.000Z', '2025-10-13T11:47:04.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000018', '19', null,
  (select id from suppliers where nombre = 'FORTLEV INDUSTRIA E COMERCIO LTDA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'José Villalba' limit 1),
  '2025-10-16T10:15:15.000Z', '2025-10-16T10:15:15.000Z', '2025-10-16T10:15:15.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000019', '21', '545412',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-20T07:57:12.000Z', '2025-10-20T07:57:12.000Z', '2025-10-20T07:57:12.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000020', '22', '545412',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-20T16:08:21.000Z', '2025-10-20T16:08:21.000Z', '2025-10-20T16:08:21.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000021', '22', '4500032280',
  (select id from suppliers where nombre = 'ALINA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-24T14:10:46.000Z', '2025-10-24T14:10:46.000Z', '2025-10-24T14:10:46.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000022', '32', null,
  (select id from suppliers where nombre = 'GUANGZHOU ULIX IND.TRADE GROUP LTD' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-29T09:26:07.000Z', '2025-10-29T09:26:07.000Z', '2025-10-29T09:26:07.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000023', '32', null,
  (select id from suppliers where nombre = 'GUANGZHOU ULIX IND.TRADE GROUP LTD' limit 1),
  'AVERIADO', 'TERMINADO', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-29T09:37:25.000Z', '2025-10-29T09:37:25.000Z', '2025-10-29T09:37:25.000Z', '2025-10-29T09:37:25.000Z', '2025-10-29T09:37:25.000Z'
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000024', '25', null,
  null,
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-30T09:13:53.000Z', '2025-10-30T09:13:53.000Z', '2025-10-30T09:13:53.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000025', '26', '2872',
  (select id from suppliers where nombre = 'M. ANDRION SA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-10-31T08:58:45.000Z', '2025-10-31T08:58:45.000Z', '2025-10-31T08:58:45.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000026', '35', '4300197050',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'VERIFICADO', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-05T16:32:56.000Z', '2025-11-05T16:32:56.000Z', '2025-11-05T16:32:56.000Z', '2025-11-05T16:32:56.000Z', null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000027', '35', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'VERIFICADO', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-06T09:35:04.000Z', '2025-11-06T09:35:04.000Z', '2025-11-06T09:35:04.000Z', '2025-11-06T09:35:04.000Z', null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000028', '35', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'SOBRANTE', 'VERIFICADO', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-06T09:36:43.000Z', '2025-11-06T09:36:43.000Z', '2025-11-06T09:36:43.000Z', '2025-11-06T09:36:43.000Z', null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000029', '30', '1413',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-06T16:25:51.000Z', '2025-11-06T16:25:51.000Z', '2025-11-06T16:25:51.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000030', '31', '1413',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-06T16:26:39.000Z', '2025-11-06T16:26:39.000Z', '2025-11-06T16:26:39.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000031', '32', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-14T16:35:49.000Z', '2025-11-14T16:35:49.000Z', '2025-11-14T16:35:49.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000032', '33', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-14T16:49:47.000Z', '2025-11-14T16:49:47.000Z', '2025-11-14T16:49:47.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000033', '34', '4500033552',
  (select id from suppliers where nombre = 'FORTLEV INDUSTRIA E COMERCIO LTDA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-21T16:52:53.000Z', '2025-11-21T16:52:53.000Z', '2025-11-21T16:52:53.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000034', '35', null,
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-27T08:24:39.000Z', '2025-11-27T08:24:39.000Z', '2025-11-27T08:24:39.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000035', '36', null,
  null,
  'OTRO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-27T08:37:31.000Z', '2025-11-27T08:37:31.000Z', '2025-11-27T08:37:31.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000036', '37', null,
  (select id from suppliers where nombre = 'KOMELON CORPORATION' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-11-27T09:45:21.000Z', '2025-11-27T09:45:21.000Z', '2025-11-27T09:45:21.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000037', '38', '4500033915',
  (select id from suppliers where nombre = 'VIQUA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-04T16:01:59.000Z', '2025-12-04T16:01:59.000Z', '2025-12-04T16:01:59.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000038', '39', '4300199365',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-12T15:22:43.000Z', '2025-12-12T15:22:43.000Z', '2025-12-12T15:22:43.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000039', '41', null,
  (select id from suppliers where nombre = 'Kingspan' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2025-12-16T07:37:17.000Z', '2025-12-16T07:37:17.000Z', '2025-12-16T07:37:17.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000040', '41', '4300199365',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-16T13:22:13.000Z', '2025-12-16T13:22:13.000Z', '2025-12-16T13:22:13.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000041', '42', null,
  (select id from suppliers where nombre = 'ANSA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2025-12-19T09:18:21.000Z', '2025-12-19T09:18:21.000Z', '2025-12-19T09:18:21.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000042', '44', '4500032842',
  (select id from suppliers where nombre = 'BEIJING SANI-METAL I&E CO. LTD' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-19T09:19:50.000Z', '2025-12-19T09:19:50.000Z', '2025-12-19T09:19:50.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000043', '44', '4500034074',
  (select id from suppliers where nombre = 'SUPRENS' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-19T15:39:10.000Z', '2025-12-19T15:39:10.000Z', '2025-12-19T15:39:10.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000044', '45', '4300199856',
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-23T10:08:51.000Z', '2025-12-23T10:08:51.000Z', '2025-12-23T10:08:51.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000045', '46', '1481',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-30T16:05:00.000Z', '2025-12-30T16:05:00.000Z', '2025-12-30T16:05:00.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2025-000046', '47', '4500032964',
  (select id from suppliers where nombre = 'HEBEI QUNKUN METAL PRODUCTS CO.,LTD' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2025-12-30T16:07:57.000Z', '2025-12-30T16:07:57.000Z', '2025-12-30T16:07:57.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000001', '48', '4300200261',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-02T08:54:21.000Z', '2026-01-02T08:54:21.000Z', '2026-01-02T08:54:21.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000002', '49', '4300200261',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'OTRO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-02T10:59:09.000Z', '2026-01-02T10:59:09.000Z', '2026-01-02T10:59:09.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000003', '50', '4300200360',
  (select id from suppliers where nombre = 'PLASTIAGRO S.R.L' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-06T11:08:54.000Z', '2026-01-06T11:08:54.000Z', '2026-01-06T11:08:54.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000004', '51', '4500034266',
  (select id from suppliers where nombre = 'DOCOL METAIS SANITARIOS LTDA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-07T10:21:44.000Z', '2026-01-07T10:21:44.000Z', '2026-01-07T10:21:44.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000005', '52', '4300200503',
  (select id from suppliers where nombre = 'PLASTIAGRO S.R.L' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-09T08:18:23.000Z', '2026-01-09T08:18:23.000Z', '2026-01-09T08:18:23.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000006', '58', '4500033928',
  (select id from suppliers where nombre = 'NICE BRASIL INDUSTRIA E COMERCIO' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-12T13:17:09.000Z', '2026-01-12T13:17:09.000Z', '2026-01-12T13:17:09.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000007', '56', '4500033928',
  (select id from suppliers where nombre = 'NICE BRASIL INDUSTRIA E COMERCIO' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-12T13:26:39.000Z', '2026-01-12T13:26:39.000Z', '2026-01-12T13:26:39.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000008', '57', '4500034499',
  (select id from suppliers where nombre = 'VIQUA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-16T16:04:51.000Z', '2026-01-16T16:04:51.000Z', '2026-01-16T16:04:51.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000009', '58', '4500034499',
  (select id from suppliers where nombre = 'VIQUA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-16T16:09:54.000Z', '2026-01-16T16:09:54.000Z', '2026-01-16T16:09:54.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000010', '58', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-19T08:24:04.000Z', '2026-01-19T08:24:04.000Z', '2026-01-19T08:24:04.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000011', '59', null,
  (select id from suppliers where nombre = 'Kingspan' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-21T15:29:32.000Z', '2026-01-21T15:29:32.000Z', '2026-01-21T15:29:32.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000012', '58', '4500034548',
  (select id from suppliers where nombre = 'OURENSE DO BRASIL IND ART MET LTDA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-22T13:44:56.000Z', '2026-01-22T13:44:56.000Z', '2026-01-22T13:44:56.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000013', '59', '4300201654',
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-28T11:07:04.000Z', '2026-01-28T11:07:04.000Z', '2026-01-28T11:07:04.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000014', '60', '4300201654',
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-28T14:15:46.000Z', '2026-01-28T14:15:46.000Z', '2026-01-28T14:15:46.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000015', '61', '4500034514',
  (select id from suppliers where nombre = 'MAZZAFERRO S.A. (ARATY)' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-29T08:17:11.000Z', '2026-01-29T08:17:11.000Z', '2026-01-29T08:17:11.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000016', '62', '4500034514',
  (select id from suppliers where nombre = 'MAZZAFERRO S.A. (ARATY)' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-29T08:24:29.000Z', '2026-01-29T08:24:29.000Z', '2026-01-29T08:24:29.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000017', '63', '4300201812',
  (select id from suppliers where nombre = 'PLASTIAGRO S.R.L' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-29T15:18:42.000Z', '2026-01-29T15:18:42.000Z', '2026-01-29T15:18:42.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000018', '64', '4300201736',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-29T15:20:51.000Z', '2026-01-29T15:20:51.000Z', '2026-01-29T15:20:51.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000019', '65', '4500033368',
  (select id from suppliers where nombre = 'ARTHERMO S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-30T10:52:39.000Z', '2026-01-30T10:52:39.000Z', '2026-01-30T10:52:39.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000020', '66', '4300201775',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-01-30T13:08:39.000Z', '2026-01-30T13:08:39.000Z', '2026-01-30T13:08:39.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000021', '67', '4500034596',
  (select id from suppliers where nombre = 'PAMPEANO' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-04T16:16:10.000Z', '2026-02-04T16:16:10.000Z', '2026-02-04T16:16:10.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000022', '68', '4500034654',
  (select id from suppliers where nombre = 'CORTAG INDUSTRIA E COMERCIO LTDA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-05T08:04:04.000Z', '2026-02-05T08:04:04.000Z', '2026-02-05T08:04:04.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000023', '69', '4500034654',
  (select id from suppliers where nombre = 'CORTAG INDUSTRIA E COMERCIO LTDA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-05T08:04:48.000Z', '2026-02-05T08:04:48.000Z', '2026-02-05T08:04:48.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000024', '70', null,
  (select id from suppliers where nombre = 'MULTITRACK' limit 1),
  'OTRO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-05T10:23:09.000Z', '2026-02-05T10:23:09.000Z', '2026-02-05T10:23:09.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000025', '71', '4300202257',
  (select id from suppliers where nombre = 'CONSTRUCTORA BAMETAL SA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-05T15:04:58.000Z', '2026-02-05T15:04:58.000Z', '2026-02-05T15:04:58.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000026', '72', '4300202267',
  (select id from suppliers where nombre = 'NISAN SRL' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-05T17:16:13.000Z', '2026-02-05T17:16:13.000Z', '2026-02-05T17:16:13.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000027', '73', '4300202255',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-06T08:48:57.000Z', '2026-02-06T08:48:57.000Z', '2026-02-06T08:48:57.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000028', '76', '4300202150',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-06T08:52:27.000Z', '2026-02-06T08:52:27.000Z', '2026-02-06T08:52:27.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000029', '75', '4300202151',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-06T08:57:59.000Z', '2026-02-06T08:57:59.000Z', '2026-02-06T08:57:59.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000030', '76', '4300202237',
  (select id from suppliers where nombre = 'YACY S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-07T10:23:19.000Z', '2026-02-07T10:23:19.000Z', '2026-02-07T10:23:19.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000031', '77', '4300202406',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-11T13:14:13.000Z', '2026-02-11T13:14:13.000Z', '2026-02-11T13:14:13.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000032', '78', '4300202406',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-11T13:19:04.000Z', '2026-02-11T13:19:04.000Z', '2026-02-11T13:19:04.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000033', '79', '4300202406',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-11T13:21:40.000Z', '2026-02-11T13:21:40.000Z', '2026-02-11T13:21:40.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000034', '81', '4300202553',
  (select id from suppliers where nombre = 'PLASTIAGRO S.R.L' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-13T07:32:47.000Z', '2026-02-13T07:32:47.000Z', '2026-02-13T07:32:47.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000035', '81', '4300202553',
  (select id from suppliers where nombre = 'PLASTIAGRO S.R.L' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-13T07:39:04.000Z', '2026-02-13T07:39:04.000Z', '2026-02-13T07:39:04.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000036', '82', null,
  (select id from suppliers where nombre = 'PLASTIAGRO S.R.L' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-02-13T09:01:58.000Z', '2026-02-13T09:01:58.000Z', '2026-02-13T09:01:58.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000037', '83', null,
  (select id from suppliers where nombre = 'PLASTIAGRO S.R.L' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-02-13T09:18:05.000Z', '2026-02-13T09:18:05.000Z', '2026-02-13T09:18:05.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000038', '84', null,
  (select id from suppliers where nombre = 'KRONA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-02-14T08:58:30.000Z', '2026-02-14T08:58:30.000Z', '2026-02-14T08:58:30.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000039', '85', '4300202871',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-19T13:14:01.000Z', '2026-02-19T13:14:01.000Z', '2026-02-19T13:14:01.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000040', '86', null,
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-20T09:12:18.000Z', '2026-02-20T09:12:18.000Z', '2026-02-20T09:12:18.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000041', '87', null,
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-20T09:15:35.000Z', '2026-02-20T09:15:35.000Z', '2026-02-20T09:15:35.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000042', '88', null,
  (select id from suppliers where nombre = 'Kingspan' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-02-21T08:06:30.000Z', '2026-02-21T08:06:30.000Z', '2026-02-21T08:06:30.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000043', '89', null,
  (select id from suppliers where nombre = 'SHING HUNG INDUSTRIAL LIMITED' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-02-21T11:16:12.000Z', '2026-02-21T11:16:12.000Z', '2026-02-21T11:16:12.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000044', '90', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-23T16:19:50.000Z', '2026-02-23T16:19:50.000Z', '2026-02-23T16:19:50.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000045', '91', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-23T16:23:56.000Z', '2026-02-23T16:23:56.000Z', '2026-02-23T16:23:56.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000046', '92', '4300203242',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-24T15:49:49.000Z', '2026-02-24T15:49:49.000Z', '2026-02-24T15:49:49.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000047', '93', null,
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-26T07:53:49.000Z', '2026-02-26T07:53:49.000Z', '2026-02-26T07:53:49.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000048', '94', '4500033905',
  (select id from suppliers where nombre = 'KOMELON CORPORATION' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-26T13:33:33.000Z', '2026-02-26T13:33:33.000Z', '2026-02-26T13:33:33.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000049', '95', null,
  (select id from suppliers where nombre = 'GUANGZHOU ULIX IND.TRADE GROUP LTD' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-27T14:16:21.000Z', '2026-02-27T14:16:21.000Z', '2026-02-27T14:16:21.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000050', '96', null,
  (select id from suppliers where nombre = 'GUANGZHOU ULIX IND.TRADE GROUP LTD' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-27T14:19:08.000Z', '2026-02-27T14:19:08.000Z', '2026-02-27T14:19:08.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000051', '97', '4300203534',
  (select id from suppliers where nombre = 'ISOLANT AISLANTES SMART PY S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-02-27T16:42:30.000Z', '2026-02-27T16:42:30.000Z', '2026-02-27T16:42:30.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000052', '98', '4300203688',
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'OTRO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-03T16:06:31.000Z', '2026-03-03T16:06:31.000Z', '2026-03-03T16:06:31.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000053', '99', null,
  (select id from suppliers where nombre = 'MAX METALURGICA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-03-04T07:21:53.000Z', '2026-03-04T07:21:53.000Z', '2026-03-04T07:21:53.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000054', '100', '4300203736',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-04T14:14:09.000Z', '2026-03-04T14:14:09.000Z', '2026-03-04T14:14:09.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000055', '101', '4300203736',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-04T14:25:16.000Z', '2026-03-04T14:25:16.000Z', '2026-03-04T14:25:16.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000056', '102', null,
  (select id from suppliers where nombre = 'SHOPPING TODO HOGAR S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-06T16:27:58.000Z', '2026-03-06T16:27:58.000Z', '2026-03-06T16:27:58.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000057', '103', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-03-07T09:53:02.000Z', '2026-03-07T09:53:02.000Z', '2026-03-07T09:53:02.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000058', '104', '000-1615',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-10T16:19:37.000Z', '2026-03-10T16:19:37.000Z', '2026-03-10T16:19:37.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000059', '105', '4300204125',
  (select id from suppliers where nombre = 'CONSTRUCTORA BAMETAL SA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-11T11:29:41.000Z', '2026-03-11T11:29:41.000Z', '2026-03-11T11:29:41.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000060', '106', '4500034054',
  (select id from suppliers where nombre = 'YIEH CORP.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-14T08:17:51.000Z', '2026-03-14T08:17:51.000Z', '2026-03-14T08:17:51.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000061', '108', '4500034054',
  (select id from suppliers where nombre = 'YIEH CORP.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-14T08:26:52.000Z', '2026-03-14T08:26:52.000Z', '2026-03-14T08:26:52.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000062', '108', '4500035102',
  (select id from suppliers where nombre = 'ANSA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-16T07:42:21.000Z', '2026-03-16T07:42:21.000Z', '2026-03-16T07:42:21.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000063', '109', '4500034972',
  (select id from suppliers where nombre = 'SIL' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-16T13:37:31.000Z', '2026-03-16T13:37:31.000Z', '2026-03-16T13:37:31.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000064', '110', '3739',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-16T14:32:18.000Z', '2026-03-16T14:32:18.000Z', '2026-03-16T14:32:18.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000065', '111', '3739',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-16T14:48:25.000Z', '2026-03-16T14:48:25.000Z', '2026-03-16T14:48:25.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000066', '112', '4500035130',
  (select id from suppliers where nombre = 'VIQUA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-18T08:00:58.000Z', '2026-03-18T08:00:58.000Z', '2026-03-18T08:00:58.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000067', '113', null,
  (select id from suppliers where nombre = 'CRESUR S.A.' limit 1),
  'OTRO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-20T16:25:26.000Z', '2026-03-20T16:25:26.000Z', '2026-03-20T16:25:26.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000068', '114', '4500035007',
  (select id from suppliers where nombre = 'HIDRO FILTROS' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-24T07:41:11.000Z', '2026-03-24T07:41:11.000Z', '2026-03-24T07:41:11.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000069', '115', '4500035056',
  (select id from suppliers where nombre = 'ALIANCA METALURGICA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-25T10:39:14.000Z', '2026-03-25T10:39:14.000Z', '2026-03-25T10:39:14.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000070', '116', '4300205169',
  (select id from suppliers where nombre = 'ISOLANT AISLANTES SMART PY S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-25T14:12:40.000Z', '2026-03-25T14:12:40.000Z', '2026-03-25T14:12:40.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000071', '117', '4500035218',
  (select id from suppliers where nombre = 'MAZZAFERRO S.A. (ARATY)' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-26T09:39:15.000Z', '2026-03-26T09:39:15.000Z', '2026-03-26T09:39:15.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000072', '118', '4300205187',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-26T12:39:47.000Z', '2026-03-26T12:39:47.000Z', '2026-03-26T12:39:47.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000073', '119', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-28T08:41:40.000Z', '2026-03-28T08:41:40.000Z', '2026-03-28T08:41:40.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000074', '120', '4500035129',
  (select id from suppliers where nombre = 'SCHWEERS' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-03-31T14:50:41.000Z', '2026-03-31T14:50:41.000Z', '2026-03-31T14:50:41.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000075', '121', '4500034558',
  (select id from suppliers where nombre = 'ZHONGSHAN ANTO' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-07T15:10:27.000Z', '2026-04-07T15:10:27.000Z', '2026-04-07T15:10:27.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000076', '122', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-08T17:24:45.000Z', '2026-04-08T17:24:45.000Z', '2026-04-08T17:24:45.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000077', '123', '4300205994',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-11T08:41:52.000Z', '2026-04-11T08:41:52.000Z', '2026-04-11T08:41:52.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000078', '124', '4300205753',
  (select id from suppliers where nombre = 'YACY S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-11T09:22:12.000Z', '2026-04-11T09:22:12.000Z', '2026-04-11T09:22:12.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000079', '125', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-15T07:30:45.000Z', '2026-04-15T07:30:45.000Z', '2026-04-15T07:30:45.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000080', '126', '4500035191',
  (select id from suppliers where nombre = 'BIASSONI E HIJOS SAICA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-15T09:12:59.000Z', '2026-04-15T09:12:59.000Z', '2026-04-15T09:12:59.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000081', '127', '4500034750',
  (select id from suppliers where nombre = 'SHANGHAI AMC INTERNATIONAL TRADING' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-15T13:43:37.000Z', '2026-04-15T13:43:37.000Z', '2026-04-15T13:43:37.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000082', '128', '4500034750',
  (select id from suppliers where nombre = 'SHANGHAI AMC INTERNATIONAL TRADING' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-15T15:43:55.000Z', '2026-04-15T15:43:55.000Z', '2026-04-15T15:43:55.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000083', '129', '4300206418',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-17T15:15:30.000Z', '2026-04-17T15:15:30.000Z', '2026-04-17T15:15:30.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000084', '130', '4300206418',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-17T15:16:08.000Z', '2026-04-17T15:16:08.000Z', '2026-04-17T15:16:08.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000085', '131', null,
  (select id from suppliers where nombre = 'Kingspan' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-04-17T16:44:14.000Z', '2026-04-17T16:44:14.000Z', '2026-04-17T16:44:14.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000086', '132', '4300206653',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-23T10:18:17.000Z', '2026-04-23T10:18:17.000Z', '2026-04-23T10:18:17.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000087', '133', '4300206653',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-23T10:21:47.000Z', '2026-04-23T10:21:47.000Z', '2026-04-23T10:21:47.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000088', '135', '4300206691',
  (select id from suppliers where nombre = 'ISOLANT AISLANTES SMART PY S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-23T16:11:55.000Z', '2026-04-23T16:11:55.000Z', '2026-04-23T16:11:55.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000089', '135', '4300206848',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-25T10:39:08.000Z', '2026-04-25T10:39:08.000Z', '2026-04-25T10:39:08.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000090', '136', '4300206848',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-25T10:40:51.000Z', '2026-04-25T10:40:51.000Z', '2026-04-25T10:40:51.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000091', '137', '4500035437',
  (select id from suppliers where nombre = 'PINCEIS ROMA LTDA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-29T09:43:49.000Z', '2026-04-29T09:43:49.000Z', '2026-04-29T09:43:49.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000092', '138', '4500035437',
  (select id from suppliers where nombre = 'PINCEIS ROMA LTDA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-29T09:48:28.000Z', '2026-04-29T09:48:28.000Z', '2026-04-29T09:48:28.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000093', '139', '4500035361',
  (select id from suppliers where nombre = 'MGS INDUS.E COMER.DE PLASTICO' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-04-30T12:44:24.000Z', '2026-04-30T12:44:24.000Z', '2026-04-30T12:44:24.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000094', '140', '4300207443',
  (select id from suppliers where nombre = 'CLAVOS Y CIA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-06T12:15:32.000Z', '2026-05-06T12:15:32.000Z', '2026-05-06T12:15:32.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000095', '141', '4300207561',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-11T08:10:05.000Z', '2026-05-11T08:10:05.000Z', '2026-05-11T08:10:05.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000096', '143', '4300207677',
  (select id from suppliers where nombre = 'ORIGAMI' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-11T15:33:35.000Z', '2026-05-11T15:33:35.000Z', '2026-05-11T15:33:35.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000097', '143', '4500035355',
  (select id from suppliers where nombre = 'PLASTCOR DO BRASIL LTDA.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-21T09:22:50.000Z', '2026-05-21T09:22:50.000Z', '2026-05-21T09:22:50.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000098', '144', '4500035500',
  (select id from suppliers where nombre = 'MAX METALURGICA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-21T11:52:19.000Z', '2026-05-21T11:52:19.000Z', '2026-05-21T11:52:19.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000099', '145', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-22T09:49:31.000Z', '2026-05-22T09:49:31.000Z', '2026-05-22T09:49:31.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000100', '146', '4500035862',
  (select id from suppliers where nombre = 'FORTLEV INDUSTRIA E COMERCIO LTDA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-27T09:37:34.000Z', '2026-05-27T09:37:34.000Z', '2026-05-27T09:37:34.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000101', '151', '4500035862',
  (select id from suppliers where nombre = 'FORTLEV INDUSTRIA E COMERCIO LTDA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-27T09:38:22.000Z', '2026-05-27T09:38:22.000Z', '2026-05-27T09:38:22.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000102', '148', '4500035784',
  (select id from suppliers where nombre = 'VIQUA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-27T09:56:14.000Z', '2026-05-27T09:56:14.000Z', '2026-05-27T09:56:14.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000103', '149', '4500035786',
  (select id from suppliers where nombre = 'KRONA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-27T09:57:03.000Z', '2026-05-27T09:57:03.000Z', '2026-05-27T09:57:03.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000104', '150', 'LA42805/112',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-05-27T12:07:07.000Z', '2026-05-27T12:07:07.000Z', '2026-05-27T12:07:07.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000105', '151', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-01T14:05:27.000Z', '2026-06-01T14:05:27.000Z', '2026-06-01T14:05:27.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000106', '152', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-01T14:18:47.000Z', '2026-06-01T14:18:47.000Z', '2026-06-01T14:18:47.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000107', '153', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-01T14:42:47.000Z', '2026-06-01T14:42:47.000Z', '2026-06-01T14:42:47.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000108', '154', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-01T14:45:17.000Z', '2026-06-01T14:45:17.000Z', '2026-06-01T14:45:17.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000109', '155', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-01T14:46:22.000Z', '2026-06-01T14:46:22.000Z', '2026-06-01T14:46:22.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000110', '156', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-01T15:13:24.000Z', '2026-06-01T15:13:24.000Z', '2026-06-01T15:13:24.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000111', '157', null,
  (select id from suppliers where nombre = 'Kingspan' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-03T07:34:41.000Z', '2026-06-03T07:34:41.000Z', '2026-06-03T07:34:41.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000112', '158', '4500035876',
  (select id from suppliers where nombre = 'FORTLEV INDUSTRIA E COMERCIO LTDA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-03T14:44:34.000Z', '2026-06-03T14:44:34.000Z', '2026-06-03T14:44:34.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000113', '159', '4300209082',
  (select id from suppliers where nombre = 'ADIVAN TRADING S.A.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-04T12:06:13.000Z', '2026-06-04T12:06:13.000Z', '2026-06-04T12:06:13.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000114', '160', '4300209172',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-06T08:13:18.000Z', '2026-06-06T08:13:18.000Z', '2026-06-06T08:13:18.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000115', '161', '4300209172',
  (select id from suppliers where nombre = 'ORION S.R.L.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-06T08:21:22.000Z', '2026-06-06T08:21:22.000Z', '2026-06-06T08:21:22.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000116', '162', '4500035343',
  (select id from suppliers where nombre = 'SHANGHAI AMC INTERNATIONAL TRADING' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-15T14:39:40.000Z', '2026-06-15T14:39:40.000Z', '2026-06-15T14:39:40.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000117', '163', '4300209545',
  (select id from suppliers where nombre = 'T.A.O' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-16T09:19:06.000Z', '2026-06-16T09:19:06.000Z', '2026-06-16T09:19:06.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000118', '164', '4500036058',
  (select id from suppliers where nombre = 'FORTLEV INDUSTRIA E COMERCIO LTDA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-24T13:11:37.000Z', '2026-06-24T13:11:37.000Z', '2026-06-24T13:11:37.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000119', '165', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-06-29T12:19:00.000Z', '2026-06-29T12:19:00.000Z', '2026-06-29T12:19:00.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000120', '166', '4500035930',
  (select id from suppliers where nombre = 'PLASTCOR DO BRASIL LTDA.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-01T13:14:55.000Z', '2026-07-01T13:14:55.000Z', '2026-07-01T13:14:55.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000121', '167', '4300210590',
  (select id from suppliers where nombre = 'M. ANDRION SA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-03T09:03:22.000Z', '2026-07-03T09:03:22.000Z', '2026-07-03T09:03:22.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000122', '168', '4300210163',
  (select id from suppliers where nombre = 'NISAN SRL' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-06T07:21:23.000Z', '2026-07-06T07:21:23.000Z', '2026-07-06T07:21:23.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000123', '169', '4500036312',
  (select id from suppliers where nombre = 'MOBILLE EXPORTACAO' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-08T13:49:59.000Z', '2026-07-08T13:49:59.000Z', '2026-07-08T13:49:59.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000124', '170', '4500036312',
  (select id from suppliers where nombre = 'MOBILLE EXPORTACAO' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-08T13:50:46.000Z', '2026-07-08T13:50:46.000Z', '2026-07-08T13:50:46.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000125', '171', '4300210815',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-09T07:57:16.000Z', '2026-07-09T07:57:16.000Z', '2026-07-09T07:57:16.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000126', '172', '4300210914',
  (select id from suppliers where nombre = 'FERROPAR S.A.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-09T13:53:24.000Z', '2026-07-09T13:53:24.000Z', '2026-07-09T13:53:24.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000127', '173', null,
  (select id from suppliers where nombre = 'VIQUA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-07-10T09:50:36.000Z', '2026-07-10T09:50:36.000Z', '2026-07-10T09:50:36.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000128', '174', null,
  (select id from suppliers where nombre = 'KRONA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-07-10T09:57:43.000Z', '2026-07-10T09:57:43.000Z', '2026-07-10T09:57:43.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000129', '175', '4300211178',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-16T14:36:23.000Z', '2026-07-16T14:36:23.000Z', '2026-07-16T14:36:23.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000130', '177', null,
  (select id from suppliers where nombre = 'OPTIMA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-20T14:53:00.000Z', '2026-07-20T14:53:00.000Z', '2026-07-20T14:53:00.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000131', '177', null,
  (select id from suppliers where nombre = 'SHOPPING TODO HOGAR S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-21T06:42:28.000Z', '2026-07-21T06:42:28.000Z', '2026-07-21T06:42:28.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000132', '178', null,
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-29T10:39:19.000Z', '2026-07-29T10:39:19.000Z', '2026-07-29T10:39:19.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000133', '180', null,
  (select id from suppliers where nombre = 'MARSEG S.A.' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-07-29T10:40:01.000Z', '2026-07-29T10:40:01.000Z', '2026-07-29T10:40:01.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000134', '180', '4300212252',
  (select id from suppliers where nombre = 'M. ANDRION SA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-01T08:04:06.000Z', '2026-08-01T08:04:06.000Z', '2026-08-01T08:04:06.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000135', '181', '4300212252',
  (select id from suppliers where nombre = 'M. ANDRION SA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-01T08:05:36.000Z', '2026-08-01T08:05:36.000Z', '2026-08-01T08:05:36.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000136', '182', '4300212164 4300212170',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-03T14:10:14.000Z', '2026-08-03T14:10:14.000Z', '2026-08-03T14:10:14.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000137', '183', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-08-05T16:15:38.000Z', '2026-08-05T16:15:38.000Z', '2026-08-05T16:15:38.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000138', '184', '4300212558',
  (select id from suppliers where nombre = 'YACY S.R.L.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-11T07:23:59.000Z', '2026-08-11T07:23:59.000Z', '2026-08-11T07:23:59.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000139', '185', null,
  (select id from suppliers where nombre = 'OURENSE DO BRASIL IND ART MET LTDA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-11T08:33:45.000Z', '2026-08-11T08:33:45.000Z', '2026-08-11T08:33:45.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000140', '186', '4300212809',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-12T14:38:08.000Z', '2026-08-12T14:38:08.000Z', '2026-08-12T14:38:08.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000141', '187', '4300212874',
  (select id from suppliers where nombre = 'ZR DISTRIBUIDORA E.A.S.' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-12T14:41:21.000Z', '2026-08-12T14:41:21.000Z', '2026-08-12T14:41:21.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000142', '188', null,
  (select id from suppliers where nombre = 'SHOPPING TODO HOGAR S.A.' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-12T15:37:50.000Z', '2026-08-12T15:37:50.000Z', '2026-08-12T15:37:50.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000143', '189', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-17T08:43:22.000Z', '2026-08-17T08:43:22.000Z', '2026-08-17T08:43:22.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000144', '190', null,
  (select id from suppliers where nombre = 'INDUSTRIA METALURGICA FERROTODO SA' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-08-18T13:16:33.000Z', '2026-08-18T13:16:33.000Z', '2026-08-18T13:16:33.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000145', '191', null,
  (select id from suppliers where nombre = 'INDUSTRIA METALURGICA FERROTODO SA' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-08-18T13:26:13.000Z', '2026-08-18T13:26:13.000Z', '2026-08-18T13:26:13.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000146', '192', '4300213180',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-19T12:24:38.000Z', '2026-08-19T12:24:38.000Z', '2026-08-19T12:24:38.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000147', '193', null,
  (select id from suppliers where nombre = 'FORTLEV INDUSTRIA E COMERCIO LTDA' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'Adrian Gomez' limit 1),
  '2026-08-22T10:48:25.000Z', '2026-08-22T10:48:25.000Z', '2026-08-22T10:48:25.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000148', '194', null,
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-25T06:59:06.000Z', '2026-08-25T06:59:06.000Z', '2026-08-25T06:59:06.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000149', '195', '4500037011',
  (select id from suppliers where nombre = 'ATLANTIC S.A.E' limit 1),
  'AVERIADO', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-08-28T14:31:43.000Z', '2026-08-28T14:31:43.000Z', '2026-08-28T14:31:43.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000150', '196', '4500036187',
  (select id from suppliers where nombre = 'SHANGHAI AMC INTERNATIONAL TRADING' limit 1),
  'SOBRANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-09-02T10:45:02.000Z', '2026-09-02T10:45:02.000Z', '2026-09-02T10:45:02.000Z', null, null
on conflict (incident_number) do nothing;
insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select 'INC-2026-000151', '197', '4500036187',
  (select id from suppliers where nombre = 'SHANGHAI AMC INTERNATIONAL TRADING' limit 1),
  'FALTANTE', 'PENDIENTE', 'NORMAL',
  (select id from users where nombre = 'David Espínola' limit 1),
  '2026-09-02T10:48:02.000Z', '2026-09-02T10:48:02.000Z', '2026-09-02T10:48:02.000Z', null, null
on conflict (incident_number) do nothing;

-- 4) ÍTEMS (linkean por DATOS.ID → incident_number)
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6751910' limit 1), 'LA6751910', 'RODILLO DE LANA RULFIX. 23 CM C/M', 0, 0, 16, 16, 'UN', 'LLEGARON EN MAL ESTADO , APLASTADOS Y MOJADOS.'
from incidents i where i.incident_number = 'INC-2025-000001'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6751910' and ii.affected_qty = 16);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2800480' limit 1), 'LA2800480', 'TORNILLO P/MADERA FIX 5x25', 0, 0, 10000, 10000, 'UN', 'LLEGO DOS CAJAS DE 6000 Y UNA CAJA DE 3000'
from incidents i where i.incident_number = 'INC-2025-000002'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2800480' and ii.affected_qty = 10000);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA60920' limit 1), 'LA60920', 'NIVEL AL.BASE MAGNETICA 40" CORTAG', 0, 0, 6, 6, 'UN', 'FALTO 1 CAJA DE 6 UN SEGUN LISTA DE EMPAQUE EN EL PALLET NRO 01'
from incidents i where i.incident_number = 'INC-2025-000003'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA60920' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7000730' limit 1), 'LA7000730', 'CABLE T/TALLER 2X1MM-NEGRO 100M', 0, 0, 1, 1, 'ROL', 'EL CABLE SE ENCUENTRA CON VARIOS CORTES'
from incidents i where i.incident_number = 'INC-2025-000004'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7000730' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6897618' limit 1), 'LA6897618', 'ALAMBRE NEGRO BELGO No 18/1Kg.', 0, 0, 2, 2, 'UN', 'LLEGARON EN MAL ESTADO'
from incidents i where i.incident_number = 'INC-2025-000005'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6897618' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6671412' limit 1), 'LA6671412', 'MOLINO P/CARNE OPTIMA 12', 0, 0, 4, 4, 'UN', 'LLEGARON ROTOS DENTRO DE LA CAJA'
from incidents i where i.incident_number = 'INC-2025-000006'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6671412' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6891715' limit 1), 'LA6891715', 'ALAMBRE GALVANIZADO 17/15 EL POTRO', 0, 0, 1, 1, 'ROL', 'FALTO 1 ROLLO'
from incidents i where i.incident_number = 'INC-2025-000007'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6891715' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100100' limit 1), 'LA9100100', 'TAPA WATER TPQ BLANCO BR1', 0, 0, 20, 20, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000008'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100100' and ii.affected_qty = 20);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100102' limit 1), 'LA9100102', 'TAPA WATER TPQ MARR. OSC. CM1', 0, 0, 20, 20, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000009'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100102' and ii.affected_qty = 20);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAWGSG600/35' limit 1), 'LAWGSG600/35', 'ZAPATO WORKGRIP BLANCO N°35', 0, 0, 1, 1, 'PAR', 'FALTO DENTRO DE LA CAJA'
from incidents i where i.incident_number = 'INC-2025-000010'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAWGSG600/35' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7000290' limit 1), 'LA7000290', 'VALVULA ESF.FUS. 50MM ACQ. SYSTEM', 0, 0, 24, 24, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000011'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7000290' and ii.affected_qty = 24);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA103' limit 1), 'LA103', 'VEDACIT IMPERMEABILIZANTE 3,6L', 0, 0, 33, 33, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000012'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA103' and ii.affected_qty = 33);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA118' limit 1), 'LA118', 'VEDACIT IMPERMEABILIZANTE 18LT', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000012'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA118' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA218' limit 1), 'LA218', 'NEGROLIN TINTA ASFALTICA 18 LT', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000012'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA218' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4030101' limit 1), 'LA4030101', 'MANG.EN BOBINA TOPFLEX 1/2"x50M-VIQUA', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000013'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4030101' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100801' limit 1), 'LA6100801', 'CHAPA TERMOACUSTICA 3.66', 0, 0, 2, 2, 'UN', 'Abolladas y raspones'
from incidents i where i.incident_number = 'INC-2025-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100801' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100803' limit 1), 'LA6100803', 'CHAPA TERMOACUSTICA 4,88', 0, 0, 2, 2, 'UN', 'Abolladas y raspones'
from incidents i where i.incident_number = 'INC-2025-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100803' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100804' limit 1), 'LA6100804', 'CHAPA TERMOACUSTICA 5,49', 0, 0, 2, 2, 'UN', 'Abolladas y raspones'
from incidents i where i.incident_number = 'INC-2025-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100804' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100805' limit 1), 'LA6100805', 'CHAPA TERMOACUSTICA 6,10', 0, 0, 3, 3, 'UN', 'Abolladas y raspones'
from incidents i where i.incident_number = 'INC-2025-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100805' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100806' limit 1), 'LA6100806', 'CHAPA TERMOACUSTICA 6,70', 0, 0, 4, 4, 'UN', 'Abolladas y raspones'
from incidents i where i.incident_number = 'INC-2025-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100806' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA81000071/36' limit 1), 'LA81000071/36', 'BOTA NEGRA PVC WORKSAFE N°36', 0, 0, 1, 1, 'PAR', 'Lado derecho (ambos)'
from incidents i where i.incident_number = 'INC-2025-000015'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA81000071/36' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1027' limit 1), 'LA1027', 'CAÑO CORRUG. 25MM-3/4-25MTS OPTIMA', 0, 0, 1, 1, 'ROL', 'Esta cortado el caño'
from incidents i where i.incident_number = 'INC-2025-000017'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1027' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA02020010' limit 1), 'LA02020010', 'TANQUE AGUA C/TAPA 5.000L FORTLEV', 0, 0, 9, 9, 'UN', 'SOLO LAS TAPAS'
from incidents i where i.incident_number = 'INC-2025-000018'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA02020010' and ii.affected_qty = 9);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA40508/003' limit 1), 'LA40508/003', 'MAZO TRAM 1500GR MASTER', 0, 0, 12, 12, 'UN', '2 CAJAS SOBRANTE'
from incidents i where i.incident_number = 'INC-2025-000019'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA40508/003' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA40508/002' limit 1), 'LA40508/002', 'MAZO TRAM 1000GR MASTER', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000020'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA40508/002' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALY-KT182' limit 1), 'LALY-KT182', 'HERVIDOR ELÉCTRICO ACERO INOX.1500W', 0, 0, 180, 180, 'UN', '15 CAJAS DE 12 UN'
from incidents i where i.incident_number = 'INC-2025-000021'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALY-KT182' and ii.affected_qty = 180);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA22W-6500K' limit 1), 'LALEDA22W-6500K', 'FOCO LED A OPTIMA 22W 6500K', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA22W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA9W-6500K' limit 1), 'LALEDA9W-6500K', 'FOCO LED A OPTIMA 9W 6500K', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA9W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT20W-6500K' limit 1), 'LALEDT20W-6500K', 'FOCO LED T OPTIMA 20W 6500K', 0, 0, 20, 20, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT20W-6500K' and ii.affected_qty = 20);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT30W-6500K' limit 1), 'LALEDT30W-6500K', 'FOCO LED T OPTIMA 30W 6500K', 0, 0, 30, 30, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT30W-6500K' and ii.affected_qty = 30);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT40W-6500K' limit 1), 'LALEDT40W-6500K', 'FOCO LED T OPTIMA 40W 6500K', 0, 0, 5, 5, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT40W-6500K' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT50W-6500K' limit 1), 'LALEDT50W-6500K', 'FOCO LED T OPTIMA 50W 6500K', 0, 0, 21, 21, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT50W-6500K' and ii.affected_qty = 21);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT60W-6500K' limit 1), 'LALEDT60W-6500K', 'FOCO LED T OPTIMA 60W 6500K', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT60W-6500K' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA15W-6500K' limit 1), 'LALEDA15W-6500K', 'FOCO LED A OPTIMA 15W 6500K', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA15W-6500K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA5W-6500K' limit 1), 'LALEDA5W-6500K', 'FOCO LED A OPTIMA 5W 6500K', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA5W-6500K' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9300115' limit 1), 'LA9300115', 'LED BULB OPTIMA T190-150W/E40-L/F', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9300115' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600104' limit 1), 'LA9600104', 'PANEL CUAD.EMB.OPTIMA 9W-L/C', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600104' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600112' limit 1), 'LA9600112', 'PANEL CUAD.EMB.OPTIMA 30W-L/C', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600112' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600130' limit 1), 'LA9600130', 'PANEL CUAD.EMB.OPTIMA 5W-L/F', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600130' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600138' limit 1), 'LA9600138', 'PANEL CUAD.EMB.OPTIMA 24W-L/F', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600138' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9700110' limit 1), 'LA9700110', 'PANEL RED.ADO.OPTIMA 30W-L/C', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9700110' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9800108' limit 1), 'LA9800108', 'PANEL CUAD.ADO.OPTIMA 30W-L/C', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9800108' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9800126' limit 1), 'LA9800126', 'PANEL CUAD.ADO.OPTIMA 24W-L/F', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9800126' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6048203' limit 1), 'LA6048203', 'CINTA METRICA AZUL 3mx12,5mm-OPTIMA', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000024'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6048203' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1026' limit 1), 'LA1026', 'CAÑO CORRUG. 20MM-1/2-25MTS OPTIMA', 0, 0, 1, 1, 'ROL', null
from incidents i where i.incident_number = 'INC-2025-000025'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1026' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1027' limit 1), 'LA1027', 'CAÑO CORRUG. 25MM-3/4-25MTS OPTIMA', 0, 0, 2, 2, 'ROL', null
from incidents i where i.incident_number = 'INC-2025-000025'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1027' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6922900' limit 1), 'LA6922900', 'BALDE ALBANIL VOSS2000 M/INYECT.', 0, 0, 480, 480, 'UN', '40 PAQ. FALTANTE'
from incidents i where i.incident_number = 'INC-2025-000026'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6922900' and ii.affected_qty = 480);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6048203' limit 1), 'LA6048203', 'CINTA METRICA AZUL 3mx12,5mm-OPTIMA', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000027'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6048203' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6048205' limit 1), 'LA6048205', 'CINTA METRICA AZUL 5mx19mm-OPTIMA', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000028'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6048205' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100158' limit 1), 'LA9100158', 'CISTERNA C9 GRIS OSCURO CZ1', 0, 0, 50, 50, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000029'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100158' and ii.affected_qty = 50);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100152' limit 1), 'LA9100152', 'CISTERNA C9 MARRON OSCURO CM1', 0, 0, 50, 50, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000030'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100152' and ii.affected_qty = 50);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA5W-3000K' limit 1), 'LALEDA5W-3000K', 'FOCO LED A OPTIMA 5W 3000K', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA5W-3000K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA118' limit 1), 'LA118', 'VEDACIT IMPERMEABILIZANTE 18LT', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000031'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA118' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA218' limit 1), 'LA218', 'NEGROLIN TINTA ASFALTICA 18 LT', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000031'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA218' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA103' limit 1), 'LA103', 'VEDACIT IMPERMEABILIZANTE 3,6L', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000032'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA103' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA10750403' limit 1), 'LA10750403', 'CONEXIÓN FLEXIBLE PL 40CM FORTLEV', 0, 0, 60, 60, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000033'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA10750403' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100150' limit 1), 'LA9100150', 'CISTERNA C9 BLANCO BR1', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100150' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100152' limit 1), 'LA9100152', 'CISTERNA C9 MARRON OSCURO CM1', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100152' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100160' limit 1), 'LA9100160', 'CISTERNA C9 GRIS CLARO CZ2', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100160' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100175' limit 1), 'LA9100175', 'CISTERNA C9 BEIGE CLARO BG8', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100175' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100132' limit 1), 'LA9100132', 'TAPA WATER TPQ AZUL F.A. AFA', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100132' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2012' limit 1), 'LA2012', 'TAPA ACOLCHADA TPK BLANCO BR1', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2012' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA12040182' limit 1), 'LA12040182', 'BOMBA SUMERGIBLE 800-370W FAME', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA12040182' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA12040202' limit 1), 'LA12040202', 'BOMBA SUMERGIBLE 900-450W FAME', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA12040202' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA00242572' limit 1), 'LA00242572', 'SUPER DUCHA+ BL 6800W S/MANG FAME', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA00242572' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA00242562' limit 1), 'LA00242562', 'SUPER DUCHA+ BL 6800W C/MANG FAME', 0, 0, 5, 5, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA00242562' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA00242312' limit 1), 'LA00242312', 'SUPER DUCHA+ NG 6800W C/MANG FAME', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA00242312' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA01219982' limit 1), 'LA01219982', 'DUCHA-FLEX PELUQUERIA 4000W FAME', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA01219982' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA01021972' limit 1), 'LA01021972', 'GRIFO EL. (MOVIL) BL. 5400W FAME', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA01021972' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA12140222' limit 1), 'LA12140222', 'COCINA ELECT. 1 PLATO 1000W FAME', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA12140222' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAPEN85E' limit 1), 'LAPEN85E', 'CINTA MET.KOMELON ECO 8MX25MM', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000036'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAPEN85E' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAPEN59E' limit 1), 'LAPEN59E', 'CINTA MET.KOMELON ECO 5MX19MM', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000036'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAPEN59E' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1070701' limit 1), 'LA1070701', 'FLOTADOR P/ TANQUE 1/2 y 3/4-VIQUA', 0, 0, 126, 126, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000037'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1070701' and ii.affected_qty = 126);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1130952' limit 1), 'LA1130952', 'GRIFO"MARUJA"BL.TANQUE 15cmS/P', 0, 0, 90, 90, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000037'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1130952' and ii.affected_qty = 90);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1130992' limit 1), 'LA1130992', 'GRIFO MULTIUSO MARUJA PARED BLANC', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000037'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1130992' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7000215' limit 1), 'LA7000215', 'LLAVE PASO FUS.25MM/VOLANTE METAL', 0, 0, 62, 62, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000038'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7000215' and ii.affected_qty = 62);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7000245' limit 1), 'LA7000245', 'TEE FUS.C/INS.HEMBRA 32X1"', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000038'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7000245' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100801' limit 1), 'LA6100801', 'CHAPA TERMOACUSTICA 3.66', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100801' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100802' limit 1), 'LA6100802', 'CHAPA TERMOACUSTICA 4.27', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100802' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100803' limit 1), 'LA6100803', 'CHAPA TERMOACUSTICA 4,88', 0, 0, 8, 8, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100803' and ii.affected_qty = 8);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100804' limit 1), 'LA6100804', 'CHAPA TERMOACUSTICA 5,49', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100804' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100805' limit 1), 'LA6100805', 'CHAPA TERMOACUSTICA 6,10', 0, 0, 11, 11, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100805' and ii.affected_qty = 11);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100806' limit 1), 'LA6100806', 'CHAPA TERMOACUSTICA 6,70', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100806' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7000214' limit 1), 'LA7000214', 'LLAVE PASO FUS.20MM/VOLANTE METAL', 0, 0, 60, 60, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000040'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7000214' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6922888' limit 1), 'LA6922888', 'HORMIGONERA 1HP ANSA', 0, 0, 11, 11, 'UN', 'SOLO RUEDAS'
from incidents i where i.incident_number = 'INC-2025-000041'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6922888' and ii.affected_qty = 11);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6658412' limit 1), 'LA6658412', 'BRIDA 2 CLASS 150', 0, 0, 60, 60, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000042'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6658412' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6654444' limit 1), 'LA6654444', 'CURVA 90 RADIO LARGO 2-1/2"-SCH40', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000042'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6654444' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6509120' limit 1), 'LA6509120', 'ABRAZADERA 9mm (57-76)(2 1/4-3)', 0, 0, 40, 40, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000043'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6509120' and ii.affected_qty = 40);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LABSL2400/43' limit 1), 'LABSL2400/43', 'ZAPATO BAJO PUNT.ACERO No43', 0, 0, 10, 10, 'PAR', null
from incidents i where i.incident_number = 'INC-2025-000044'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LABSL2400/43' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100100' limit 1), 'LA9100100', 'TAPA WATER TPQ BLANCO BR1', 0, 0, 54, 54, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000045'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100100' and ii.affected_qty = 54);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6897419' limit 1), 'LA6897419', 'ALAMBRE GALV. No 18 (1,24mm)', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2025-000046'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6897419' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA132957' limit 1), 'LA132957', 'CINTA ASF VEDATODO 45 X 10', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000001'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA132957' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA132957' limit 1), 'LA132957', 'CINTA ASF VEDATODO 45 X 10', 0, 0, 897, 897, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000002'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA132957' and ii.affected_qty = 897);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA148084' limit 1), 'LA148084', 'CINTA ASF VEDATODO 20 X 10', 0, 0, 1200, 1200, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000002'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA148084' and ii.affected_qty = 1200);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300206' limit 1), 'LA6300206', 'MALLA NEGRO 65% 2,1X100 LIV CHILE', 0, 0, 1, 1, 'UN', 'TENIA QUE VENIR MALLA NEGRA 65% 2.1X100, PERO VINO UNO DE MALLA NEGRA 50% 4,2X100'
from incidents i where i.incident_number = 'INC-2026-000003'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300206' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA00183106' limit 1), 'LA00183106', 'KIT ACCES. BAÑO SINGLE/DOCOL 5PZ', 0, 0, 8, 8, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000004'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA00183106' and ii.affected_qty = 8);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300650' limit 1), 'LA6300650', 'MALLA NEGRO 65% 4,2X100 LIV CHILE', 0, 0, 50, 50, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000005'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300650' and ii.affected_qty = 50);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAOMEG3037' limit 1), 'LAOMEG3037', 'CONJ. DZ. KAZA600 CR/MT 12S. 600KG', 0, 0, 10, 10, 'UN', 'esta mercaderia sobra por que tenia que ser LAOMEG3994'
from incidents i where i.incident_number = 'INC-2026-000006'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAOMEG3037' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAOMEG3959' limit 1), 'LAOMEG3959', 'CONT.TXCAR P/PORTON AUTO PECCININ', 0, 0, 60, 60, 'UN', 'me sobra esta mercaderia tenia que ser LAOMEG2604 y vino LAOMEG3959'
from incidents i where i.incident_number = 'INC-2026-000006'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAOMEG3959' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAOMEG3994' limit 1), 'LAOMEG3994', 'CONJ.DZ KAZA600CR/3M.5SEG600KG VEL', 0, 0, 10, 10, 'UN', 'FALTA ESTA MERCADERIA POR QUE EN VEZ DE EL VINO EL LAOMEG 3037'
from incidents i where i.incident_number = 'INC-2026-000007'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAOMEG3994' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAOMEG2604' limit 1), 'LAOMEG2604', 'CONTROL TXCAR P/PORTON AUTO OMEGA', 0, 0, 60, 60, 'UN', 'falta esta mercaderia vino el LAOMEG3959 en ves del LAOMEG2604'
from incidents i where i.incident_number = 'INC-2026-000007'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAOMEG2604' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4030110' limit 1), 'LA4030110', 'MANG.EN BOBINA TOPFLEX 3/4"x100M-VIQUA', 0, 0, 20, 20, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000008'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4030110' and ii.affected_qty = 20);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1110302E' limit 1), 'LA1110302E', 'GRIFO"FOZ"BL.LAV.MESADA BAJO', 0, 0, 70, 70, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000008'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1110302E' and ii.affected_qty = 70);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4070102' limit 1), 'LA4070102', 'MANGUERA ULTRAFUERTE 1/2X100M-VIQUA', 0, 0, 50, 50, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000009'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4070102' and ii.affected_qty = 50);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1130302E' limit 1), 'LA1130302E', 'GRIFO"MARUJA"BL.LAV.MESADA BAJ', 0, 0, 70, 70, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000009'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1130302E' and ii.affected_qty = 70);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA203' limit 1), 'LA203', 'NEGROLIN TINTA ASFALTICA 3,6LT', 0, 0, 11, 11, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000010'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA203' and ii.affected_qty = 11);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA218' limit 1), 'LA218', 'NEGROLIN TINTA ASFALTICA 18 LT', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000010'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA218' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2018' limit 1), 'LA2018', 'VEDALIT ADITIVO DE 18 LITROS', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000010'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2018' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA103' limit 1), 'LA103', 'VEDACIT IMPERMEABILIZANTE 3,6L', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000010'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA103' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100802' limit 1), 'LA6100802', 'CHAPA TERMOACUSTICA 4.27', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000011'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100802' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100803' limit 1), 'LA6100803', 'CHAPA TERMOACUSTICA 4,88', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000011'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100803' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100804' limit 1), 'LA6100804', 'CHAPA TERMOACUSTICA 5,49', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000011'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100804' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100805' limit 1), 'LA6100805', 'CHAPA TERMOACUSTICA 6,10', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000011'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100805' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100807' limit 1), 'LA6100807', 'CHAPA TERMOACUSTICA 7,30', 0, 0, 7, 7, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000011'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100807' and ii.affected_qty = 7);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAOMEG2282' limit 1), 'LAOMEG2282', 'ENGRANAJE ALUM. SILVER 15 DIENTES', 0, 0, 25, 25, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000007'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAOMEG2282' and ii.affected_qty = 25);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'sin codigo' limit 1), 'sin codigo', 'ENGRANAJE ALUM. SILVER 13 DIENTES', 0, 0, 25, 25, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000006'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'sin codigo' and ii.affected_qty = 25);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAESC0711' limit 1), 'LAESC0711', 'ESCALERA EXT. TRIPLE ALU 11x3 BTF', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000012'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAESC0711' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAESC0068' limit 1), 'LAESC0068', 'ESCALERA DOMESTICA ALU. 9PEL. BTF', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000012'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAESC0068' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/38' limit 1), 'LADENN4400/38', 'BOTIN DENVER PRO NRO.38', 0, 0, 2, 2, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000013'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/38' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/39' limit 1), 'LADENN4400/39', 'BOTIN DENVER PRO NRO.39', 0, 0, 2, 2, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/39' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/40' limit 1), 'LADENN4400/40', 'BOTIN DENVER PRO NRO.40', 0, 0, 3, 3, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/40' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/42' limit 1), 'LADENN4400/42', 'BOTIN DENVER PRO NRO.42', 0, 0, 7, 7, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/42' and ii.affected_qty = 7);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/45' limit 1), 'LADENN4400/45', 'BOTIN DENVER PRO NRO.45', 0, 0, 3, 3, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/45' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/38' limit 1), 'LADENN4400/38', 'BOTIN DENVER PRO NRO.38', 0, 0, 22, 22, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000014'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/38' and ii.affected_qty = 22);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6632250' limit 1), 'LA6632250', 'HILO PESCA CARRETE 0,80mm/250g-MAZZAF.', 0, 0, 48, 48, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000015'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6632250' and ii.affected_qty = 48);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6632128' limit 1), 'LA6632128', 'HILO PESCA CARRETE 0,80mm/500g-MAZZAF.', 0, 0, 24, 24, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000016'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6632128' and ii.affected_qty = 24);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300207' limit 1), 'LA6300207', 'MALLA NEGRO 65% 2,1X50 LIV CHILE', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000017'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300207' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAL060-0025' limit 1), 'LAL060-0025', 'LAMINA DE POLICAR.O GRIS 6MM 6x1.05M', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000018'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAL060-0025' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LART012A' limit 1), 'LART012A', 'RESISTENCIA ITALY TERMOCAL. 1500W.', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000019'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LART012A' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6775222' limit 1), 'LA6775222', 'FLUIDO MANCHESTER 700 CC', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000020'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6775222' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300114' limit 1), 'LA6300114', 'PICANA ELECTRICA 70CM', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000021'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300114' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA061338' limit 1), 'LA061338', 'BASE P/PISO ECO VERDE 2,0MM(50un)CORTAG', 0, 0, 12, 12, 'PAQ', null
from incidents i where i.incident_number = 'INC-2026-000022'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA061338' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA61894' limit 1), 'LA61894', 'BASE P/PISO 2MM', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000023'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA61894' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = '1' limit 1), '1', 'EXHIBIDOR GIRATORIO OPTIMA', 0, 0, 48, 48, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000024'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = '1' and ii.affected_qty = 48);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAAF66' limit 1), 'LAAF66', 'RUEDA ACERO P/PORTON 4" NAC.', 0, 0, 40, 40, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000025'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAAF66' and ii.affected_qty = 40);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA8010013' limit 1), 'LA8010013', 'CLAVO OPTIMA C/C. 2X11', 0, 0, 100, 100, 'KG', null
from incidents i where i.incident_number = 'INC-2026-000026'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA8010013' and ii.affected_qty = 100);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6063313' limit 1), 'LA6063313', 'BALIN AIRE (ARG) 250PC 5,5 SAVAGE', 0, 0, 75, 75, 'CJ', null
from incidents i where i.incident_number = 'INC-2026-000027'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6063313' and ii.affected_qty = 75);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6954920' limit 1), 'LA6954920', 'ASFALTO EN BOLSA 20KGS', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000028'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6954920' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6922900' limit 1), 'LA6922900', 'BALDE ALBANIL VOSS2000 M/INYECT.', 0, 0, 288, 288, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000029'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6922900' and ii.affected_qty = 288);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2391' limit 1), 'LA2391', 'PLANTERA EURORED CAF JVER42F', 0, 0, 6, 6, 'UN', 'TENIA QUE VENIR 12 Y SOLO VINO 6'
from incidents i where i.incident_number = 'INC-2026-000030'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2391' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6617914' limit 1), 'LA6617914', 'GRAMPA P/CANO OMEGA 2-1/2-ARG.', 0, 0, 250, 250, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000031'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6617914' and ii.affected_qty = 250);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6617915' limit 1), 'LA6617915', 'GRAMPA OMEGA 2 1/2" MALVAR', 0, 0, 250, 250, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000032'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6617915' and ii.affected_qty = 250);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6751910' limit 1), 'LA6751910', 'RODILLO DE LANA RULFIX. 23 CM C/M', 0, 0, 15, 15, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000033'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6751910' and ii.affected_qty = 15);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300214' limit 1), 'LA6300214', 'MALLA NEGRO 50% 4,2X100 CHILE', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300214' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300208' limit 1), 'LA6300208', 'MALLA NEGRO 80% 4,2X100 CHILE', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000034'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300208' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300204' limit 1), 'LA6300204', 'MALLA AZUL 65% 2,10X100 LIV CHILE', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300204' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300213' limit 1), 'LA6300213', 'MALLA NEGRO 35% 4,2X100 CHILE', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300213' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300666' limit 1), 'LA6300666', 'MALLA VERDE 80% 2,10X100 LIV CHILE', 0, 0, 36, 36, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000035'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300666' and ii.affected_qty = 36);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300204' limit 1), 'LA6300204', 'MALLA AZUL 65% 2,10X100 LIV CHILE', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000036'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300204' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300213' limit 1), 'LA6300213', 'MALLA NEGRO 35% 4,2X100 CHILE', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000036'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300213' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300666' limit 1), 'LA6300666', 'MALLA VERDE 80% 2,10X100 LIV CHILE', 0, 0, 36, 36, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000036'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300666' and ii.affected_qty = 36);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6300208' limit 1), 'LA6300208', 'MALLA NEGRO 80% 4,2X100 CHILE', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000037'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6300208' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1070101' limit 1), 'LA1070101', 'ADAPTADOR TANQUE AGUA 20x1/2"-VIQUA', 0, 0, 150, 150, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000038'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1070101' and ii.affected_qty = 150);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6958412' limit 1), 'LA6958412', 'LONA "OPTIMA" VERDE 5x4m', 0, 0, 12, 12, 'UN', 'tenia que venir 36 y vino 48'
from incidents i where i.incident_number = 'INC-2026-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6958412' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6960410' limit 1), 'LA6960410', 'LONA "OPTIMA" AZUL 5x3m', 0, 0, 1, 1, 'UN', 'tenia que venir 12 y vino 13'
from incidents i where i.incident_number = 'INC-2026-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6960410' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6960430' limit 1), 'LA6960430', 'LONA "OPTIMA" AZUL 9x5m', 0, 0, 2, 2, 'UN', 'tenia que venir 5 y vino 7'
from incidents i where i.incident_number = 'INC-2026-000039'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6960430' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LABALCF4400/42' limit 1), 'LABALCF4400/42', 'BOTIN NOBUCK CAFE C/C.P/P.N°42', 0, 0, 6, 6, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000040'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LABALCF4400/42' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LABEL4600/41' limit 1), 'LABEL4600/41', 'BOTIN S/CORDON PUNT.PLAST.No41', 0, 0, 2, 2, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000040'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LABEL4600/41' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LABALN4400/42' limit 1), 'LABALN4400/42', 'BOTIN NOBUCK C/COR.P/PLAS.No42', 0, 0, 6, 6, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000041'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LABALN4400/42' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LABAL4600/41' limit 1), 'LABAL4600/41', 'BOTIN C/CORDON PUNT.PLAST No41', 0, 0, 2, 2, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000041'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LABAL4600/41' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100807' limit 1), 'LA6100807', 'CHAPA TERMOACUSTICA 7,30', 0, 0, 2, 2, 'UN', 'Abolladura del material'
from incidents i where i.incident_number = 'INC-2026-000042'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100807' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6934458' limit 1), 'LA6934458', 'VENTILADOR TECHO SUPER OPTIMA.', 0, 0, 24, 24, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000043'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6934458' and ii.affected_qty = 24);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6934456' limit 1), 'LA6934456', 'VENTILADOR TECHO OPTIMA 5 VEL.', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000043'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6934456' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA118' limit 1), 'LA118', 'VEDACIT IMPERMEABILIZANTE 18LT', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000044'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA118' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 10, 10, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000044'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1102' limit 1), 'LA1102', 'COMPOUND ADESIVO (AyB) 1 KG', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000045'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1102' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 2, 2, 'UN', 'AMBOS TIENEN FUGA POR LA PARTE DE ABAJO'
from incidents i where i.incident_number = 'INC-2026-000046'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7000261' limit 1), 'LA7000261', 'TUBO MACHO FUS. 75X2 1/2 A.SYSTEM', 0, 0, 8, 8, 'UN', 'PROBLEMAS CON LA ROSCA , ES MAS PEQUÑA NO ENCASTRA CON OTROS ACCESORIOS'
from incidents i where i.incident_number = 'INC-2026-000047'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7000261' and ii.affected_qty = 8);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6600600' limit 1), 'LA6600600', 'TERMOFUSORA GASSMANN 1500 W ARG', 0, 0, 2, 2, 'UN', 'NO FUNCIONAN'
from incidents i where i.incident_number = 'INC-2026-000047'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6600600' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAPG36E' limit 1), 'LAPG36E', 'CINTA MET.KOMELON GRIPPER 3Mx16MM', 0, 0, 11, 11, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000048'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAPG36E' and ii.affected_qty = 11);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9800126' limit 1), 'LA9800126', 'PANEL CUAD.ADO.OPTIMA 24W-L/F', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000049'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9800126' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600136' limit 1), 'LA9600136', 'PANEL CUAD.EMB.OPTIMA 18W-L/F', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000049'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600136' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9700126' limit 1), 'LA9700126', 'PANEL RED.ADO.OPTIMA 18W-L/F', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000049'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9700126' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9800108' limit 1), 'LA9800108', 'PANEL CUAD.ADO.OPTIMA 30W-L/C', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000049'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9800108' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9500106' limit 1), 'LA9500106', 'PANEL RED.EMB.OPTIMA 12W-L/C', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000049'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9500106' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT20W-6500K' limit 1), 'LALEDT20W-6500K', 'FOCO LED T OPTIMA 20W 6500K', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000050'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT20W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT50W-6500K' limit 1), 'LALEDT50W-6500K', 'FOCO LED T OPTIMA 50W 6500K', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000050'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT50W-6500K' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT60W-6500K' limit 1), 'LALEDT60W-6500K', 'FOCO LED T OPTIMA 60W 6500K', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000050'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT60W-6500K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA5W-6500K' limit 1), 'LALEDA5W-6500K', 'FOCO LED A OPTIMA 5W 6500K', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000050'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA5W-6500K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9300115' limit 1), 'LA9300115', 'LED BULB OPTIMA T190-150W/E40-L/F', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000050'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9300115' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9300108' limit 1), 'LA9300108', 'LED BULB OPTIMA T150-80W/E40-L/F', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000050'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9300108' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAPT1' limit 1), 'LAPT1', 'THERMOESPUMA ALUMINIZADO 5MM20X1M', 0, 0, 2, 2, 'ROL', 'MERCADERIA AVERIADA, AMBOS VINIERON AVERIADOS'
from incidents i where i.incident_number = 'INC-2026-000051'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAPT1' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/46' limit 1), 'LADENN4400/46', 'BOTIN DENVER PRO NRO.46', 0, 0, 20, 20, 'PAR', 'FECHA DE FABRICACION MUY VIEJA 03/2023'
from incidents i where i.incident_number = 'INC-2026-000052'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/46' and ii.affected_qty = 20);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LADENN4400/47' limit 1), 'LADENN4400/47', 'BOTIN DENVER PRO NRO.47', 0, 0, 10, 10, 'PAR', 'FECHA DE FABRICACION MUY VIEJA 03/2023'
from incidents i where i.incident_number = 'INC-2026-000052'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LADENN4400/47' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1880' limit 1), 'LA1880', 'PIE DE CABRA MAX 80CM', 0, 0, 6, 6, 'UN', '1 ATADO DE 6 PIEZAS'
from incidents i where i.incident_number = 'INC-2026-000053'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1880' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2012' limit 1), 'LA2012', 'TAPA ACOLCHADA TPK BLANCO BR1', 0, 0, 60, 60, 'UN', 'EL MATERIAL NO CORRESPONDE CON EL PEDIDO'
from incidents i where i.incident_number = 'INC-2026-000054'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2012' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2013' limit 1), 'LA2013', 'TAPA ACOLCHADA TPK MARR.OS.CM1', 0, 0, 60, 60, 'UN', 'TENIA QUE VENIR 200 Y VINO 140UNI'
from incidents i where i.incident_number = 'INC-2026-000055'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2013' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533004362' limit 1), 'LA7841533004362', 'LED BULB TM-160 150W E40 L/F(C)', 0, 0, 30, 30, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000056'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533004362' and ii.affected_qty = 30);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533004355' limit 1), 'LA7841533004355', 'LED BULB TM-150 100W E40 L/F(C)', 0, 0, 5, 5, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000056'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533004355' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533006663' limit 1), 'LA7841533006663', 'VENTILADOR DE TECHO C/CONTROL EK', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000056'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533006663' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAPSF-003RS' limit 1), 'LAPSF-003RS', 'VENTILADOR DE PIE OPTIMA 5 ASPAS', 0, 0, 1, 1, 'UN', 'Una caja de 2 unidades'
from incidents i where i.incident_number = 'INC-2026-000057'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAPSF-003RS' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100152' limit 1), 'LA9100152', 'CISTERNA C9 MARRON OSCURO CM1', 0, 0, 10, 10, 'UN', 'TENIA QUE VENIR 700 UNIDADES Y SOLO VINO 690'
from incidents i where i.incident_number = 'INC-2026-000058'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100152' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAAF10' limit 1), 'LAAF10', 'RUEDA ACERO P/PORTON 3"NAC.', 0, 0, 10, 10, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000059'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAAF10' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAAF65' limit 1), 'LAAF65', 'RUEDA ACERO P/PORTON 2" NAC.', 0, 0, 25, 25, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000059'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAAF65' and ii.affected_qty = 25);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6000113' limit 1), 'LA6000113', 'TAPON PL.INOX.SAT. 304 2¨x1,5mm', 0, 0, 50, 50, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000060'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6000113' and ii.affected_qty = 50);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6000114' limit 1), 'LA6000114', 'TAPON PL.INOX.SAT.304 1-1/2¨x1,5mm', 0, 0, 50, 50, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000061'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6000114' and ii.affected_qty = 50);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6922996' limit 1), 'LA6922996', 'CORONA PARA HORMIGONERA', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000062'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6922996' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7000709' limit 1), 'LA7000709', 'CABLE MULTIFILAR 2MM-AZUL 100M', 0, 0, 2, 2, 'ROL', null
from incidents i where i.incident_number = 'INC-2026-000063'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7000709' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA690513' limit 1), 'LA690513', 'LATA GEL URBANFRESH 70G OCEAN', 0, 0, 4, 4, 'UN', 'VINO MAL ETIQUETADO, ES OCREAN PERO DICE VAINILLA'
from incidents i where i.incident_number = 'INC-2026-000064'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA690513' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA690514' limit 1), 'LA690514', 'LATA GEL URBANFRESH 70G VAINILLA', 0, 0, 4, 4, 'UN', 'ES OCEAN PERO DICE VAINILLA'
from incidents i where i.incident_number = 'INC-2026-000065'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA690514' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4030110' limit 1), 'LA4030110', 'MANG.EN BOBINA TOPFLEX 3/4"x100M-VIQUA', 0, 0, 4, 4, 'UN', 'Presenta quemaduras'
from incidents i where i.incident_number = 'INC-2026-000066'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4030110' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA701-E' limit 1), 'LA701-E', 'SILICONA FORMA JUNTEX GRIS 300ML', 0, 0, 94, 94, 'UN', 'PARA NC'
from incidents i where i.incident_number = 'INC-2026-000067'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA701-E' and ii.affected_qty = 94);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA928-0015' limit 1), 'LA928-0015', 'FILTRO AQUA STAR P/AS2(928-0003)', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000068'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA928-0015' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA09494-2' limit 1), 'LA09494-2', 'FECHADURA LEGACY EXT F-2600/82 CR', 0, 0, 40, 40, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000069'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA09494-2' and ii.affected_qty = 40);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA04696-5' limit 1), 'LA04696-5', 'CILINDRO TETRA 3LLAVES C800-BL', 0, 0, 5, 5, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000069'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA04696-5' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAPT1' limit 1), 'LAPT1', 'THERMOESPUMA ALUMINIZADO 5MM20X1M', 0, 0, 2, 2, 'ROL', null
from incidents i where i.incident_number = 'INC-2026-000070'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAPT1' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6633397' limit 1), 'LA6633397', 'HILO PESCA CARRETE 0,90MM/250g-MAZZAF.', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000071'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6633397' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6632250' limit 1), 'LA6632250', 'HILO PESCA CARRETE 0,80mm/250g-MAZZAF.', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000071'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6632250' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA3833684' limit 1), 'LA3833684', 'BORAX (FUDENTE P/SOLDADURA 250GRS)', 0, 0, 33, 33, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000072'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA3833684' and ii.affected_qty = 33);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA5982290' limit 1), 'LA5982290', 'CAÑO FUSION AGUA 90MM PN20X4MT', 0, 0, 36, 36, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000072'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA5982290' and ii.affected_qty = 36);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA201' limit 1), 'LA201', 'NEGROLIN TINTA ASFALTICA 900ML', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000073'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA201' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA218' limit 1), 'LA218', 'NEGROLIN TINTA ASFALTICA 18 LT', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000073'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA218' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6101104' limit 1), 'LA6101104', 'PICO INFLADOR"SCHW" 825(H)1/4', 0, 0, 10, 10, 'UN', 'SOBRANTE, 5 CAJAS DE 150 UNI MAS UNA CAJA DE 100 UNI 850UNI TOTAL'
from incidents i where i.incident_number = 'INC-2026-000074'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6101104' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAAN006' limit 1), 'LAAN006', 'ANODO MAGNESIO OPTIMA', 0, 0, 295, 295, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000075'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAAN006' and ii.affected_qty = 295);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA218' limit 1), 'LA218', 'NEGROLIN TINTA ASFALTICA 18 LT', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000076'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA218' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA201' limit 1), 'LA201', 'NEGROLIN TINTA ASFALTICA 900ML', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000076'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA201' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA203' limit 1), 'LA203', 'NEGROLIN TINTA ASFALTICA 3,6LT', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000076'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA203' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 11, 11, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000076'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 11);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA43603/117' limit 1), 'LA43603/117', 'LL.TUBO HEX.TRAM MASTER 1/2 17 MM', 0, 0, 4, 4, 'UN', 'TENIA QUE VENIR LA43603/117 MASTER, PERO VINO 44833/117 PRO'
from incidents i where i.incident_number = 'INC-2026-000077'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA43603/117' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA3650' limit 1), 'LA3650', 'SIFON FLEXIBLE UNIV. NEGRO SSUC3-ASTRA', 0, 0, 12, 12, 'UN', 'TENIA QUE VENIR SOLO 18 Y NIVO 3 CAJAS DE 10 30UNI'
from incidents i where i.incident_number = 'INC-2026-000078'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA3650' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA203' limit 1), 'LA203', 'NEGROLIN TINTA ASFALTICA 3,6LT', 0, 0, 9, 9, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000079'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA203' and ii.affected_qty = 9);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 32, 32, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000079'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 32);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA992100' limit 1), 'LA992100', 'PALA BIASSONI FORJADA ANCHA', 0, 0, 12, 12, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000080'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA992100' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA992150' limit 1), 'LA992150', 'PALA BIASSONI FORJADA PUNTEAR', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000080'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA992150' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA992152' limit 1), 'LA992152', 'PALA BIASSONI M/HIERRO PUNTEAR', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000080'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA992152' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6733402' limit 1), 'LA6733402', 'PRENSA RAPIDA CHINA 200', 0, 0, 60, 60, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000081'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6733402' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6733403' limit 1), 'LA6733403', 'PRENSA RAPIDA CHINA 300', 0, 0, 60, 60, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000082'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6733403' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100150' limit 1), 'LA9100150', 'CISTERNA C9 BLANCO BR1', 0, 0, 10, 10, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000083'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100150' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9100152' limit 1), 'LA9100152', 'CISTERNA C9 MARRON OSCURO CM1', 0, 0, 10, 10, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000084'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9100152' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100803' limit 1), 'LA6100803', 'CHAPA TERMOACUSTICA 4,88', 0, 0, 1, 1, 'UN', 'Chapas con daños por impacto'
from incidents i where i.incident_number = 'INC-2026-000085'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100803' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100804' limit 1), 'LA6100804', 'CHAPA TERMOACUSTICA 5,49', 0, 0, 1, 1, 'UN', 'Chapas con daños por impacto'
from incidents i where i.incident_number = 'INC-2026-000085'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100804' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9167140' limit 1), 'LA9167140', 'CONEXION DE PLAST. ORION 40 CM', 0, 0, 200, 200, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000086'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9167140' and ii.affected_qty = 200);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9167130' limit 1), 'LA9167130', 'CONEXION DE PLAST. ORION 30 CM', 0, 0, 200, 200, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000087'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9167130' and ii.affected_qty = 200);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAPT31' limit 1), 'LAPT31', 'AISLANTE P/PUERTA 0,90MTS ISOLANT', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000088'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAPT31' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6617913' limit 1), 'LA6617913', 'GRAMPA OMEGA 1/2" MALVAR', 0, 0, 400, 400, 'UN', 'TENIA QUE VENIR 30 CAJAS DE 200UNI Y VINO SOLO 28 CAJAS DE 200UNI'
from incidents i where i.incident_number = 'INC-2026-000089'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6617913' and ii.affected_qty = 400);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6617923' limit 1), 'LA6617923', 'GRAMPA OMEGA 1" MALVAR', 0, 0, 200, 200, 'UN', 'TENIA QUE VENIR 30 CAJAS DE 100 UNI Y VINO 32 CAJAS DE 100UNI'
from incidents i where i.incident_number = 'INC-2026-000090'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6617923' and ii.affected_qty = 200);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA25505' limit 1), 'LA25505', 'RODILLO P/EPOXI 5CM C/MANGO ROMA', 0, 0, 108, 108, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000091'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA25505' and ii.affected_qty = 108);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA63512' limit 1), 'LA63512', 'PINCEL P/LIMPIEZA REDONDO ROMA 12', 0, 0, 60, 60, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000091'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA63512' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA303007' limit 1), 'LA303007', 'PINCEL ROMA 303 3"NAT.BLANCO', 0, 0, 60, 60, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000092'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA303007' and ii.affected_qty = 60);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA25509' limit 1), 'LA25509', 'RODILLO P/EPOXI 9CM C/MANGO ROMA', 0, 0, 108, 108, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000092'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA25509' and ii.affected_qty = 108);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6923916' limit 1), 'LA6923916', 'BARRA NYLON 50X1000MM (2,45KG)', 0, 0, 100, 100, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000093'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6923916' and ii.affected_qty = 100);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7030003' limit 1), 'LA7030003', 'CLAVO P/CHAPA TORCIONADO 20PAQ.', 0, 0, 2, 2, 'BOL', null
from incidents i where i.incident_number = 'INC-2026-000094'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7030003' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA5980637' limit 1), 'LA5980637', 'CAÑO FUSION AGUA 25MM PN20 X 4MTS', 0, 0, 80, 80, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000095'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA5980637' and ii.affected_qty = 80);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAA32' limit 1), 'LAA32', 'CORREA EN V 13mmx813mm-CHINA', 0, 0, 20, 20, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000096'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAA32' and ii.affected_qty = 20);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6905175' limit 1), 'LA6905175', 'CONO PLASTICO BRASIL 75CM', 0, 0, 10, 10, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000097'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6905175' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA51265' limit 1), 'LA51265', 'NIVEL ALUMINIO 12" MAX', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000098'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA51265' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA90810' limit 1), 'LA90810', 'ESCUADRA M/PLASTICO 8" MAX', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000098'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA90810' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA91210' limit 1), 'LA91210', 'ESCUADRA M/PLASTICO 12" MAX', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000098'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA91210' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA77850/684' limit 1), 'LA77850/684', 'ESCOBA PLAST. C/M 18D NG PROMO TRAM', 0, 0, 288, 288, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000099'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA77850/684' and ii.affected_qty = 288);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA02020010' limit 1), 'LA02020010', 'TANQUE AGUA C/TAPA 5.000L FORTLEV', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000100'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA02020010' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2080032' limit 1), 'LA2080032', 'TANQUE SLIM PE 600L FORTLEV', 0, 0, 5, 5, 'UN', 'FALTO EL ACCESORIO'
from incidents i where i.incident_number = 'INC-2026-000101'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2080032' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4030110' limit 1), 'LA4030110', 'MANG.EN BOBINA TOPFLEX 3/4"x100M-VIQUA', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000102'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4030110' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1130301E' limit 1), 'LA1130301E', 'GRIFO"MARUJA"CR.LAV.MESADA BAJ', 0, 0, 350, 350, 'UN', '5 CAJAS DE 70 UN'
from incidents i where i.incident_number = 'INC-2026-000103'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1130301E' and ii.affected_qty = 350);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA42805/112' limit 1), 'LA42805/112', 'LLAVE L TRAMONTINA 12MM', 0, 0, 84, 84, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000104'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA42805/112' and ii.affected_qty = 84);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT30W-6500K' limit 1), 'LALEDT30W-6500K', 'FOCO LED T OPTIMA 30W 6500K', 0, 0, 31, 31, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT30W-6500K' and ii.affected_qty = 31);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT20W-6500K' limit 1), 'LALEDT20W-6500K', 'FOCO LED T OPTIMA 20W 6500K', 0, 0, 22, 22, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT20W-6500K' and ii.affected_qty = 22);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA5W-6500K' limit 1), 'LALEDA5W-6500K', 'FOCO LED A OPTIMA 5W 6500K', 0, 0, 5, 5, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA5W-6500K' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT15W-6500K' limit 1), 'LALEDT15W-6500K', 'FOCO LED T OPTIMA 15W 6500K', 0, 0, 2, 2, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT15W-6500K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA15W-6500K' limit 1), 'LALEDA15W-6500K', 'FOCO LED A OPTIMA 15W 6500K', 0, 0, 3, 3, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA15W-6500K' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA22W-6500K' limit 1), 'LALEDA22W-6500K', 'FOCO LED A OPTIMA 22W 6500K', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA22W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA9W-6500K' limit 1), 'LALEDA9W-6500K', 'FOCO LED A OPTIMA 9W 6500K', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA9W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT60W-6500K' limit 1), 'LALEDT60W-6500K', 'FOCO LED T OPTIMA 60W 6500K', 0, 0, 5, 5, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT60W-6500K' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9300108' limit 1), 'LA9300108', 'LED BULB OPTIMA T150-80W/E40-L/F', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9300108' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9300115' limit 1), 'LA9300115', 'LED BULB OPTIMA T190-150W/E40-L/F', 0, 0, 3, 3, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9300115' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT40W-6500K' limit 1), 'LALEDT40W-6500K', 'FOCO LED T OPTIMA 40W 6500K', 0, 0, 5, 5, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT40W-6500K' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT50W-6500K' limit 1), 'LALEDT50W-6500K', 'FOCO LED T OPTIMA 50W 6500K', 0, 0, 26, 26, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT50W-6500K' and ii.affected_qty = 26);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA5W-3000K' limit 1), 'LALEDA5W-3000K', 'FOCO LED A OPTIMA 5W 3000K', 0, 0, 2, 2, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA5W-3000K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9800126' limit 1), 'LA9800126', 'PANEL CUAD.ADO.OPTIMA 24W-L/F', 0, 0, 6, 6, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9800126' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9800108' limit 1), 'LA9800108', 'PANEL CUAD.ADO.OPTIMA 30W-L/C', 0, 0, 2, 2, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9800108' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600112' limit 1), 'LA9600112', 'PANEL CUAD.EMB.OPTIMA 30W-L/C', 0, 0, 3, 3, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600112' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9700110' limit 1), 'LA9700110', 'PANEL RED.ADO.OPTIMA 30W-L/C', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9700110' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600104' limit 1), 'LA9600104', 'PANEL CUAD.EMB.OPTIMA 9W-L/C', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600104' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600130' limit 1), 'LA9600130', 'PANEL CUAD.EMB.OPTIMA 5W-L/F', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600130' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600138' limit 1), 'LA9600138', 'PANEL CUAD.EMB.OPTIMA 24W-L/F', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600138' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9500106' limit 1), 'LA9500106', 'PANEL RED.EMB.OPTIMA 12W-L/C', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9500106' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9700126' limit 1), 'LA9700126', 'PANEL RED.ADO.OPTIMA 18W-L/F', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9700126' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9600136' limit 1), 'LA9600136', 'PANEL CUAD.EMB.OPTIMA 18W-L/F', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9600136' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA70277' limit 1), 'LA70277', 'PLAFON C/PORCEL. BLANCO OPTIMA', 0, 0, 7, 7, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000107'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA70277' and ii.affected_qty = 7);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6590104' limit 1), 'LA6590104', 'IONIZADOR SOLAR P/PISCINA OPTIMA', 0, 0, 5, 5, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000108'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6590104' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALY-BL015A' limit 1), 'LALY-BL015A', 'LICUADORA MET. 350W. VASO CRISTAL', 0, 0, 2, 2, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000109'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALY-BL015A' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LY-BL016' limit 1), 'LY-BL016', 'LICUADORA MET. 350W. VASO CRISTAL', 0, 0, 8, 8, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000109'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LY-BL016' and ii.affected_qty = 8);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2020040' limit 1), 'LA2020040', 'MC.LAVATORIO CR ALTO 30CM CATANIA', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000110'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2020040' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2020024' limit 1), 'LA2020024', 'MC.COCINA MESADA CROMO VERONA', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000110'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2020024' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2020054' limit 1), 'LA2020054', 'MC.DUCHA EXTERNA CROMO CATANIA', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000110'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2020054' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2020088' limit 1), 'LA2020088', 'MC.COCINA MESADA SUPER LUJO VERONA', 0, 0, 2, 2, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000110'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2020088' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2020076' limit 1), 'LA2020076', 'MC.COC.MESADA FLEX.NEGRO SIENA', 0, 0, 1, 1, 'UN', 'AVERIADO.'
from incidents i where i.incident_number = 'INC-2026-000110'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2020076' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100807' limit 1), 'LA6100807', 'CHAPA TERMOACUSTICA 7,30', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000111'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100807' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100806' limit 1), 'LA6100806', 'CHAPA TERMOACUSTICA 6,70', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000111'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100806' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6100803' limit 1), 'LA6100803', 'CHAPA TERMOACUSTICA 4,88', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000111'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6100803' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2070025' limit 1), 'LA2070025', 'TANQUE POLIETILENO 5.000 FORTLEV', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000112'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2070025' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6922902' limit 1), 'LA6922902', 'BALDE ALBAÑIL PARAGUAY 8 LTS.', 0, 0, 100, 100, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000113'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6922902' and ii.affected_qty = 100);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2094' limit 1), 'LA2094', 'LAVAMANOS LV0/X1 BEIGE CL. BG5', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000114'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2094' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2099' limit 1), 'LA2099', 'LAVAMANOS LV0/X1 GRIS CL. CZ2', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000115'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2099' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6926880' limit 1), 'LA6926880', 'HEMBRA TIRA TRAILER 1.7/8x21/2', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000116'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6926880' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6926882' limit 1), 'LA6926882', 'HEMBRA TIRA TRAILER 2"x2 1/2"', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000116'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6926882' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6606900' limit 1), 'LA6606900', 'CAJA P/BIE SOBREPONER 60x45x17-NAC.', 0, 0, 1, 1, 'UN', 'FALTO UNA UNIDAD TENIA QUE VENIR 100 Y VINO 99'
from incidents i where i.incident_number = 'INC-2026-000117'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6606900' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA10000201' limit 1), 'LA10000201', 'TUBO PVC SOLDABLE 20MM FORTLEV', 0, 0, 1, 1, 'UN', 'FALTO EN UN ATADO DE 10'
from incidents i where i.incident_number = 'INC-2026-000118'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA10000201' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000119'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA101' limit 1), 'LA101', 'VEDACIT IMPERMEABILIZANTE 900ML', 0, 0, 8, 8, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000119'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA101' and ii.affected_qty = 8);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6905150' limit 1), 'LA6905150', 'CONO PLASTICO BRASIL 50CM', 0, 0, 19, 19, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000120'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6905150' and ii.affected_qty = 19);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6905175' limit 1), 'LA6905175', 'CONO PLASTICO BRASIL 75CM', 0, 0, 11, 11, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000120'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6905175' and ii.affected_qty = 11);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1026' limit 1), 'LA1026', 'CAÑO CORRUG. 20MM-1/2-25MTS OPTIMA', 0, 0, 1, 1, 'ROL', 'FALTO UNA UNIDAD DE CAÑO CORRUGADO'
from incidents i where i.incident_number = 'INC-2026-000121'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1026' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA8010007' limit 1), 'LA8010007', 'CLAVO OPTIMA C/C. 2-1/2X11', 0, 0, 3680, 3680, 'KG', null
from incidents i where i.incident_number = 'INC-2026-000122'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA8010007' and ii.affected_qty = 3680);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6806445' limit 1), 'LA6806445', 'GUIA PARA CAJON BLANCO 45CM', 0, 0, 120, 120, 'JGO', null
from incidents i where i.incident_number = 'INC-2026-000123'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6806445' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6806440' limit 1), 'LA6806440', 'GUIA PARA CAJON BLANCO 40CM', 0, 0, 120, 120, 'JGO', null
from incidents i where i.incident_number = 'INC-2026-000124'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6806440' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 3, 3, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000125'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA201' limit 1), 'LA201', 'NEGROLIN TINTA ASFALTICA 900ML', 0, 0, 7, 7, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000125'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA201' and ii.affected_qty = 7);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA218' limit 1), 'LA218', 'NEGROLIN TINTA ASFALTICA 18 LT', 0, 0, 1, 1, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000125'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA218' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6897618' limit 1), 'LA6897618', 'ALAMBRE NEGRO BELGO No 18/1Kg.', 0, 0, 2000, 2000, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000126'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6897618' and ii.affected_qty = 2000);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4030103' limit 1), 'LA4030103', 'MANG.EN BOBINA TOPFLEX 1/2"x200M-VIQUA', 0, 0, 1, 1, 'UN', 'Con quemaduras'
from incidents i where i.incident_number = 'INC-2026-000127'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4030103' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4030102' limit 1), 'LA4030102', 'MANG.EN BOBINA TOPFLEX 1/2"x100M-VIQUA', 0, 0, 1, 1, 'UN', 'Con quemaduras'
from incidents i where i.incident_number = 'INC-2026-000127'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4030102' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA4030102' limit 1), 'LA4030102', 'MANG.EN BOBINA TOPFLEX 1/2"x100M-VIQUA', 0, 0, 4, 4, 'UN', 'FALTÓ'
from incidents i where i.incident_number = 'INC-2026-000128'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA4030102' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6906625' limit 1), 'LA6906625', 'PINZA P/BATERIA 25A ARG.C/PROTEC.', 0, 0, 20, 20, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000129'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6906625' and ii.affected_qty = 20);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6906650' limit 1), 'LA6906650', 'PINZA P/BATERIA 50A ARG.C/PROTEC.', 0, 0, 18, 18, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000129'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6906650' and ii.affected_qty = 18);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9300115' limit 1), 'LA9300115', 'LED BULB OPTIMA T190-150W/E40-L/F', 0, 0, 5, 5, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9300115' and ii.affected_qty = 5);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT50W-6500K' limit 1), 'LALEDT50W-6500K', 'FOCO LED T OPTIMA 50W 6500K', 0, 0, 19, 19, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT50W-6500K' and ii.affected_qty = 19);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT30W-6500K' limit 1), 'LALEDT30W-6500K', 'FOCO LED T OPTIMA 30W 6500K', 0, 0, 2, 2, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT30W-6500K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA22W-6500K' limit 1), 'LALEDA22W-6500K', 'FOCO LED A OPTIMA 22W 6500K', 0, 0, 2, 2, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA22W-6500K' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDT20W-6500K' limit 1), 'LALEDT20W-6500K', 'FOCO LED T OPTIMA 20W 6500K', 0, 0, 1, 1, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDT20W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA18W-6500K' limit 1), 'LALEDA18W-6500K', 'FOCO LED A OPTIMA 18W 6500K', 0, 0, 1, 1, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA18W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LALEDA12W-6500K' limit 1), 'LALEDA12W-6500K', 'FOCO LED A OPTIMA 12W 6500K', 0, 0, 1, 1, 'UN', 'AVERIADO'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LALEDA12W-6500K' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA9700126' limit 1), 'LA9700126', 'PANEL RED.ADO.OPTIMA 18W-L/F', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA9700126' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533004874' limit 1), 'LA7841533004874', 'REFLECTOR LED SMD BLANCO 200W EK', 0, 0, 9, 9, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000131'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533004874' and ii.affected_qty = 9);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533008391' limit 1), 'LA7841533008391', 'LED BULB 150W E40 L/F-BIVOLT"EK"', 0, 0, 24, 24, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000131'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533008391' and ii.affected_qty = 24);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533008339' limit 1), 'LA7841533008339', 'LED BULB 100W E40 L/F-BIVOLT"EK"', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000131'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533008339' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LABAL4600/39' limit 1), 'LABAL4600/39', 'BOTIN C/CORDON PUNT.PLAST No39', 0, 0, 10, 10, 'PAR', null
from incidents i where i.incident_number = 'INC-2026-000132'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LABAL4600/39' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LABEL4600/39' limit 1), 'LABEL4600/39', 'BOTIN S/CORDON PUNT.PLAST.No39', 0, 0, 10, 10, 'PAR', 'Por la etiqueta del producto dice BAL4600/'
from incidents i where i.incident_number = 'INC-2026-000133'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LABEL4600/39' and ii.affected_qty = 10);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1027' limit 1), 'LA1027', 'CAÑO CORRUG. 25MM-3/4-25MTS OPTIMA', 0, 0, 3, 3, 'ROL', null
from incidents i where i.incident_number = 'INC-2026-000134'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1027' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA1026' limit 1), 'LA1026', 'CAÑO CORRUG. 20MM-1/2-25MTS OPTIMA', 0, 0, 32, 32, 'ROL', null
from incidents i where i.incident_number = 'INC-2026-000135'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA1026' and ii.affected_qty = 32);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA41105/302' limit 1), 'LA41105/302', 'PINZA CORTE LATERAL TRAM 4 ECO', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000136'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA41105/302' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA43601/115' limit 1), 'LA43601/115', 'LL.TUBO EST.TRAM MASTER 1/2 15MM', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000136'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA43601/115' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA43601/116' limit 1), 'LA43601/116', 'LL.TUBO EST.TRAM MASTER 1/2 16MM', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000137'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA43601/116' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2061' limit 1), 'LA2061', 'CANILLA PL.P/LAVAT.BEIGE CL.-ASTRA', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000138'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2061' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LAEFR9930E' limit 1), 'LAEFR9930E', 'ESCALERA F.VIDRIO EXT.BOTAFOGO 12x2', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000139'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LAEFR9930E' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2760100' limit 1), 'LA2760100', 'ARO DESPLAZADO DE PVC P/INODORO 12CM', 0, 0, 1, 1, 'UN', 'ROTO'
from incidents i where i.incident_number = 'INC-2026-000140'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2760100' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA5980631' limit 1), 'LA5980631', 'SELLA ROSCA P/CANO PL.125cc(ARG)', 0, 0, 345, 345, 'UN', 'SIN FECHA DE VENCIMIENTO'
from incidents i where i.incident_number = 'INC-2026-000140'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA5980631' and ii.affected_qty = 345);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA5980638' limit 1), 'LA5980638', 'SELLA ROSCA P/CANO PL.25cc(ARG)', 0, 0, 540, 540, 'UN', 'SIN FECHA DE VENCIMIENTO'
from incidents i where i.incident_number = 'INC-2026-000140'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA5980638' and ii.affected_qty = 540);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA5980602' limit 1), 'LA5980602', 'CANAMO 200 grs', 0, 0, 13, 13, 'PAQ', 'Falto 2,600gr'
from incidents i where i.incident_number = 'INC-2026-000141'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA5980602' and ii.affected_qty = 13);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533008391' limit 1), 'LA7841533008391', 'LED BULB 150W E40 L/F-BIVOLT"EK"', 0, 0, 24, 24, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533008391' and ii.affected_qty = 24);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533004874' limit 1), 'LA7841533004874', 'REFLECTOR LED SMD BLANCO 200W EK', 0, 0, 18, 18, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533004874' and ii.affected_qty = 18);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533004355' limit 1), 'LA7841533004355', 'LED BULB TM-150 100W E40 L/F(C)', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533004355' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533007608' limit 1), 'LA7841533007608', 'VENTILADOR TECHO EK EF-56U/3B 70W NEG', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533007608' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533004867' limit 1), 'LA7841533004867', 'REFLECTOR LED SMD BLANCO 100W EK', 0, 0, 7, 7, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533004867' and ii.affected_qty = 7);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533003549' limit 1), 'LA7841533003549', 'LED BULB YT-A95 20W E27L/F (C)', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533003549' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533003525' limit 1), 'LA7841533003525', 'LED BULB YT-A80 18W E27L/F (C)', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533003525' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533003488' limit 1), 'LA7841533003488', 'LED BULB YT-A70 15W E27L/F (C)', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533003488' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA7841533003440' limit 1), 'LA7841533003440', 'LED BULB YT-A60 12W E27L/F (C)', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA7841533003440' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA103' limit 1), 'LA103', 'VEDACIT IMPERMEABILIZANTE 3,6L', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000143'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA103' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 7, 7, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000143'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 7);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6897409' limit 1), 'LA6897409', 'ALAMBRE GALV. No 9 (3,76MM)50KG', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000144'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6897409' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6897422' limit 1), 'LA6897422', 'ALAMBRE GALV. No 12 (2,72MM)50KG', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000145'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6897422' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA203' limit 1), 'LA203', 'NEGROLIN TINTA ASFALTICA 3,6LT', 0, 0, 3, 3, 'UN', 'manchados'
from incidents i where i.incident_number = 'INC-2026-000146'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA203' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA11001008' limit 1), 'LA11001008', 'TUBO PVC SOLDABLE PY 6M-DN 100', 0, 0, 3, 3, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000147'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA11001008' and ii.affected_qty = 3);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA2003' limit 1), 'LA2003', 'VEDALIT ADITIVO DE 3,6 LITROS', 0, 0, 9, 9, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000148'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA2003' and ii.affected_qty = 9);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA101' limit 1), 'LA101', 'VEDACIT IMPERMEABILIZANTE 900ML', 0, 0, 6, 6, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000148'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA101' and ii.affected_qty = 6);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA118' limit 1), 'LA118', 'VEDACIT IMPERMEABILIZANTE 18LT', 0, 0, 1, 1, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000148'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA118' and ii.affected_qty = 1);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA103' limit 1), 'LA103', 'VEDACIT IMPERMEABILIZANTE 3,6L', 0, 0, 4, 4, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000148'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA103' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA218' limit 1), 'LA218', 'NEGROLIN TINTA ASFALTICA 18 LT', 0, 0, 2, 2, 'UN', 'mercaderia averiada'
from incidents i where i.incident_number = 'INC-2026-000149'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA218' and ii.affected_qty = 2);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA203' limit 1), 'LA203', 'NEGROLIN TINTA ASFALTICA 3,6LT', 0, 0, 12, 12, 'UN', 'mercaderia averiada'
from incidents i where i.incident_number = 'INC-2026-000149'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA203' and ii.affected_qty = 12);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA201' limit 1), 'LA201', 'NEGROLIN TINTA ASFALTICA 900ML', 0, 0, 4, 4, 'UN', 'mercaderia averiada'
from incidents i where i.incident_number = 'INC-2026-000149'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA201' and ii.affected_qty = 4);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6926882' limit 1), 'LA6926882', 'HEMBRA TIRA TRAILER 2"x2 1/2"', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000150'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6926882' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6926880' limit 1), 'LA6926880', 'HEMBRA TIRA TRAILER 1.7/8x21/2', 0, 0, 120, 120, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000150'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6926880' and ii.affected_qty = 120);
insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = 'LA6580500' limit 1), 'LA6580500', 'VALVULA DE GAS V-5S', 0, 0, 2, 2, 'UN', null
from incidents i where i.incident_number = 'INC-2026-000151'
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = 'LA6580500' and ii.affected_qty = 2);

-- 5) HISTORIAL de creación (por incidencia migrada)
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000001'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000002'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000003'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000004'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000005'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000006'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000007'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000008'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000009'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000010'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000011'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000012'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000013'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000014'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000015'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000016'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000017'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000018'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000019'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000020'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000021'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000022'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000023'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000024'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000025'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000026'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000027'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000028'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000029'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000030'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000031'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000032'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000033'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000034'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000035'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000036'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000037'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000038'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000039'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000040'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000041'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000042'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000043'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000044'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000045'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2025-000046'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000001'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000002'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000003'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000004'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000005'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000006'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000007'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000008'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000009'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000010'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000011'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000012'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000013'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000014'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000015'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000016'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000017'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000018'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000019'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000020'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000021'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000022'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000023'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000024'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000025'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000026'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000027'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000028'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000029'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000030'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000031'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000032'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000033'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000034'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000035'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000036'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000037'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000038'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000039'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000040'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000041'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000042'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000043'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000044'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000045'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000046'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000047'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000048'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000049'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000050'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000051'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000052'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000053'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000054'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000055'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000056'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000057'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000058'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000059'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000060'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000061'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000062'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000063'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000064'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000065'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000066'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000067'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000068'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000069'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000070'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000071'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000072'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000073'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000074'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000075'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000076'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000077'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000078'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000079'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000080'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000081'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000082'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000083'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000084'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000085'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000086'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000087'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000088'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000089'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000090'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000091'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000092'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000093'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000094'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000095'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000096'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000097'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000098'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000099'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000100'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000101'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000102'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000103'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000104'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000105'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000106'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000107'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000108'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000109'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000110'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000111'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000112'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000113'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000114'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000115'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000116'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000117'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000118'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000119'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000120'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000121'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000122'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000123'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000124'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000125'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000126'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000127'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000128'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000129'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000130'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000131'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000132'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000133'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000134'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000135'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000136'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000137'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000138'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000139'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000140'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000141'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000142'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000143'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000144'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000145'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000146'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000147'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000148'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000149'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000150'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = 'INC-2026-000151'
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);

-- 6) Correlativos (para que nuevas incidencias continúen)
insert into incident_counters (year, last_number) values (2025, 46)
on conflict (year) do update set last_number = greatest(incident_counters.last_number, excluded.last_number);
insert into incident_counters (year, last_number) values (2026, 151)
on conflict (year) do update set last_number = greatest(incident_counters.last_number, excluded.last_number);
