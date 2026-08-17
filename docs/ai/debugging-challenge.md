# Debugging Challenge

This note answers the assessment scenario where a user clicks `Confirm Reservation` twice quickly and the system creates duplicate reservations.

## 1. What could cause the issue

- The frontend sends two requests before the button becomes disabled
- The backend accepts repeated requests as separate create operations
- The reservation flow reads availability first and inserts later without concurrency protection
- The system has no idempotency key for duplicate confirmation from the same user

## 2. How to investigate it

- reproduce the issue from the reservation form by clicking confirm repeatedly
- inspect browser network requests to confirm whether duplicate requests were sent
- compare request headers and body values, especially `x-idempotency-key`
- inspect backend logs and database rows for the same user and time window
- run automated duplicate-confirm and concurrent-booking tests

## 3. Where the fix should be applied

Both sides help, but the backend must be the source of truth.

- Frontend:
  - disable repeat submission while a request is in flight
  - send an idempotency key when possible
- Backend:
  - treat the same `(userId, idempotencyKey)` as the same reservation request
  - re-check availability during reservation creation
  - prevent last-slot race conditions at the database transaction layer

## 4. How this repository prevents it now

- Frontend supports an optional idempotency key field for repeated-submit protection
- Backend accepts idempotency from either request body or `x-idempotency-key`
- Database enforces uniqueness on `(userId, idempotencyKey)`
- Reservation creation runs inside a serializable transaction
- Candidate compartments are locked with `FOR UPDATE SKIP LOCKED`
- Automated tests verify:
  - duplicate confirm does not create duplicate reservations
  - only one request succeeds in a concurrent last-slot race

## 5. Why this approach was chosen

- Frontend-only prevention is not enough because two requests can already be in transit
- Idempotency alone does not solve competing users racing for the last compartment
- Database-backed correctness is more important than UI convenience for this assessment
