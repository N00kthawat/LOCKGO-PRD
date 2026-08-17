import { LockerSize, ReservationStatus } from '@prisma/client';

export type CreateReservationRequest = {
  durationHours: number;
  idempotencyKey?: string;
  lockerId: string;
  size: LockerSize;
  startAt: Date;
  userId: string;
};

export type ReservationResponse = {
  id: string;
  reservationNumber: string;
  locker: {
    id: string;
    name: string;
    address: string;
  };
  compartment: {
    id: string;
    code: string;
    size: LockerSize;
  };
  startAt: string;
  endAt: string;
  durationHours: number;
  pricePerHourCents: number;
  totalPriceCents: number;
  status: ReservationStatus;
};
