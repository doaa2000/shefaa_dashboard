-- =============================================================================
-- Shefaa Doctor Dashboard — Initial schema
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type appointment_status as enum
  ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type appointment_type    as enum ('in_person', 'video', 'phone');
create type gender_type         as enum ('male', 'female', 'other', 'unspecified');
create type consultation_status as enum ('draft', 'finalized');
create type prescription_status as enum ('active', 'completed', 'cancelled');
create type notification_type   as enum ('appointment', 'system', 'message', 'reminder');
create type weekday_type        as enum ('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');

-- -----------------------------------------------------------------------------
-- profiles  (1:1 with auth.users — the doctor)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null,
  full_name      text not null default '',
  phone          text,
  avatar_url     text,
  specialty      text,
  bio            text,
  license_number text,
  clinic_name    text,
  timezone       text not null default 'UTC',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- patients
-- -----------------------------------------------------------------------------
create table public.patients (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references public.profiles (id) on delete cascade,
  full_name       text not null,
  email           text,
  phone           text,
  date_of_birth   date,
  gender          gender_type not null default 'unspecified',
  blood_type      text,
  address         text,
  medical_history text,
  allergies       text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index patients_doctor_idx on public.patients (doctor_id);
create index patients_name_idx   on public.patients (doctor_id, full_name);

-- -----------------------------------------------------------------------------
-- doctor_schedules  (recurring weekly availability)
-- -----------------------------------------------------------------------------
create table public.doctor_schedules (
  id                    uuid primary key default gen_random_uuid(),
  doctor_id             uuid not null references public.profiles (id) on delete cascade,
  weekday               weekday_type not null,
  start_time            time not null,
  end_time              time not null,
  slot_duration_minutes integer not null default 30 check (slot_duration_minutes > 0),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint schedule_time_order check (end_time > start_time),
  unique (doctor_id, weekday, start_time)
);
create index doctor_schedules_doctor_idx on public.doctor_schedules (doctor_id);

-- -----------------------------------------------------------------------------
-- appointments
-- -----------------------------------------------------------------------------
create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  doctor_id        uuid not null references public.profiles (id) on delete cascade,
  patient_id       uuid not null references public.patients (id) on delete cascade,
  scheduled_at     timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  type             appointment_type not null default 'in_person',
  status           appointment_status not null default 'scheduled',
  reason           text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index appointments_doctor_time_idx on public.appointments (doctor_id, scheduled_at);
create index appointments_patient_idx     on public.appointments (patient_id);
create index appointments_status_idx      on public.appointments (doctor_id, status);

-- -----------------------------------------------------------------------------
-- consultations
-- -----------------------------------------------------------------------------
create table public.consultations (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references public.profiles (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,
  appointment_id  uuid references public.appointments (id) on delete set null,
  chief_complaint text,
  diagnosis       text,
  symptoms        text[] not null default '{}',
  clinical_notes  text,
  vitals          jsonb not null default '{}'::jsonb,
  status          consultation_status not null default 'draft',
  consulted_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index consultations_doctor_idx  on public.consultations (doctor_id, consulted_at desc);
create index consultations_patient_idx on public.consultations (patient_id);

-- -----------------------------------------------------------------------------
-- prescriptions (+ items)
-- -----------------------------------------------------------------------------
create table public.prescriptions (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references public.profiles (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,
  consultation_id uuid references public.consultations (id) on delete set null,
  status          prescription_status not null default 'active',
  notes           text,
  issued_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index prescriptions_doctor_idx  on public.prescriptions (doctor_id, issued_at desc);
create index prescriptions_patient_idx on public.prescriptions (patient_id);

create table public.prescription_items (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  medication_name text not null,
  dosage          text,
  frequency       text,
  duration        text,
  instructions    text,
  created_at      timestamptz not null default now()
);
create index prescription_items_parent_idx on public.prescription_items (prescription_id);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references public.profiles (id) on delete cascade,
  type        notification_type not null default 'system',
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz not null default now()
);
create index notifications_doctor_idx on public.notifications (doctor_id, is_read, created_at desc);
