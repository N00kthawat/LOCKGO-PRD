import { ReservationStatus } from '@prisma/client';
import {
  calculateReservationEnd,
  calculateTotalPriceCents,
  hasTimeOverlap,
  hasValidReservationWindow,
  isReservationBlockingAvailability,
} from './reservation-rules';

describe('reservation-rules', () => {
  describe('calculateReservationEnd', () => {
    it('calculates reservation end time correctly', () => {
      const startAt = new Date('2026-08-17T07:00:00.000Z');

      expect(calculateReservationEnd(startAt, 4).toISOString()).toBe(
        '2026-08-17T11:00:00.000Z',
      );
    });

    it('rejects non-positive duration hours', () => {
      const startAt = new Date('2026-08-17T07:00:00.000Z');

      expect(() => calculateReservationEnd(startAt, 0)).toThrow(RangeError);
    });
  });

  describe('calculateTotalPriceCents', () => {
    it('calculates total price correctly', () => {
      expect(calculateTotalPriceCents(4500, 4)).toBe(18000);
    });

    it('rejects negative prices', () => {
      expect(() => calculateTotalPriceCents(-1, 2)).toThrow(RangeError);
    });
  });

  describe('hasTimeOverlap', () => {
    it('detects overlapping reservations', () => {
      expect(
        hasTimeOverlap(
          new Date('2026-08-17T09:00:00.000Z'),
          new Date('2026-08-17T12:00:00.000Z'),
          new Date('2026-08-17T11:00:00.000Z'),
          new Date('2026-08-17T13:00:00.000Z'),
        ),
      ).toBe(true);
    });

    it('treats adjacent reservations as non-overlapping', () => {
      expect(
        hasTimeOverlap(
          new Date('2026-08-17T09:00:00.000Z'),
          new Date('2026-08-17T11:00:00.000Z'),
          new Date('2026-08-17T11:00:00.000Z'),
          new Date('2026-08-17T13:00:00.000Z'),
        ),
      ).toBe(false);
    });
  });

  describe('isReservationBlockingAvailability', () => {
    const now = new Date('2026-08-17T10:00:00.000Z');

    it('treats reserved reservations with future end times as blocking', () => {
      expect(
        isReservationBlockingAvailability(
          ReservationStatus.RESERVED,
          new Date('2026-08-17T11:00:00.000Z'),
          now,
        ),
      ).toBe(true);
    });

    it('expired reservation does not block availability', () => {
      expect(
        isReservationBlockingAvailability(
          ReservationStatus.EXPIRED,
          new Date('2026-08-17T11:00:00.000Z'),
          now,
        ),
      ).toBe(false);
    });

    it('completed reservation does not block availability', () => {
      expect(
        isReservationBlockingAvailability(
          ReservationStatus.COMPLETED,
          new Date('2026-08-17T11:00:00.000Z'),
          now,
        ),
      ).toBe(false);
    });

    it('past end time no longer blocks availability', () => {
      expect(
        isReservationBlockingAvailability(
          ReservationStatus.ACTIVE,
          new Date('2026-08-17T09:59:59.000Z'),
          now,
        ),
      ).toBe(false);
    });
  });

  describe('hasValidReservationWindow', () => {
    it('returns false when start time is not before end time', () => {
      expect(
        hasValidReservationWindow(
          new Date('2026-08-17T10:00:00.000Z'),
          new Date('2026-08-17T10:00:00.000Z'),
        ),
      ).toBe(false);
    });
  });
});
