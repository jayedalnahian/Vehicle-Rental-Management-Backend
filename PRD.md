# PRD: Vehicle Rental Management Backend

## 1. Objective

Build a REST API for a vehicle rental company. Staff authenticate and manage the vehicle
fleet; customer bookings are recorded as rentals. A vehicle must never be double-booked
for overlapping dates. The system must also provide a monthly report of rental activity
per vehicle.

---

## 2. Tech Stack

| Concern              | Choice                                             |
|-----------------------|-----------------------------------------------------|
| Language              | Node.js + TypeScript                                |
| Architecture           | OOP — service/class layer, not logic in route handlers |
| Web framework          | Express                                              |
| Query builder          | Knex (raw SQL allowed/expected where needed)         |
| Database              | PostgreSQL (preferred) or MySQL                      |
| Validation             | Joi or express-validator                             |
| Linting/Formatting     | ESLint + Prettier                                    |
| File upload            | Multer (local disk storage)                          |
| Auth                   | JWT                                                  |
| Config                 | `.env` (gitignored) + committed `.env.example`       |

### Required `.env` variables
```
PORT=
DATABASE_URL=            # or discrete DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
DB_POOL_MIN=
DB_POOL_MAX=
JWT_SECRET=
JWT_EXPIRES_IN=
UPLOAD_PATH=
```

---

## 3. Project Structure (suggested)

```
src/
  config/         # env loading, knex instance, multer config
  db/
    migrations/
    seeds/
  modules/
    auth/         # controller, service
    vehicles/     # controller, service, repository, types
    rentals/      # controller, service, repository, types
    reports/      # controller, service
  middleware/     # auth (JWT), error handler, validation, rate-limit
  types/          # express request augmentation, shared DTOs
  utils/
  app.ts
  server.ts
```

Each domain module should follow: **Controller (HTTP layer) → Service (business logic,
OOP classes) → Repository (Knex queries)**. Route handlers should stay thin — parse
request, call service, return response.

---

## 4. Database Schema

### `staff`
| Column         | Type              | Notes                  |
|-----------------|-------------------|-------------------------|
| id              | PK, auto-increment |                        |
| email           | string, unique, required |                 |
| password_hash   | string, required  |                        |
| name            | string, required  |                        |
| created_at      | timestamp         |                        |
| updated_at      | timestamp         |                        |

### `vehicles`
| Column         | Type              | Notes                  |
|-----------------|-------------------|-------------------------|
| id              | PK, auto-increment |                        |
| name            | string, required  |                        |
| plate_number    | string, unique, required |                 |
| category        | string, required  |                        |
| daily_rate      | decimal, required |                        |
| photo_path      | string, nullable  |                        |
| deleted_at      | timestamp, nullable | soft delete marker  |
| created_at      | timestamp         |                        |
| updated_at      | timestamp         |                        |

### `rentals`
| Column         | Type              | Notes                  |
|-----------------|-------------------|-------------------------|
| id              | PK, auto-increment |                        |
| vehicle_id      | FK → vehicles.id, required |                |
| customer_name   | string, required  |                        |
| customer_phone  | string, required  |                        |
| start_date      | date, required    |                        |
| end_date        | date, required    |                        |
| total_amount    | decimal, required | server-calculated       |
| status          | enum: booked / ongoing / completed / cancelled, default `booked` |  |
| created_at      | timestamp         |                        |
| updated_at      | timestamp         |                        |

**Important:** There is no column-level/database constraint preventing double-booking.
Two rentals conflict only if their date ranges actually overlap **and both are in an
active status** (`booked` or `ongoing`). This check happens in application code, on
both `create` and `update`.

---

## 5. Authentication

- `POST /auth/login` — accepts `email` + `password`, verifies against `staff` table
  (bcrypt-hashed password), returns a signed JWT.
- JWT middleware protects every route under `/vehicles`, `/rentals`, and `/reports`.
- Extend Express's `Request` type to include the decoded JWT payload (e.g.
  `req.user = { id, email }`), fully typed — no `any`.

---

## 6. Endpoints

### Auth
- `POST /auth/login`
  - Body: `{ email: string, password: string }`
  - Response: `{ token: string, staff: { id, name, email } }`

### Vehicles
- `GET /vehicles`
  - Query params: `page`, `limit`, `category`, `search` (by name)
  - Excludes soft-deleted vehicles by default
- `GET /vehicles/:id`
- `POST /vehicles`
  - `multipart/form-data`: `name`, `plate_number`, `category`, `daily_rate`, `photo` (file)
- `PUT /vehicles/:id`
  - `multipart/form-data`, photo replacement optional
- `DELETE /vehicles/:id`
  - Soft delete — sets `deleted_at`, does not remove the row

### Rentals
- `GET /rentals`
  - Query params: `vehicle_id`, `status`, `start_date`, `end_date` (date range filter)
  - Bonus: pagination + search
- `GET /rentals/:id`
- `POST /rentals`
  - Body: `{ vehicle_id, customer_name, customer_phone, start_date, end_date }`
  - Server calculates `total_amount = daily_rate × number_of_days`
    (same start/end date = 1 day, i.e. inclusive day count)
  - Returns **409 Conflict** if the vehicle has an active (`booked`/`ongoing`) rental
    whose date range overlaps the requested range
- `PUT /rentals/:id`
  - Date changes re-trigger the overlap check (excluding the rental being updated)
- `DELETE /rentals/:id`

### Reports
- `GET /reports/rentals?month=YYYY-MM&vehicle_id=(optional)`
  - Per vehicle: `id`, `name`, `total_bookings`, `days_rented`, `revenue`
  - Only counts days/revenue that fall **inside the requested month** — a rental
    running Jul 29–Aug 3 contributes 3 days/revenue to the August report, not 6
  - Also returns the vehicle with the highest revenue for that month

---

## 7. Core Business Logic to Implement Carefully

### 7.1 Overlap Detection
Two date ranges `[startA, endA]` and `[startB, endB]` overlap when:
```
startA <= endB AND endA >= startB
```
Apply this only against rentals where `status IN ('booked', 'ongoing')` for the same
`vehicle_id`. On update, exclude the current rental's own id from the check.

```sql
SELECT * FROM rentals
WHERE vehicle_id = :vehicleId
  AND status IN ('booked', 'ongoing')
  AND id != :excludeId              -- omit on create
  AND start_date <= :newEndDate
  AND end_date   >= :newStartDate
```
If this query returns any row → respond `409 Conflict`.

### 7.2 Total Amount Calculation
```
days = (end_date - start_date in days) + 1   // inclusive
total_amount = daily_rate * days
```

### 7.3 Monthly Report Calculation
For a given `month` (`YYYY-MM`), compute `month_start` and `month_end` (last day of
month). For every rental overlapping that month:
```
effective_start = MAX(rental.start_date, month_start)
effective_end   = MIN(rental.end_date, month_end)
days_in_month   = (effective_end - effective_start in days) + 1
revenue_in_month = daily_rate * days_in_month
```
Aggregate per `vehicle_id`:
- `total_bookings` = count of rentals overlapping the month
- `days_rented` = sum of `days_in_month`
- `revenue` = sum of `revenue_in_month`

Then identify the vehicle with max `revenue` as `top_vehicle` in the response.

This logic should be implemented as SQL (using `GREATEST`/`LEAST` in Postgres, or
`CASE` expressions) or in the service layer after fetching overlapping rentals —
either is acceptable, but must be provably correct and covered by a seed example.

---

## 8. Transactions & Concurrency (Bonus)

Wrap the overlap check + insert (or update) in a single Knex transaction so that two
concurrent booking requests for the same vehicle/date range cannot both succeed. Use
`trx` for both the `SELECT ... FOR UPDATE` (row lock on relevant rentals) and the
subsequent `INSERT`/`UPDATE`.

---

## 9. Validation Rules (via Joi / express-validator)

- `staff.email`: valid email format
- `vehicles.daily_rate`: positive number
- `vehicles.plate_number`: required, unique (DB-level unique constraint + friendly
  error on conflict)
- `rentals.start_date` / `end_date`: valid dates, `end_date >= start_date`
- `rentals.status`: must be one of the four enum values
- File uploads: restrict to image mime types, reasonable size limit

---

## 10. TypeScript Requirements

- Type every request body (DTOs), response shape, and service/handler return value
- No implicit `any`
- Augment Express's `Request` interface (in a `.d.ts` or types file) to include the
  decoded JWT payload, e.g.:
  ```ts
  interface AuthPayload { id: number; email: string; }
  declare global {
    namespace Express {
      interface Request {
        user?: AuthPayload;
      }
    }
  }
  ```

---

## 11. Database Connection

- Use `pg` (or `mysql2`) as the Knex client
- Connection pool size (`min`/`max`) and credentials sourced from `.env`
- Single shared Knex instance exported from `config/db.ts`

---

## 12. Migrations & Seeds

- Migrations must build the schema cleanly on an empty database (`knex migrate:latest`)
- Seeds must include:
  - At least one staff user (with a known password for testing login)
  - Several vehicles across different categories
  - Several rentals, **including at least one rental that spans a month boundary**
    (e.g. Jul 29 – Aug 3) so the monthly report can be verified against a known
    expected result
  - At least one rental with `status = cancelled` to confirm it's excluded from the
    overlap check and reports as appropriate

---

## 13. Rate Limiting (Bonus)

Apply basic rate limiting (e.g. `express-rate-limit`) to `POST /auth/login` to mitigate
brute-force attempts.

---

## 14. Deliverables

- [ ] Public Git repository
- [ ] `README.md` — setup instructions, env variables, how to run migrations/seeds,
      how to start the server, example curl requests for key endpoints
- [ ] `.env.example` — all required variables with placeholder values
- [ ] Migration files — schema builds cleanly on an empty database
- [ ] Seed files as described in §12
- [ ] ESLint + Prettier config committed

---

## 15. Review Readiness Checklist

Be ready to walk through and explain, in detail:
1. The overlap-detection query — why the `<=` / `>=` condition correctly identifies
   all overlapping ranges and no false positives/negatives.
2. The monthly report query — why clamping each rental's dates to the month boundary
   with `MAX`/`MIN` produces the correct partial-day attribution (e.g. Jul 29–Aug 3
   contributing exactly 3 days to August).
3. How the transaction-wrapped booking flow prevents a race condition between two
   simultaneous booking requests.

---

## 16. Suggested Build Order

1. Project scaffold (TS config, ESLint/Prettier, folder structure, `.env.example`)
2. Knex setup + migrations (staff, vehicles, rentals)
3. Seed data (incl. month-boundary-spanning rental)
4. Auth module (login, JWT middleware, password hashing)
5. Vehicles module (CRUD + soft delete + Multer upload + pagination/filter/search)
6. Rentals module (CRUD + overlap check + total_amount calc)
7. Reports module (monthly aggregation query)
8. Bonus: transaction-wrapped booking, rentals pagination/search, login rate limiting
9. README + final pass on validation/error handling