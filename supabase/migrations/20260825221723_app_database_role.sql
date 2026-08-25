do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'hf_app') then
    create role hf_app nologin nosuperuser nocreatedb nocreaterole noreplication;
  end if;
end $$;

grant connect on database postgres to hf_app;
grant usage on schema public to hf_app;
grant select on public.roles to hf_app;
grant select, insert, update on public.usuarios, public.entrenadores, public.clientes to hf_app;
grant select, insert, update, delete on public.horarios_entrenadores to hf_app;
grant select, insert on public.mediciones, public.sesiones_personalizadas to hf_app;
grant usage, select on all sequences in schema public to hf_app;

create policy roles_backend_select on public.roles for select to hf_app using (true);
create policy usuarios_backend_select on public.usuarios for select to hf_app using (true);
create policy usuarios_backend_insert on public.usuarios for insert to hf_app with check (true);
create policy usuarios_backend_update on public.usuarios for update to hf_app using (true) with check (true);
create policy entrenadores_backend_select on public.entrenadores for select to hf_app using (true);
create policy entrenadores_backend_insert on public.entrenadores for insert to hf_app with check (true);
create policy entrenadores_backend_update on public.entrenadores for update to hf_app using (true) with check (true);
create policy horarios_backend_select on public.horarios_entrenadores for select to hf_app using (true);
create policy horarios_backend_insert on public.horarios_entrenadores for insert to hf_app with check (true);
create policy horarios_backend_update on public.horarios_entrenadores for update to hf_app using (true) with check (true);
create policy horarios_backend_delete on public.horarios_entrenadores for delete to hf_app using (true);
create policy clientes_backend_select on public.clientes for select to hf_app using (true);
create policy clientes_backend_insert on public.clientes for insert to hf_app with check (true);
create policy clientes_backend_update on public.clientes for update to hf_app using (true) with check (true);
create policy mediciones_backend_select on public.mediciones for select to hf_app using (true);
create policy mediciones_backend_insert on public.mediciones for insert to hf_app with check (true);
create policy sesiones_backend_select on public.sesiones_personalizadas for select to hf_app using (true);
create policy sesiones_backend_insert on public.sesiones_personalizadas for insert to hf_app with check (true);
