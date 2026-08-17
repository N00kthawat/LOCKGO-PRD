import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Compartment,
  Locker,
  Prisma,
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
      const createdReservation = await this.prisma.$transaction(async (tx) => {
        const availableCompartments = await tx.compartment.findMany({
          where: {
            lockerId: request.lockerId,
            size: request.size,
            isActive: true,
          },
          include: {
            locker: true,
            reservations: {
              where: {
                status: {
                  in: [ReservationStatus.RESERVED, ReservationStatus.ACTIVE],
                },
              },
              select: {
                startAt: true,
                endAt: true,
              },
            },
          },
          orderBy: {
            code: 'asc',
          },
        });

        const availableCompartment = availableCompartments.find((compartment) =>
          compartment.reservations.every(
            (reservation) =>
              !hasTimeOverlap(
                request.startAt,
                endAt,
                reservation.startAt,
                reservation.endAt,
              ),
          ),
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
      });

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
}
