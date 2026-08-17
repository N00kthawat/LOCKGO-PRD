import { ReservationStatus } from '@prisma/client';

const BLOCKING_RESERVATION_STATUSES = new Set<ReservationStatus>([
  ReservationStatus.RESERVED,
  ReservationStatus.ACTIVE,
]);

function assertPositiveWholeHours(durationHours: number): void {
  if (!Number.isInteger(durationHours) || durationHours <= 0) {
    throw new RangeError('Duration hours must be a positive integer.');
  }
}

function assertNonNegativeAmount(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new RangeError('Amount cents must be a non-negative integer.');
  }
}

export function calculateReservationEnd(
  startAt: Date,
  durationHours: number,
): Date {
  assertPositiveWholeHours(durationHours);

  return new Date(startAt.getTime() + durationHours * 60 * 60 * 1000);
}

export function calculateTotalPriceCents(
  pricePerHourCents: number,
  durationHours: number,
): number {
  assertNonNegativeAmount(pricePerHourCents);
  assertPositiveWholeHours(durationHours);

  return pricePerHourCents * durationHours;
}

export function hasValidReservationWindow(startAt: Date, endAt: Date): boolean {
  return startAt.getTime() < endAt.getTime();
}

export function hasTimeOverlap(
  requestedStart: Date,
  requestedEnd: Date,
  existingStart: Date,
  existingEnd: Date,
): boolean {
  return (
    requestedStart.getTime() < existingEnd.getTime() &&
    requestedEnd.getTime() > existingStart.getTime()
  );
}

export function isReservationBlockingAvailability(
  status: ReservationStatus,
  reservationEndAt: Date,
  now: Date,
): boolean {
  if (!BLOCKING_RESERVATION_STATUSES.has(status)) {
    return false;
  }

  return reservationEndAt.getTime() > now.getTime();
}
