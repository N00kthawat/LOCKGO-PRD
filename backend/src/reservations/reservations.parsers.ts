import { HttpStatus } from '@nestjs/common';
import { LockerSize } from '@prisma/client';
import { ApiException } from '../common/exceptions/api-exception';
import { CreateReservationRequest } from './reservations.types';

type RawReservationBody = {
  durationHours?: number | string;
  idempotencyKey?: string;
  lockerId?: string;
  size?: string;
  startAt?: string;
  userId?: string;
};

function parseDurationHours(value: number | string | undefined): number {
  if (value === undefined) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_RESERVATION',
      'durationHours is required',
    );
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_RESERVATION',
      'durationHours must be a positive integer',
    );
  }

  return parsed;
}

function parseStartAt(value: string | undefined): Date {
  if (!value) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_RESERVATION',
      'startAt is required',
    );
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_RESERVATION',
      'startAt must be a valid ISO date-time',
    );
  }

  return parsed;
}

function parseLockerSize(value: string | undefined): LockerSize {
  if (!value) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_RESERVATION',
      'size is required',
    );
  }

  if ((Object.values(LockerSize) as string[]).includes(value)) {
    return value as LockerSize;
  }

  throw new ApiException(
    HttpStatus.BAD_REQUEST,
    'INVALID_RESERVATION',
    'size must be one of SMALL, MEDIUM, LARGE',
  );
}

export function parseCreateReservationRequest(
  body: RawReservationBody,
  headerIdempotencyKey?: string,
): CreateReservationRequest {
  if (!body.userId?.trim()) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_RESERVATION',
      'userId is required',
    );
  }

  if (!body.lockerId?.trim()) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_RESERVATION',
      'lockerId is required',
    );
  }

  return {
    durationHours: parseDurationHours(body.durationHours),
    idempotencyKey: body.idempotencyKey?.trim() || headerIdempotencyKey?.trim(),
    lockerId: body.lockerId.trim(),
    size: parseLockerSize(body.size),
    startAt: parseStartAt(body.startAt),
    userId: body.userId.trim(),
  };
}
