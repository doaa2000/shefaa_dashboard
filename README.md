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

SQL migrations live in `supabase/migrations/`:

1. `0001_init_schema.sql` — tables, enums, indexes, constraints
2. `0002_rls_policies.sql` — Row Level Security (doctor owns their rows)
3. `0003_functions_triggers.sql` — `updated_at` triggers, auto profile
   provisioning, and analytics RPCs (`dashboard_summary`, `appointments_trend`)

Tables: `profiles`, `patients`, `doctor_schedules`, `appointments`,
`consultations`, `prescriptions`, `prescription_items`, `notifications`.

## Modules

Auth · Dashboard · Appointments · Patients · Consultations · Prescriptions ·
Reports · Notifications · Settings.
