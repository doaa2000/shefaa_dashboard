-- =============================================================================
-- Row Level Security — every doctor may only access their own rows.
-- =============================================================================

alter table public.profiles           enable row level security;
alter table public.patients            enable row level security;
alter table public.doctor_schedules    enable row level security;
alter table public.appointments        enable row level security;
alter table public.consultations       enable row level security;
alter table public.prescriptions       enable row level security;
alter table public.prescription_items  enable row level security;
alter table public.notifications       enable row level security;

-- -----------------------------------------------------------------------------
-- profiles  (id IS the doctor's auth.uid)
-- -----------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Generic owner-scoped tables (doctor_id = auth.uid()).
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  owned_tables text[] := array[
    'patients', 'doctor_schedules', 'appointments',
    'consultations', 'prescriptions', 'notifications'
  ];
begin
  foreach tbl in array owned_tables loop
    execute format(
      'create policy %I on public.%I for select using (doctor_id = auth.uid());',
      tbl || '_select_own', tbl);
    execute format(
      'create policy %I on public.%I for insert with check (doctor_id = auth.uid());',
      tbl || '_insert_own', tbl);
    execute format(
      'create policy %I on public.%I for update using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());',
      tbl || '_update_own', tbl);
    execute format(
      'create policy %I on public.%I for delete using (doctor_id = auth.uid());',
      tbl || '_delete_own', tbl);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- prescription_items  (scoped via parent prescription ownership)
-- -----------------------------------------------------------------------------
create policy "prescription_items_select_own" on public.prescription_items
  for select using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_id and p.doctor_id = auth.uid()
    )
  );
create policy "prescription_items_insert_own" on public.prescription_items
  for insert with check (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_id and p.doctor_id = auth.uid()
    )
  );
create policy "prescription_items_update_own" on public.prescription_items
  for update using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_id and p.doctor_id = auth.uid()
    )
  );
create policy "prescription_items_delete_own" on public.prescription_items
  for delete using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_id and p.doctor_id = auth.uid()
    )
  );
