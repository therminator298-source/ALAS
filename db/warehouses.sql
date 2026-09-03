-- ============================================================================
--  Depósitos reales de ALAS (Fábrica · Depósito Central · Depósito Luque Sanber)
--  Correr en Supabase → SQL Editor. Idempotente; no requiere constraints únicas.
-- ============================================================================

-- 1) Desactivar todos (los de ejemplo quedan ocultos en los selects)
update warehouses set activo = false;

-- 2) Insertar los que falten (match por nombre)
insert into warehouses (nombre, codigo, activo)
select v.nombre, v.codigo, true
from (values
  ('Fábrica',               'FAB'),
  ('Depósito Central',      'DEP-CEN'),
  ('Depósito Luque Sanber', 'DEP-LUQ')
) v(nombre, codigo)
where not exists (select 1 from warehouses w where w.nombre = v.nombre);

-- 3) Reactivar + normalizar código de los 3 vigentes
update warehouses
set activo = true,
    codigo = case nombre
      when 'Fábrica'               then 'FAB'
      when 'Depósito Central'      then 'DEP-CEN'
      when 'Depósito Luque Sanber' then 'DEP-LUQ'
    end
where nombre in ('Fábrica', 'Depósito Central', 'Depósito Luque Sanber');
