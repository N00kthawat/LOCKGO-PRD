import { HttpStatus } from '@nestjs/common';
import { LockerSize } from '@prisma/client';
import { ApiException } from '../common/exceptions/api-exception';
import { LockerSortOption, SearchLockersQuery } from './lockers.types';

const SORT_OPTIONS: LockerSortOption[] = [
  'nearest',
  'lowest_price',
  'most_available',
];

function parseNumber(
  value: string | undefined,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_QUERY',
      `${fieldName} must be a valid number`,
    );
  }

  return parsed;
}

function parseInteger(
  value: string | undefined,
  fieldName: string,
): number | undefined {
  const parsed = parseNumber(value, fieldName);

  if (parsed === undefined) {
    return undefined;
  }

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_QUERY',
      `${fieldName} must be a positive integer`,
    );
  }

  return parsed;
}

function parseBoolean(
  value: string | undefined,
  fieldName: string,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new ApiException(
    HttpStatus.BAD_REQUEST,
    'INVALID_QUERY',
    `${fieldName} must be true or false`,
  );
}

function parseDate(
  value: string | undefined,
  fieldName: string,
): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_QUERY',
      `${fieldName} must be a valid ISO date-time`,
    );
  }

  return parsed;
}

function parseLockerSize(value: string | undefined): LockerSize | undefined {
  if (value === undefined) {
    return undefined;
  }

  if ((Object.values(LockerSize) as string[]).includes(value)) {
    return value as LockerSize;
  }

  throw new ApiException(
    HttpStatus.BAD_REQUEST,
    'INVALID_QUERY',
    'size must be one of SMALL, MEDIUM, LARGE',
  );
}

function parseSort(value: string | undefined): LockerSortOption | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (SORT_OPTIONS.includes(value as LockerSortOption)) {
    return value as LockerSortOption;
  }

  throw new ApiException(
    HttpStatus.BAD_REQUEST,
    'INVALID_QUERY',
    'sort must be one of nearest, lowest_price, most_available',
  );
}

export function parseSearchLockersQuery(
  query: Record<string, string | undefined>,
): SearchLockersQuery {
  const startAt = parseDate(query.startAt, 'startAt');
  const durationHours = parseInteger(query.durationHours, 'durationHours');

  if ((startAt && !durationHours) || (!startAt && durationHours)) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_QUERY',
      'startAt and durationHours must be provided together',
    );
  }

  return {
    availability: parseBoolean(query.availability, 'availability'),
    durationHours,
    latitude: parseNumber(query.latitude, 'latitude'),
    location: query.location?.trim() || undefined,
    longitude: parseNumber(query.longitude, 'longitude'),
    maxDistanceMeters: parseNumber(
      query.maxDistanceMeters,
      'maxDistanceMeters',
    ),
    maxPriceCents: parseInteger(query.maxPriceCents, 'maxPriceCents'),
    minPriceCents: parseInteger(query.minPriceCents, 'minPriceCents'),
    size: parseLockerSize(query.size),
    sort: parseSort(query.sort),
    startAt,
  };
}
