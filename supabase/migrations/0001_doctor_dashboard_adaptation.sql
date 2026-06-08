-- =============================================================================
-- Shefaa Doctor Dashboard — adaptation to the existing production schema.
--
-- This migration is ADDITIVE and SAFE: it only adds columns to `Doctors`,
-- creates a helper function, and creates four NEW tables. It never alters or
-- drops your existing data (`profiles`, `bookings`, `payments`, etc.).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Link a doctor record to an auth account (per-doctor login).
-- -----------------------------------------------------------------------------
alter table public."Doctors" add column if not exists user_id uuid unique
  references auth.users (id) on delete set null;
alter table public."Doctors" add column if not exists email text;
alter table public."Doctors" add column if not exists bio text;
alter table public."Doctors" add column if not exists license_number text;
alter table public."Doctors" add column if not exists phone text;
alter table public."Doctors" add column if not exists created_at timestamptz not null default now();
alter table public."Doctors" add column if not exists updated_at timestamptz not null default now();

-- Resolves the Doctors.id for the currently authenticated user.
create or replace function public.current_doctor_id()
returns bigint
language sql
stable
security definer
set search_path = public as $$
  select id from public."Doctors" where user_id = auth.uid() limit 1;
$$;

-- -----------------------------------------------------------------------------
-- 2. New clinical tables (keyed to Doctors.id + profiles.id = the patient).
-- -----------------------------------------------------------------------------
create table if not exists public.consultations (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       bigint not null references public."Doctors" (id) on delete cascade,
  patient_id      uuid not null references public.profiles (id) on delete cascade,
  booking_id      integer references public.bookings (id) on delete set null,
  chief_complaint text,
  diagnosis       text,
  symptoms        text[] not null default '{}',
  clinical_notes  text,
  vitals          jsonb not null default '{}'::jsonb,
  status          text not null default 'draft' check (status in ('draft', 'finalized')),
  consulted_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists consultations_doctor_idx on public.consultations (doctor_id, consulted_at desc);
create index if not exists consultations_patient_idx on public.consultations (patient_id);

create table if not exists public.prescriptions (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       bigint not null references public."Doctors" (id) on delete cascade,
  patient_id      uuid not null references public.profiles (id) on delete cascade,
  consultation_id uuid references public.consultations (id) on delete set null,
  status          text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  notes           text,
  issued_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists prescriptions_doctor_idx on public.prescriptions (doctor_id, issued_at desc);
create index if not exists prescriptions_patient_idx on public.prescriptions (patient_id);

create table if not exists public.prescription_items (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  medication_name text not null,
  dosage          text,
  frequency       text,
  duration        text,
  instructions    text,
  created_at      timestamptz not null default now()
);
create index if not exists prescription_items_parent_idx on public.prescription_items (prescription_id);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   bigint not null references public."Doctors" (id) on delete cascade,
  type        text not null default 'system' check (type in ('appointment', 'system', 'message', 'reminder')),
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  entity_type text,
  entity_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_doctor_idx on public.notifications (doctor_id, is_read, created_at desc);

-- -----------------------------------------------------------------------------
-- 3. updated_at trigger for the new tables.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare tbl text;
begin
  foreach tbl in array array['consultations', 'prescriptions'] loop
    execute format(
      'drop trigger if exists set_updated_at_%I on public.%I;', tbl, tbl);
    execute format(
      'create trigger set_updated_at_%I before update on public.%I
       for each row execute function public.set_updated_at();', tbl, tbl);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Row Level Security for the new tables — a doctor owns only their rows.
-- -----------------------------------------------------------------------------
alter table public.consultations      enable row level security;
alter table public.prescriptions      enable row level security;
alter table public.prescription_items enable row level security;
alter table public.notifications      enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array['consultations', 'prescriptions', 'notifications'] loop
    execute format($f$
      create policy "%1$s_select_own" on public.%1$I
        for select using (doctor_id = public.current_doctor_id());
      create policy "%1$s_insert_own" on public.%1$I
        for insert with check (doctor_id = public.current_doctor_id());
      create policy "%1$s_update_own" on public.%1$I
        for update using (doctor_id = public.current_doctor_id())
        with check (doctor_id = public.current_doctor_id());
      create policy "%1$s_delete_own" on public.%1$I
        for delete using (doctor_id = public.current_doctor_id());
    $f$, tbl);
  end loop;
end $$;

create policy "prescription_items_all_own" on public.prescription_items
  for all
  using (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_id and p.doctor_id = public.current_doctor_id()
  ))
  with check (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_id and p.doctor_id = public.current_doctor_id()
  ));

-- -----------------------------------------------------------------------------
-- 5. Dashboard analytics RPCs (scoped to the current doctor).
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_summary()
returns json
language sql
stable
security invoker as $$
  with me as (select public.current_doctor_id() as did)
  select json_build_object(
    'total_patients', (
      select count(distinct b.patient_id) from public.bookings b, me
      where b.doctor_id = me.did
    ),
    'appointments_today', (
      select count(*) from public.bookings b, me
      where b.doctor_id = me.did and b.booked_date = current_date
    ),
    'appointments_upcoming', (
      select count(*) from public.bookings b, me
      where b.doctor_id = me.did and b.booked_date >= current_date
    ),
    'consultations_this_month', (
      select count(*) from public.consultations c, me
      where c.doctor_id = me.did and c.consulted_at >= date_trunc('month', current_date)
    ),
    'active_prescriptions', (
      select count(*) from public.prescriptions p, me
      where p.doctor_id = me.did and p.status = 'active'
    ),
    'unread_notifications', (
      select count(*) from public.notifications n, me
      where n.doctor_id = me.did and n.is_read = false
    ),
    'revenue_this_month', (
      select coalesce(sum(pay.amount), 0) from public.payments pay
      join public.bookings b on b.payment_id = pay.id, me
      where b.doctor_id = me.did
        and pay.created_at >= date_trunc('month', current_date)
    )
  );
$$;

-- Distinct patients (profiles) who have booked with the current doctor.
create or replace function public.doctor_patients(search text default null)
returns setof public.profiles
language sql
stable
security invoker as $$
  select p.*
  from public.profiles p
  where p.id in (
    select distinct b.patient_id
    from public.bookings b
    where b.doctor_id = public.current_doctor_id()
  )
    and (search is null or search = '' or p.name ilike '%' || search || '%')
  order by p.name;
$$;

create or replace function public.bookings_trend(days integer default 30)
returns table (day date, total bigint)
language sql
stable
security invoker as $$
  select d::date as day, count(b.id) as total
  from generate_series(current_date - (days - 1), current_date, interval '1 day') as d
  left join public.bookings b
    on b.doctor_id = public.current_doctor_id() and b.booked_date = d::date
  group by d
  order by d;
$$;
