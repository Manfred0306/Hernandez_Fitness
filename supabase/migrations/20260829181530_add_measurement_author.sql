alter table public.mediciones
  add column realizado_por_usuario_id bigint references public.usuarios(id);

update public.mediciones as m
set realizado_por_usuario_id = e.usuario_id
from public.entrenadores as e
where e.id = m.entrenador_id
  and m.realizado_por_usuario_id is null;

alter table public.mediciones
  alter column entrenador_id drop not null;

create index mediciones_realizado_por_usuario_id_idx
  on public.mediciones (realizado_por_usuario_id);

alter table public.mediciones
  add constraint mediciones_campos_completos check (
    estatura is not null
    and peso is not null
    and masa_muscular is not null
    and porcentaje_grasa is not null
    and cintura is not null
    and cadera is not null
    and brazo_izquierdo is not null
    and brazo_derecho is not null
    and pierna_izquierda is not null
    and pierna_derecha is not null
    and pantorrilla_izquierda is not null
    and pantorrilla_derecha is not null
    and pectoral is not null
    and espalda is not null
  ) not valid;
