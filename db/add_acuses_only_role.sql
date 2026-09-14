-- ALAS - rol interno para usuarios que solo usan Gestión de Acuses.
-- Correr en el SQL Editor del proyecto Supabase de Incidencias/usuarios.

insert into roles (code, label)
values ('ACUSES', 'Acuses')
on conflict (code) do update set label = excluded.label;

delete from role_permissions
where role_code = 'ACUSES';
