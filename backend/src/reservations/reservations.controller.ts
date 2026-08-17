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
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CreateReservationBodyDto,
  ErrorResponseDto,
  ReservationDto,
} from '../docs/swagger.schemas';
import { parseCreateReservationRequest } from './reservations.parsers';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservations')
@Controller('api/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a locker reservation' })
  @ApiHeader({
    name: 'x-idempotency-key',
    required: false,
    description: 'Optional idempotency key for duplicate confirm protection.',
  })
  @ApiBody({ type: CreateReservationBodyDto })
  @ApiCreatedResponse({ type: ReservationDto })
  @ApiOkResponse({
    type: ReservationDto,
    description: 'Existing reservation returned for a repeated idempotent request.',
  })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
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
  @ApiOperation({ summary: 'Get reservation detail by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: ReservationDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async getById(@Param('id') id: string) {
    return this.reservationsService.getById(id);
  }
}
