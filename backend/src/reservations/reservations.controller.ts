import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { parseCreateReservationRequest } from './reservations.parsers';
import { ReservationsService } from './reservations.service';

@Controller('api/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(
    @Body()
    body: {
      durationHours?: number | string;
      idempotencyKey?: string;
      lockerId?: string;
      size?: string;
      startAt?: string;
      userId?: string;
    },
    @Headers('x-idempotency-key') headerIdempotencyKey: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.reservationsService.create(
      parseCreateReservationRequest(body, headerIdempotencyKey),
    );

    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result.reservation;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id') id: string) {
    return this.reservationsService.getById(id);
  }
}
