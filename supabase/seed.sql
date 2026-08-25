insert into public.roles (nombre)
values ('Administrador'), ('Entrenador')
on conflict (nombre) do nothing;

insert into public.usuarios (cedula, nombre_completo, email, password_hash, rol_id, es_administrador_principal)
select 'ADMIN-001', 'Andrey Administrador', 'andrey@hernandezfitness.local',
  '$2b$10$tCr1okKL6Ru70Y3zgtigtuQVo361io2oJ/tyXSfqIFB05DNVX/lxO', id, true
from public.roles where nombre = 'Administrador'
on conflict (cedula) do nothing;

insert into public.usuarios (cedula, nombre_completo, email, password_hash, rol_id)
select 'ENT-001', 'Oscar Entrenador', 'oscar@hernandezfitness.local',
  '$2b$10$tCr1okKL6Ru70Y3zgtigtuQVo361io2oJ/tyXSfqIFB05DNVX/lxO', id
from public.roles where nombre = 'Entrenador'
on conflict (cedula) do nothing;

with oscar as (
  insert into public.entrenadores (usuario_id, horario_inicio, horario_fin)
  select id, '06:00', '18:00' from public.usuarios where cedula = 'ENT-001'
  on conflict (usuario_id) do update set horario_inicio = excluded.horario_inicio, horario_fin = excluded.horario_fin
  returning id
)
insert into public.horarios_entrenadores (entrenador_id, dia_semana, hora_inicio, hora_fin)
select oscar.id, dia, '06:00', '18:00'
from oscar cross join generate_series(1, 5) as dia
on conflict (entrenador_id, dia_semana)
do update set hora_inicio = excluded.hora_inicio, hora_fin = excluded.hora_fin;
