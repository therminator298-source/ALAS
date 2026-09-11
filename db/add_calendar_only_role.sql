-- ALAS Calendario - rol interno para usuarios que solo usan Calendario tareas.
-- Correr en el SQL Editor del proyecto Supabase del modulo Calendario/Incidencias.

insert into roles (code, label)
values ('CALENDARIO', 'Calendario tareas')
on conflict (code) do update set label = excluded.label;

delete from role_permissions
where role_code = 'CALENDARIO';
