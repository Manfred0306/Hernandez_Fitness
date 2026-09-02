alter table public.sesiones_personalizadas
  add column estado text not null default 'Agendado';

alter table public.sesiones_personalizadas
  add constraint sesiones_estado_valido
  check (estado in ('Agendado', 'Completado', 'Cancelado'));

alter table public.sesiones_personalizadas
  drop constraint sesiones_entrenador_sin_solapes;

alter table public.sesiones_personalizadas
  add constraint sesiones_entrenador_sin_solapes
  exclude using gist (
    entrenador_id with =,
    tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)') with &&
  ) where (estado = 'Agendado');

grant update on public.sesiones_personalizadas to hf_app;

create policy sesiones_backend_update
on public.sesiones_personalizadas
for update
to hf_app
using (true)
with check (true);
