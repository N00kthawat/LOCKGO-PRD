import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LockerOperatingStatus,
  LockerSize,
  ReservationStatus,
} from '@prisma/client';

export class ErrorResponseDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;
}

export class LockerAvailabilityDto {
  @ApiProperty()
  SMALL!: number;

  @ApiProperty()
  MEDIUM!: number;

  @ApiProperty()
  LARGE!: number;
}

export class LockerListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty({ nullable: true })
  distanceMeters!: number | null;

  @ApiProperty({ type: LockerAvailabilityDto })
  availability!: LockerAvailabilityDto;

  @ApiProperty({ nullable: true })
  startingPriceCents!: number | null;

  @ApiProperty({ enum: LockerOperatingStatus })
  operatingStatus!: LockerOperatingStatus;
}

export class OperatingHoursDto {
  @ApiProperty({ nullable: true })
  openTime!: string | null;

  @ApiProperty({ nullable: true })
  closeTime!: string | null;
}

export class AvailableTimeDto {
  @ApiProperty({ nullable: true })
  startAt!: string | null;

  @ApiProperty({ nullable: true })
  endAt!: string | null;

  @ApiProperty({ nullable: true })
  durationHours!: number | null;
}

export class PriceBySizeDto {
  @ApiPropertyOptional()
  SMALL?: number;

  @ApiPropertyOptional()
  MEDIUM?: number;

  @ApiPropertyOptional()
  LARGE?: number;
}

export class LockerDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty({ nullable: true })
  distanceMeters!: number | null;

  @ApiProperty({ type: OperatingHoursDto })
  operatingHours!: OperatingHoursDto;

  @ApiProperty({ enum: LockerOperatingStatus })
  operatingStatus!: LockerOperatingStatus;

  @ApiProperty({ type: LockerAvailabilityDto })
  availability!: LockerAvailabilityDto;

  @ApiProperty({ type: PriceBySizeDto })
  priceBySizeCents!: PriceBySizeDto;

  @ApiProperty({ type: AvailableTimeDto })
  availableTime!: AvailableTimeDto;
}

export class CreateReservationBodyDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  lockerId!: string;

  @ApiProperty({ enum: LockerSize })
  size!: LockerSize;

  @ApiProperty({
    description: 'ISO date-time string interpreted by the backend as the reservation start time.',
    example: '2026-08-18T05:00:00.000Z',
  })
  startAt!: string;

  @ApiProperty()
  durationHours!: number;

  @ApiPropertyOptional()
  idempotencyKey?: string;
}

export class ReservationLockerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;
}

export class ReservationCompartmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: LockerSize })
  size!: LockerSize;
}

export class ReservationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reservationNumber!: string;

  @ApiProperty({ type: ReservationLockerDto })
  locker!: ReservationLockerDto;

  @ApiProperty({ type: ReservationCompartmentDto })
  compartment!: ReservationCompartmentDto;

  @ApiProperty()
  startAt!: string;

  @ApiProperty()
  endAt!: string;

  @ApiProperty()
  durationHours!: number;

  @ApiProperty()
  pricePerHourCents!: number;

  @ApiProperty()
  totalPriceCents!: number;

  @ApiProperty({ enum: ReservationStatus })
  status!: ReservationStatus;
}
