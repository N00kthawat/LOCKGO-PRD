import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Compartment,
  Locker,
  Prisma,
  PrismaClient,
  Reservation,
  ReservationStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { ApiException } from '../common/exceptions/api-exception';
import {
  calculateReservationEnd,
  calculateTotalPriceCents,
  hasTimeOverlap,
  hasValidReservationWindow,
} from './domain/reservation-rules';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReservationRequest,
  ReservationResponse,
} from './reservations.types';

type ReservationWithRelations = Reservation & {
  compartment: Compartment & {
    locker: Locker;
  };
};

type LockedCompartmentCandidate = {
  id: string;
  code: string;
  lockerId: string;
  pricePerHourCents: number;
};

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    request: CreateReservationRequest,
  ): Promise<{ created: boolean; reservation: ReservationResponse }> {
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'USER_NOT_FOUND',
        'User not found',
      );
    }

    const locker = await this.prisma.locker.findUnique({
      where: { id: request.lockerId },
    });

    if (!locker) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'LOCKER_NOT_FOUND',
        'Locker not found',
      );
    }

    const endAt = calculateReservationEnd(
      request.startAt,
      request.durationHours,
    );

    if (!hasValidReservationWindow(request.startAt, endAt)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'INVALID_RESERVATION',
        'Reservation time window is invalid',
      );
    }

    if (request.idempotencyKey) {
      const existingReservation = await this.prisma.reservation.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: request.userId,
            idempotencyKey: request.idempotencyKey,
          },
        },
        include: {
          compartment: {
            include: {
              locker: true,
            },
          },
        },
      });

      if (existingReservation) {
        return {
          created: false,
          reservation: this.toReservationResponse(existingReservation),
        };
      }
    }

    try {
      const createdReservation = await this.prisma.$transaction(
        async (tx) => {
          const availableCompartment =
            await this.findAndLockAvailableCompartment(
              tx,
              request.lockerId,
              request.size,
              request.startAt,
              endAt,
            );

          if (!availableCompartment) {
            throw new ApiException(
              HttpStatus.CONFLICT,
              'NO_AVAILABLE_COMPARTMENT',
              'No locker compartment is available for the selected time range',
            );
          }

          return tx.reservation.create({
            data: {
              reservationNumber: this.createReservationNumber(),
              userId: user.id,
              compartmentId: availableCompartment.id,
              status: ReservationStatus.RESERVED,
              startAt: request.startAt,
              endAt,
              durationHours: request.durationHours,
              totalPriceCents: calculateTotalPriceCents(
                availableCompartment.pricePerHourCents,
                request.durationHours,
              ),
              idempotencyKey: request.idempotencyKey,
            },
            include: {
              compartment: {
                include: {
                  locker: true,
                },
              },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        created: true,
        reservation: this.toReservationResponse(createdReservation),
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        request.idempotencyKey
      ) {
        const existingReservation = await this.prisma.reservation.findUnique({
          where: {
            userId_idempotencyKey: {
              userId: request.userId,
              idempotencyKey: request.idempotencyKey,
            },
          },
          include: {
            compartment: {
              include: {
                locker: true,
              },
            },
          },
        });

        if (existingReservation) {
          return {
            created: false,
            reservation: this.toReservationResponse(existingReservation),
          };
        }
      }

      throw error;
    }
  }

  async getById(reservationId: string): Promise<ReservationResponse> {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },
      include: {
        compartment: {
          include: {
            locker: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'RESERVATION_NOT_FOUND',
        'Reservation not found',
      );
    }

    return this.toReservationResponse(reservation);
  }

  private toReservationResponse(
    reservation: ReservationWithRelations,
  ): ReservationResponse {
    return {
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      locker: {
        id: reservation.compartment.locker.id,
        name: reservation.compartment.locker.name,
        address: reservation.compartment.locker.address,
      },
      compartment: {
        id: reservation.compartment.id,
        code: reservation.compartment.code,
        size: reservation.compartment.size,
      },
      startAt: reservation.startAt.toISOString(),
      endAt: reservation.endAt.toISOString(),
      durationHours: reservation.durationHours,
      pricePerHourCents:
        reservation.totalPriceCents / reservation.durationHours,
      totalPriceCents: reservation.totalPriceCents,
      status: reservation.status,
    };
  }

  private createReservationNumber(): string {
    const now = new Date();
    const datePortion = `${now.getUTCFullYear()}${String(
      now.getUTCMonth() + 1,
    ).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
    const entropy = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();

    return `LK-${datePortion}-${entropy}`;
  }

  private async findAndLockAvailableCompartment(
    tx: Omit<
      PrismaService | PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >,
    lockerId: string,
    size: CreateReservationRequest['size'],
    startAt: Date,
    endAt: Date,
  ): Promise<LockedCompartmentCandidate | null> {
    const lockedCandidates = await tx.$queryRaw<LockedCompartmentCandidate[]>`
      SELECT
        c.id,
        c.code,
        c."lockerId",
        c."pricePerHourCents"
      FROM "Compartment" c
      WHERE c."lockerId" = ${lockerId}
        AND c."size" = ${size}::"LockerSize"
        AND c."isActive" = true
      ORDER BY c.code ASC
      FOR UPDATE SKIP LOCKED
    `;

    for (const candidate of lockedCandidates) {
      const conflictingReservations = await tx.reservation.findMany({
        where: {
          compartmentId: candidate.id,
          status: {
            in: [ReservationStatus.RESERVED, ReservationStatus.ACTIVE],
          },
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
        },
      });

      const hasConflict = conflictingReservations.some((reservation) =>
        hasTimeOverlap(startAt, endAt, reservation.startAt, reservation.endAt),
      );

      if (!hasConflict) {
        return candidate;
      }
    }

    return null;
  }
}
