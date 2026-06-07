-- =============================================================================
-- Functions, triggers & analytics RPCs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Auto-maintain updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  tbl text;
  touched_tables text[] := array[
    'profiles', 'patients', 'doctor_schedules', 'appointments',
    'consultations', 'prescriptions'
  ];
begin
  foreach tbl in array touched_tables loop
    execute format(
      'create trigger set_updated_at_%I before update on public.%I
       for each row execute function public.set_updated_at();',
      tbl, tbl);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Auto-provision a profile row when a new auth user signs up.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Dashboard summary RPC (single round-trip for KPI cards).
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_summary()
returns json
language sql
stable
security invoker as $$
  select json_build_object(
    'total_patients', (
      select count(*) from public.patients
      where doctor_id = auth.uid() and is_active = true
    ),
    'appointments_today', (
      select count(*) from public.appointments
      where doctor_id = auth.uid()
        and scheduled_at::date = current_date
    ),
    'appointments_upcoming', (
      select count(*) from public.appointments
      where doctor_id = auth.uid()
        and scheduled_at >= now()
        and status in ('scheduled', 'confirmed')
    ),
    'consultations_this_month', (
      select count(*) from public.consultations
      where doctor_id = auth.uid()
        and consulted_at >= date_trunc('month', current_date)
    ),
    'active_prescriptions', (
      select count(*) from public.prescriptions
      where doctor_id = auth.uid() and status = 'active'
    ),
    'unread_notifications', (
      select count(*) from public.notifications
      where doctor_id = auth.uid() and is_read = false
    )
  );
$$;

-- -----------------------------------------------------------------------------
-- Appointments-per-day trend (Reports module).
-- -----------------------------------------------------------------------------
create or replace function public.appointments_trend(days integer default 30)
returns table (day date, total bigint)
language sql
stable
security invoker as $$
  select d::date as day,
         count(a.id) as total
  from generate_series(current_date - (days - 1), current_date, interval '1 day') as d
  left join public.appointments a
    on a.doctor_id = auth.uid()
   and a.scheduled_at::date = d::date
  group by d
  order by d;
$$;
