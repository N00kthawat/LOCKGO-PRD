import { Controller, Get, Param, Query } from '@nestjs/common';
import { parseSearchLockersQuery } from './lockers.parsers';
import { LockersService } from './lockers.service';

@Controller('api/lockers')
export class LockersController {
  constructor(private readonly lockersService: LockersService) {}

  @Get()
  async search(@Query() rawQuery: Record<string, string | undefined>) {
    return this.lockersService.search(parseSearchLockersQuery(rawQuery));
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Query() rawQuery: Record<string, string | undefined>,
  ) {
    return this.lockersService.getById(id, parseSearchLockersQuery(rawQuery));
  }
}
