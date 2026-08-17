# LOCKGO Assessment

## Project Overview

LOCKGO is a technical assessment project for the feature `Find & Reserve Locker`.

The current implementation covers the core assessment flow across backend and frontend:
- locker search API
- locker detail API
- reservation creation API
- reservation detail API
- Prisma schema and migration
- frontend locker search and reservation flow
- reservation business rule tests
- concurrent booking protection

## Delivery Summary

- Frontend: 4-screen flow is implemented in a single React app
- Backend: required locker and reservation APIs are implemented
- Database: Prisma schema, migration, and seed data are included
- Testing: unit and e2e coverage is included for reservation rules and API behavior
- AI evidence: prompts, workflow notes, code review notes, and debugging notes are included in `docs/ai/`

## Architecture

The repository is organized as a single assessment project:

```text
lockgo/
├── frontend/
├── backend/
├── docs/
│   ├── assessment/
│   └── ai/
└── docker-compose.yml
```

Current implementation status:
- `frontend/`: simple 4-screen reservation flow connected to the API
- `backend/`: locker and reservation domain implementation
- `docs/assessment/`: source-of-truth PDFs
- `docs/ai/`: AI workflow evidence

### Architecture Overview

```mermaid
flowchart TD
    UI["Frontend (4 screens)"] --> API["NestJS API"]
    API --> RES["Reservation Service"]
    API --> LOCK["Locker Service"]
    RES --> RULES["Reservation Rules"]
    LOCK --> RULES
    RES --> PRISMA["Prisma Client"]
    LOCK --> PRISMA
    PRISMA --> DB["PostgreSQL 17 (Docker)"]
```

## Technology

- Frontend: React, TypeScript, Vite
- Backend: NestJS, TypeScript
- Database: PostgreSQL 17
- ORM: Prisma 7
- Package manager: pnpm
- Test: Jest, Supertest

## Installation

### Prerequisites

- Node.js 22+
- pnpm
- Docker / Docker Compose

### Install dependencies

```bash
cd frontend
pnpm install

cd ../backend
pnpm install
```

## Configuration

Backend uses `.env` with this development database connection:

```env
DATABASE_URL="postgresql://lockgo:lockgo@127.0.0.1:5433/lockgo"
```

Use [backend/.env.example](/Users/nookthawat/KHOOMKHA/lockgo/backend/.env.example) as the template.

## Database Setup

Start PostgreSQL:

```bash
docker compose up -d
```

Run Prisma migration:

```bash
cd backend
pnpm exec prisma migrate dev
```

Seed local data:

```bash
pnpm db:seed
```

## Run Application

### Backend

```bash
cd backend
pnpm start:dev
```

Default port:
- `3000`

### Frontend

```bash
cd frontend
pnpm dev
```

Default Vite port:
- `5173`

## Demo Usage

Use this sequence for a local end-to-end check:

1. Start Docker PostgreSQL with `docker compose up -d`
2. Run backend with `cd backend && pnpm start:dev`
3. Run frontend with `cd frontend && pnpm dev`
4. Open `http://localhost:5173`
5. On the Find Locker screen:
   - choose a location from the dropdown
   - keep `Start Date = 2026-08-18`
   - keep `Start Time = 12:00`
   - keep `Duration = 2`
   - click `Search`
6. Open any locker from the result list
7. On the Reservation screen:
   - default demo user is `demo-user-001`
   - optional idempotency key example: `booking-demo-001`
   - click `Confirm Reservation`

### Seeded Demo Data

- Demo user ID: `demo-user-001`
- Sample locations:
  - Bangkok
  - Chiang Mai
  - Phuket
  - Chonburi
  - Khon Kaen
  - Songkhla
  - Ayutthaya
  - Nakhon Ratchasima
  - Prachuap Khiri Khan
  - Udon Thani

## Run Test

### Backend unit tests

```bash
cd backend
pnpm test
```

### Backend e2e tests

```bash
cd backend
pnpm test:e2e
```

### Backend build

```bash
cd backend
pnpm build
```

## API Documentation

### `GET /api/lockers`

Search lockers with optional filters:
- `location`
- `latitude`
- `longitude`
- `maxDistanceMeters`
- `size`
- `minPriceCents`
- `maxPriceCents`
- `availability`
- `startAt`
- `durationHours`
- `sort`

### `GET /api/lockers/:id`

Get locker detail and size availability.

### `POST /api/reservations`

Create a reservation.

Request body:

```json
{
  "userId": "string",
  "lockerId": "string",
  "size": "SMALL",
  "startAt": "2026-08-18T12:00:00.000Z",
  "durationHours": 2,
  "idempotencyKey": "optional-string"
}
```

Also supports:
- `x-idempotency-key` header

### `GET /api/reservations/:id`

Get reservation detail for confirmation view.

### Error Contract

```json
{
  "code": "LOCKER_NOT_FOUND",
  "message": "Locker not found"
}
```

## Frontend Screens

- Screen 1: Find Locker
  - location search
  - filters
  - locker list
  - availability
  - price
- Screen 2: Locker Detail
  - locker information
  - location
  - available compartments
  - price
  - select button
- Screen 3: Reservation
  - selected locker
  - compartment size
  - start date and time
  - duration
  - reservation summary
  - confirm button
- Screen 4: Confirmation
  - booking number
  - locker
  - location
  - compartment
  - start time
  - expiration time
  - booking status

## AI Tools

AI tools used during this assessment:
- Codex

Related evidence:
- [docs/ai/prompts.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/prompts.md)
- [docs/ai/workflow.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/workflow.md)
- [docs/ai/code-review.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/code-review.md)
- [docs/ai/debugging-challenge.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/debugging-challenge.md)

## Architecture Decisions

- Keep the assessment in a single repository instead of splitting frontend/backend into separate repos.
- Model reservation correctness around `Compartment`, because booking conflicts happen at compartment level.
- Use Prisma with PostgreSQL and a Docker database for predictable local setup.
- Add database-level concurrency protection in reservation creation using transaction isolation and row locking.

## Business Rules

- A user can reserve only an available compartment in the requested time range.
- The same compartment cannot be reserved with overlapping time windows.
- Expired reservations must not block availability.
- Reservation numbers must be unique.
- Duplicate confirm requests must not create duplicate reservations.
- Concurrent booking for the last available compartment must succeed only once.

## Assumptions

- Authentication is out of scope for the current implementation, so `userId` is provided directly in the request body.
- Reservation duration is handled as a positive integer number of hours.
- API documentation is currently maintained manually in README instead of Swagger.

## Concurrency Strategy

- Reservation creation runs inside a serializable transaction.
- Candidate compartments are selected with row locking using `FOR UPDATE SKIP LOCKED`.
- Availability is re-checked inside the transaction before insert.
- In a race for the last available compartment, one request succeeds and the competing request receives `409 Conflict`.

## Idempotency Strategy

- Reservation creation accepts an idempotency key.
- The system stores `idempotencyKey` together with `userId`.
- Repeating the same request with the same key returns the existing reservation instead of creating a duplicate row.

## Debugging Challenge

Assessment prompt:
- user clicks `Confirm Reservation` twice quickly
- system creates two reservations

Analysis:
- frontend-only button disabling is not enough because two requests can already be in flight
- backend-only read-then-insert without protection can still double-create reservations
- duplicate confirm and concurrent booking are related but different problems

How this project checks the issue:
- inspect frontend request behavior
- inspect whether the same idempotency key was reused
- inspect backend logs and API responses
- verify database rows created for the same user/time window
- run duplicate-confirm and concurrent-booking automated tests

Implemented fix:
- frontend supports optional `idempotencyKey`
- backend accepts `idempotencyKey` from body or `x-idempotency-key`
- backend stores a unique `(userId, idempotencyKey)` pair
- backend re-checks availability inside a serializable transaction
- backend locks candidate compartments with `FOR UPDATE SKIP LOCKED`

Prevention:
- duplicate submit from the same user is handled by idempotency
- last-slot race conditions are handled by database transaction + locking
- automated tests verify both scenarios

## Trade-offs

- The current API uses direct request body values for `userId` instead of a real auth layer to keep the assessment scope small.
- Manual API documentation is simpler for the current scope, but Swagger would be better if time allows.
- The current concurrency protection is focused on reservation correctness, not on generalized queueing or booking throughput optimization.

## Known Limitations

- Root-level CI/CD is not implemented yet.
- Swagger / OpenAPI is not implemented yet.
- No production deployment setup is included.
- Reservation history endpoint is not implemented yet.

## Future Improvements

- Add reservation history API.
- Add Swagger / OpenAPI documentation.
- Add CI for test and build verification.
- Add authentication if time allows after core assessment requirements are complete.
