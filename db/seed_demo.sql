-- ============================================================================
--  SEED DEMO (opcional) — proveedores y productos de ejemplo para probar la UI.
--  Correr en el SQL Editor si querés datos de catálogo para el formulario.
--  Los catálogos reales se cargarán luego por importación de Excel.
-- ============================================================================

insert into suppliers (nombre, ruc) values
  ('ORION S.R.L.',              '80012345-6'),
  ('ATLANTIC S.A.E.',          '80023456-7'),
  ('ZR DISTRIBUIDORA',         '80034567-8'),
  ('FORTLEV INDUSTRIA E COMERCIO LTDA', '80045678-9')
on conflict do nothing;

insert into products (codigo, descripcion, um) values
  ('LA9100102', 'TAPA WATER TPQ MARR. OSC. CM1', 'UN'),
  ('LA02020010','TANQUE AGUA C/TAPA 5.000L FORTLEV', 'UN'),
  ('LA6901998', 'GUANTE DE CUERO CAÑO LARGO', 'PAR'),
  ('LA5510023', 'CAÑO PVC 100MM x 6M', 'UN'),
  ('LA7720011', 'CODO PVC 90° 100MM', 'UN')
on conflict (codigo) do nothing;
