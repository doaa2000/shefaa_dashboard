# Shefaa — Doctor Dashboard

Production-ready Vue 3 application for managing a medical practice, built with
**Clean Architecture** and a **feature-based** module layout.

## Tech stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Vue 3 (Composition API + `<script setup>`) |
| Language       | TypeScript (strict)                      |
| Build          | Vite                                     |
| State          | Pinia                                    |
| Routing        | Vue Router                               |
| Styling        | Tailwind CSS                             |
| Backend        | Supabase (Postgres + Auth + Realtime)    |
| Validation     | Zod + vee-validate                       |
| Utilities      | VueUse                                    |
| Charts         | Chart.js + vue-chartjs                    |

## Architecture

Four layers, dependencies point **inward** only:

```
Presentation (Vue, Pinia, Router)
   → Application (services / use-cases)
      → Domain (entities, repo interfaces, Zod schemas)
         ← Infrastructure (Supabase repo implementations + mappers)
```

Each feature in `src/features/*` mirrors this internally:
`domain/ · infrastructure/ · application/ · store/ · presentation/ · routes.ts`.

The single composition root (`src/app/providers/container.ts`) wires concrete
Supabase repositories into services (Dependency Inversion). Nothing outside that
file imports a concrete repository.

### Cross-cutting

- **Errors** — every repo/service returns `Result<T, AppError>`; vendor errors
  are normalized at one boundary (`src/core/errors`).
- **Loading** — `useAsyncState` composable + per-store `loading`/`saving` flags.
- **Validation** — Zod schemas are the single source of truth, reused by forms
  (vee-validate) and services.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local   # fill in your Supabase URL + anon key

# 3. Apply the database schema (requires the Supabase CLI + a linked project)
supabase db push
npm run db:types             # regenerate src/core/types/database.types.ts

# 4. Run
npm run dev
```

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Type-check + production build        |
| `npm run type-check`| `vue-tsc` type checking              |
| `npm run lint`      | ESLint (with `--fix`)                |
| `npm run db:push`   | Apply migrations to the linked DB    |
| `npm run db:types`  | Regenerate Supabase TypeScript types |

## Database

This dashboard is adapted to the **existing Shefaa production schema** (a
patient-facing booking app) rather than a greenfield database.

Mapping:
- **Appointments** → `bookings`
- **Patients** (read-only) → `profiles`
- **Doctor profile / Settings** → `Doctors` (a `user_id` column links each
  doctor to an auth account — per-doctor login)
- **Availability** → `doctor_availability`
- **Payments** → `payments` (via the doctor's bookings)

The single migration `supabase/migrations/0001_doctor_dashboard_adaptation.sql`
is **additive and safe** — it never alters existing data. It:
1. adds `user_id` (+ a few profile columns) to `Doctors`,
2. adds a `current_doctor_id()` helper,
3. creates four NEW tables: `consultations`, `prescriptions`,
   `prescription_items`, `notifications` (with RLS scoped to the doctor),
4. adds analytics RPCs: `dashboard_summary`, `bookings_trend`, `doctor_patients`.

Run it once in the Supabase SQL Editor (or `supabase db push`).

## Modules

Auth · Dashboard · Appointments · Patients · Consultations · Prescriptions ·
Reports · Notifications · Settings.
