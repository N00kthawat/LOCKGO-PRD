import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto, LockerDetailDto, LockerListItemDto } from '../docs/swagger.schemas';
import { parseSearchLockersQuery } from './lockers.parsers';
import { LockersService } from './lockers.service';

@ApiTags('Lockers')
@Controller('api/lockers')
export class LockersController {
  constructor(private readonly lockersService: LockersService) {}

  @Get()
  @ApiOperation({ summary: 'Search lockers with optional filters' })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  @ApiQuery({ name: 'maxDistanceMeters', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, enum: ['SMALL', 'MEDIUM', 'LARGE'] })
  @ApiQuery({ name: 'minPriceCents', required: false, type: Number })
  @ApiQuery({ name: 'maxPriceCents', required: false, type: Number })
  @ApiQuery({ name: 'availability', required: false, type: Boolean })
  @ApiQuery({
    name: 'startAt',
    required: false,
    type: String,
    description: 'ISO date-time. Must be provided together with durationHours.',
  })
  @ApiQuery({
    name: 'durationHours',
    required: false,
    type: Number,
    description: 'Positive integer. Must be provided together with startAt.',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['nearest', 'lowest_price', 'most_available'],
  })
  @ApiOkResponse({ type: LockerListItemDto, isArray: true })
  async search(@Query() rawQuery: Record<string, string | undefined>) {
    return this.lockersService.search(parseSearchLockersQuery(rawQuery));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get locker detail by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({
    name: 'startAt',
    required: false,
    type: String,
    description: 'Optional ISO date-time for availability preview.',
  })
  @ApiQuery({
    name: 'durationHours',
    required: false,
    type: Number,
    description: 'Optional positive integer used with startAt.',
  })
  @ApiOkResponse({ type: LockerDetailDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async getById(
    @Param('id') id: string,
    @Query() rawQuery: Record<string, string | undefined>,
  ) {
    return this.lockersService.getById(id, parseSearchLockersQuery(rawQuery));
  }
}
