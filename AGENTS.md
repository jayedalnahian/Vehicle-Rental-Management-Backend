# AGENTS.md

## Repo state

- **Greenfield**: this repo contains only `PRD.md` (the spec, the source of truth). No code, no git history yet. Do not assume the stack is set up — build per the PRD's "Suggested Build Order" (§16).
- Deliverables include initializing a public git repo, `README.md`, and committed `.env.example` + ESLint/Prettier config (§14).
- Stack (from PRD): Node.js + TypeScript, Express, Knex (raw SQL allowed), PostgreSQL (or MySQL), Joi, Multer (local disk), JWT, ESLint + Prettier.

## Architecture (non-negotiable)

- OOP layering, strictly per module: **Controller → Service (business logic in classes) → Repository (Knex queries)**. Route handlers must stay thin; never put logic in handlers.
- Suggested structure in §3 (`src/config`, `src/db/migrations|seeds`, `src/modules/{auth,vehicles,rentals,reports}`, `src/middleware`, `src/types`, `src/utils`, `app.ts`, `server.ts`).
- No implicit `any`; type every DTO/response/return. Augment Express's `Request` with `user?: { id: number; email: string }` via `declare global` (no `any`).

## Business rules that are easy to get wrong

- **No DB constraint prevents double-booking.** Overlap detection is application code, run on both `create` and `update`:
  - Check only rentals with `status IN ('booked','ongoing')` for the same `vehicle_id`.
  - Overlap condition: `start_date <= :newEnd AND end_date >= :newStart`.
  - On update, exclude the rental's own `id`. Any match → **409 Conflict** (full SQL in §7.1).
- **`total_amount` uses inclusive day count**: `days = (end - start in days) + 1`, then `daily_rate * days`. Same start/end = 1 day.
- **Monthly report clamps each rental to the requested month** (`effective_start = MAX(start, month_start)`, `effective_end = MIN(end, month_end)`). Only days/revenue inside the month count — e.g. a Jul 29–Aug 3 rental contributes 3 days to August, not 6. Must be provably correct and covered by seed data; response includes the month's top-revenue vehicle.
- Vehicles are **soft-deleted** (`deleted_at` set, row kept); list/get exclude them by default.
- Status enum: `booked | ongoing | completed | cancelled`. Cancelled rentals are excluded from overlap checks and reports.

## Seeds / migrations

- Migrations must build cleanly on an empty database (`knex migrate:latest`).
- Seeds must include: a staff user with a known password for login testing, vehicles across categories, **at least one rental spanning a month boundary (e.g. Jul 29–Aug 3)**, and **at least one `cancelled` rental**.

## Env & config

- `.env` (gitignored) sourced at runtime; committed `.env.example` must list: `PORT`, `DATABASE_URL` (or discrete `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`), `DB_POOL_MIN`, `DB_POOL_MAX`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `UPLOAD_PATH`. Single shared Knex instance exported from `config/db.ts`.
- JWT middleware protects everything under `/vehicles`, `/rentals`, `/reports` (login is the only public route).