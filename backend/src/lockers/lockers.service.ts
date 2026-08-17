import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Compartment,
  Locker,
  LockerSize,
  ReservationStatus,
} from '@prisma/client';
import { ApiException } from '../common/exceptions/api-exception';
import {
  calculateReservationEnd,
  hasTimeOverlap,
  isReservationBlockingAvailability,
} from '../reservations/domain/reservation-rules';
import { PrismaService } from '../prisma/prisma.service';
import {
  LockerDetailResponse,
  LockerListItemResponse,
  SearchLockersQuery,
} from './lockers.types';

type LockerWithCompartments = Locker & {
  compartments: Array<
    Compartment & {
      reservations: Array<{
        endAt: Date;
        startAt: Date;
        status: ReservationStatus;
      }>;
    }
  >;
};

const LOCKER_SIZE_ORDER: LockerSize[] = [
  LockerSize.SMALL,
  LockerSize.MEDIUM,
  LockerSize.LARGE,
];

@Injectable()
export class LockersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchLockersQuery): Promise<LockerListItemResponse[]> {
    const lockers = await this.prisma.locker.findMany({
      where: {
        ...(query.location
          ? {
              OR: [
                {
                  name: {
                    contains: query.location,
                    mode: 'insensitive',
                  },
                },
                {
                  address: {
                    contains: query.location,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
        compartments: {
          some: {
            ...(query.size ? { size: query.size } : {}),
            ...(query.minPriceCents !== undefined ||
            query.maxPriceCents !== undefined
              ? {
                  pricePerHourCents: {
                    ...(query.minPriceCents !== undefined
                      ? { gte: query.minPriceCents }
                      : {}),
                    ...(query.maxPriceCents !== undefined
                      ? { lte: query.maxPriceCents }
                      : {}),
                  },
                }
              : {}),
            isActive: true,
          },
        },
      },
      include: {
        compartments: {
          where: {
            isActive: true,
            ...(query.size ? { size: query.size } : {}),
            ...(query.minPriceCents !== undefined ||
            query.maxPriceCents !== undefined
              ? {
                  pricePerHourCents: {
                    ...(query.minPriceCents !== undefined
                      ? { gte: query.minPriceCents }
                      : {}),
                    ...(query.maxPriceCents !== undefined
                      ? { lte: query.maxPriceCents }
                      : {}),
                  },
                }
              : {}),
          },
          include: {
            reservations: {
              where: {
                status: {
                  in: [ReservationStatus.RESERVED, ReservationStatus.ACTIVE],
                },
              },
              select: {
                startAt: true,
                endAt: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const responses = lockers
      .map((locker) => this.toLockerListItem(locker, query))
      .filter((locker) => this.matchesAvailabilityFilter(locker, query));

    return this.sortLockers(responses, query.sort);
  }

  async getById(
    lockerId: string,
    query: SearchLockersQuery,
  ): Promise<LockerDetailResponse> {
    const locker = await this.prisma.locker.findUnique({
      where: { id: lockerId },
      include: {
        compartments: {
          where: {
            isActive: true,
          },
          include: {
            reservations: {
              where: {
                status: {
                  in: [ReservationStatus.RESERVED, ReservationStatus.ACTIVE],
                },
              },
              select: {
                startAt: true,
                endAt: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!locker) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'LOCKER_NOT_FOUND',
        'Locker not found',
      );
    }

    const listItem = this.toLockerListItem(locker, query);
    const priceBySizeCents = locker.compartments.reduce<
      Partial<Record<LockerSize, number>>
    >((accumulator, compartment) => {
      const existing = accumulator[compartment.size];

      if (existing === undefined || compartment.pricePerHourCents < existing) {
        accumulator[compartment.size] = compartment.pricePerHourCents;
      }

      return accumulator;
    }, {});

    return {
      id: locker.id,
      name: locker.name,
      address: locker.address,
      distanceMeters: listItem.distanceMeters,
      operatingHours: {
        openTime: locker.openTime ?? null,
        closeTime: locker.closeTime ?? null,
      },
      operatingStatus: locker.operatingStatus,
      availability: listItem.availability,
      priceBySizeCents,
      availableTime: {
        startAt: query.startAt?.toISOString() ?? null,
        endAt:
          query.startAt && query.durationHours
            ? calculateReservationEnd(
                query.startAt,
                query.durationHours,
              ).toISOString()
            : null,
        durationHours: query.durationHours ?? null,
      },
    };
  }

  private toLockerListItem(
    locker: LockerWithCompartments,
    query: SearchLockersQuery,
  ): LockerListItemResponse {
    const requestedStartAt = query.startAt ?? new Date();
    const requestedEndAt = calculateReservationEnd(
      requestedStartAt,
      query.durationHours ?? 1,
    );
    const now = new Date();

    const availability = LOCKER_SIZE_ORDER.reduce<Record<LockerSize, number>>(
      (accumulator, size) => {
        accumulator[size] = locker.compartments.filter((compartment) => {
          if (compartment.size !== size) {
            return false;
          }

          return compartment.reservations.every((reservation) => {
            if (
              !isReservationBlockingAvailability(
                reservation.status,
                reservation.endAt,
                now,
              )
            ) {
              return true;
            }

            return !hasTimeOverlap(
              requestedStartAt,
              requestedEndAt,
              reservation.startAt,
              reservation.endAt,
            );
          });
        }).length;

        return accumulator;
      },
      {
        SMALL: 0,
        MEDIUM: 0,
        LARGE: 0,
      },
    );

    const prices = locker.compartments.map(
      (compartment) => compartment.pricePerHourCents,
    );
    const startingPriceCents = prices.length > 0 ? Math.min(...prices) : null;

    return {
      id: locker.id,
      name: locker.name,
      location: locker.address,
      distanceMeters: this.calculateDistanceMeters(locker, query),
      availability,
      startingPriceCents,
      operatingStatus: locker.operatingStatus,
    };
  }

  private matchesAvailabilityFilter(
    locker: LockerListItemResponse,
    query: SearchLockersQuery,
  ): boolean {
    if (!query.availability) {
      return this.matchesDistanceFilter(locker.distanceMeters, query);
    }

    const targetSizes = query.size ? [query.size] : LOCKER_SIZE_ORDER;
    const hasAvailability = targetSizes.some(
      (size) => locker.availability[size] > 0,
    );

    return (
      hasAvailability &&
      this.matchesDistanceFilter(locker.distanceMeters, query)
    );
  }

  private matchesDistanceFilter(
    distanceMeters: number | null,
    query: SearchLockersQuery,
  ): boolean {
    if (query.maxDistanceMeters === undefined) {
      return true;
    }

    if (distanceMeters === null) {
      return false;
    }

    return distanceMeters <= query.maxDistanceMeters;
  }

  private sortLockers(
    lockers: LockerListItemResponse[],
    sort: SearchLockersQuery['sort'],
  ): LockerListItemResponse[] {
    const next = [...lockers];

    if (sort === 'lowest_price') {
      next.sort(
        (left, right) =>
          (left.startingPriceCents ?? Number.MAX_SAFE_INTEGER) -
          (right.startingPriceCents ?? Number.MAX_SAFE_INTEGER),
      );
      return next;
    }

    if (sort === 'most_available') {
      next.sort(
        (left, right) =>
          this.totalAvailability(right.availability) -
          this.totalAvailability(left.availability),
      );
      return next;
    }

    if (sort === 'nearest') {
      next.sort(
        (left, right) =>
          (left.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
          (right.distanceMeters ?? Number.MAX_SAFE_INTEGER),
      );
      return next;
    }

    return next;
  }

  private totalAvailability(availability: Record<LockerSize, number>): number {
    return availability.SMALL + availability.MEDIUM + availability.LARGE;
  }

  private calculateDistanceMeters(
    locker: Locker,
    query: SearchLockersQuery,
  ): number | null {
    if (
      locker.latitude === null ||
      locker.longitude === null ||
      query.latitude === undefined ||
      query.longitude === undefined
    ) {
      return null;
    }

    const earthRadiusMeters = 6371000;
    const lockerLatitude = Number(locker.latitude);
    const lockerLongitude = Number(locker.longitude);
    const queryLatitude = this.toRadians(query.latitude);
    const queryLongitude = this.toRadians(query.longitude);
    const targetLatitude = this.toRadians(lockerLatitude);
    const targetLongitude = this.toRadians(lockerLongitude);
    const deltaLatitude = targetLatitude - queryLatitude;
    const deltaLongitude = targetLongitude - queryLongitude;

    const haversine =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(queryLatitude) *
        Math.cos(targetLatitude) *
        Math.sin(deltaLongitude / 2) ** 2;

    const centralAngle =
      2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return Math.round(earthRadiusMeters * centralAngle);
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
