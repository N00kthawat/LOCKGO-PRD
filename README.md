# LOCKGO Assessment

## Project Overview

LOCKGO is a technical assessment project for the feature `Find & Reserve Locker`.

The current implementation focuses on backend foundation and reservation correctness:
- locker search API
- locker detail API
- reservation creation API
- reservation detail API
- Prisma schema and migration
- reservation business rule tests
- concurrent booking protection

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
- `frontend/`: scaffold only
- `backend/`: active implementation
- `docs/assessment/`: source-of-truth PDFs
- `docs/ai/`: AI workflow evidence

### Architecture Overview

```mermaid
flowchart TD
    UI["Frontend (planned 4 screens)"] --> API["NestJS API"]
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

## AI Tools

AI tools used during this assessment:
- Codex

Related evidence:
- [docs/ai/prompts.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/prompts.md)
- [docs/ai/workflow.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/workflow.md)
- [docs/ai/code-review.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/code-review.md)

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
- Frontend screens are not implemented yet.

## Concurrency Strategy

- Reservation creation runs inside a serializable transaction.
- Candidate compartments are selected with row locking using `FOR UPDATE SKIP LOCKED`.
- Availability is re-checked inside the transaction before insert.
- In a race for the last available compartment, one request succeeds and the competing request receives `409 Conflict`.

## Idempotency Strategy

- Reservation creation accepts an idempotency key.
- The system stores `idempotencyKey` together with `userId`.
- Repeating the same request with the same key returns the existing reservation instead of creating a duplicate row.

## Trade-offs

- The current API uses direct request body values for `userId` instead of a real auth layer to keep the assessment scope small.
- Manual API documentation is simpler for the current scope, but Swagger would be better if time allows.
- The current concurrency protection is focused on reservation correctness, not on generalized queueing or booking throughput optimization.

## Known Limitations

- Frontend user flow is not implemented yet.
- Root-level CI/CD is not implemented yet.
- Swagger / OpenAPI is not implemented yet.
- No production deployment setup is included.
- Reservation history endpoint is not implemented yet.

## Future Improvements

- Implement the 4 required frontend screens.
- Add reservation history API.
- Add Swagger / OpenAPI documentation.
- Add CI for test and build verification.
- Add authentication if time allows after core assessment requirements are complete.
