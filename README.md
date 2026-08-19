# Vehicle Rental Management Backend

A REST API for a vehicle rental company. Staff authenticate with JWT, manage the
vehicle fleet (including photo uploads and soft-delete), and record customer
bookings as rentals. The system enforces that a vehicle can never be double-booked
for overlapping dates, calculates each rental's total from an inclusive day count,
and produces a per-vehicle monthly revenue report that correctly attributes partial
months (a rental spanning a month boundary is split across the two months). Built
with Node.js + TypeScript, Express, Knex, and PostgreSQL.

## Prerequisites

- **Node.js** >= 20 (developed against Node 25)
- **PostgreSQL** >= 14 (the seed script uses Postgres-specific SQL such as
  `TRUNCATE ... RESTART IDENTITY` and `pg_get_serial_sequence`, so MySQL is not
  supported for seeding)
- `npm` (bundled with Node)

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/jayedalnahian/Vehicle-Rental-Management-Backend.git
cd Vehicle-Rental-Management-Backend

# 2. Install dependencies
npm install

# 3. Create your environment file and fill in the values
cp .env.example .env
#   - Set DATABASE_URL to your PostgreSQL connection string, e.g.
#     postgresql://user:password@localhost:5432/vehicle_rental
#   - Set JWT_SECRET to a long random string (this example value is fine for local dev)

# 4. Create the database schema
npm run migrate

# 5. Load seed data (staff account, vehicles, rentals)
npm run seed

# 6. Start the development server (port defaults to 3000)
npm run dev
```

The API is now running at `http://localhost:3000`. Other useful scripts:

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run build`         | Compile TypeScript to `dist/`        |
| `npm start`             | Run the compiled build               |
| `npm run lint`          | Lint with ESLint                     |
| `npm run format`        | Format with Prettier                 |
| `npm run migrate:rollback` | Roll back the latest migration    |

## Environment Variables

All variables are listed in `.env.example`:

| Variable             | Description                                    |
| -------------------- | ---------------------------------------------- |
| `PORT`               | HTTP port the server listens on                |
| `DATABASE_URL`       | PostgreSQL connection string                   |
| `DB_POOL_MIN`        | Minimum connection-pool size                   |
| `DB_POOL_MAX`        | Maximum connection-pool size                   |
| `JWT_SECRET`         | Secret used to sign JWTs                       |
| `JWT_EXPIRES_IN`     | JWT lifetime, e.g. `1d`                        |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost for password hashing               |
| `UPLOAD_PATH`        | Directory where vehicle photos are stored      |

## Seed Data

Running `npm run seed` resets and loads:

- **Staff account** for testing login:
  - Email: `admin@rental.com`
  - Password: `password123`
- **7 vehicles** across categories (Sedan, SUV, Luxury, Van, Hatchback, Hybrid),
  one of which (`Toyota Prius`) is **soft-deleted** to verify soft-delete behavior.
- **13 rentals**, including:
  - Rental #1 for the Toyota Corolla spanning **Jul 29 – Aug 3** — this is the
    month-boundary case used to verify the monthly report (it contributes 3 days to
    July and 3 days to August).
  - Two **cancelled** rentals (#4, #12) to confirm cancelled bookings are excluded
    from overlap checks and reports.

## API Overview

All endpoints except `POST /auth/login` require a JWT:

```
Authorization: Bearer <token>
```

| Method | Endpoint                         | Description                              |
| ------ | -------------------------------- | ---------------------------------------- |
| POST   | `/auth/login`                    | Login, returns a JWT                     |
| GET    | `/vehicles`                      | List vehicles (`page`, `limit`, `category`, `search`) |
| GET    | `/vehicles/:id`                  | Get one vehicle                          |
| POST   | `/vehicles`                      | Create a vehicle (multipart, optional `photo`) |
| PUT    | `/vehicles/:id`                  | Update a vehicle (multipart, optional photo) |
| DELETE | `/vehicles/:id`                  | Soft-delete a vehicle                    |
| GET    | `/rentals`                       | List rentals (`vehicle_id`, `status`, `start_date`, `end_date`, `search`, `page`, `limit`) |
| GET    | `/rentals/:id`                   | Get one rental                           |
| POST   | `/rentals`                       | Create a rental (409 if dates overlap)   |
| PUT    | `/rentals/:id`                   | Update a rental (re-checks overlap)      |
| DELETE | `/rentals/:id`                   | Cancel a rental (sets status to `cancelled`) |
| GET    | `/reports/rentals?month=YYYY-MM` | Monthly revenue report (optional `vehicle_id`) |

### Example Requests

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@rental.com","password":"password123"}'
```

Create a vehicle (multipart; the photo is optional):

```bash
curl -X POST http://localhost:3000/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -F 'name=Toyota Corolla' \
  -F 'plate_number=DHA-9999' \
  -F 'category=Sedan' \
  -F 'daily_rate=1000'
```

Create a rental (Honda Civic, 3 days -> total 150):

```bash
curl -X POST http://localhost:3000/rentals \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"vehicle_id":3,"customer_name":"Test Customer","customer_phone":"01700000000","start_date":"2026-08-26","end_date":"2026-08-28"}'
```

Overlap check — vehicle 1 (Toyota Corolla) is seeded as booked for Aug 10–12, so
booking it for Aug 11–13 returns **409 Conflict**:

```bash
curl -X POST http://localhost:3000/rentals \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"vehicle_id":1,"customer_name":"Overlap Tester","customer_phone":"01711112222","start_date":"2026-08-11","end_date":"2026-08-13"}'
```

Monthly report for August 2026 — the Toyota Corolla is the top earner with 6 rented
days (3 days from the Jul 29–Aug 3 rental plus 3 days from Aug 10–12) and 6000 in
revenue:

```bash
curl "http://localhost:3000/reports/rentals?month=2026-08" \
  -H "Authorization: Bearer $TOKEN"
```

## How the Core Logic Works

### Overlap detection (double-booking prevention)

Two date ranges `[startA, endA]` and `[startB, endB]` overlap if and only if
`startA <= endB AND endA >= startB`. A rental request is rejected with **409** when
an existing **active** rental (`booked` or `ongoing`) for the same vehicle satisfies
this condition against the requested range. `cancelled` and `completed` rentals are
ignored. On `PUT /rentals/:id` the rental being edited is excluded from the check,
so updating its own dates to a new range that still only overlaps itself succeeds.
The whole check runs inside a transaction that locks the vehicle row, which
serializes concurrent booking attempts for the same vehicle and closes the race
window between "check overlap" and "insert".

### Monthly report clamping

A rental may straddle two months (e.g. the seeded Jul 29 – Aug 3 booking). The report
does not simply count the whole rental in the requested month. Instead each rental's
dates are clamped to the month window:

```
effective_start = MAX(rental.start_date, month_start)
effective_end   = MIN(rental.end_date,   month_end)
days_in_month   = (effective_end - effective_start) + 1
revenue_in_month = daily_rate * days_in_month
```

So for August, the Jul 29 – Aug 3 rental is clamped to Aug 1 – Aug 3 and contributes
exactly **3 days / 3000**, not 6. `total_bookings`, `days_rented`, and `revenue` are
then aggregated per vehicle, and the vehicle with the highest revenue is returned as
`top_vehicle`.

## Error Handling

Every failure passes through a single central error handler and returns the same
shape — `{ message }`, with an optional `errors` array for validation failures:

| Status | Error type                |
| ------ | ------------------------- |
| 400    | Validation / bad request  |
| 401    | Unauthorized (missing/invalid token) |
| 404    | Resource not found        |
| 409    | Conflict (double-booking, duplicate plate) |
| 500    | Unexpected error (generic message, never leaks internals) |