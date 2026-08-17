import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(
      {
        code,
        message,
        ...(details ? { details } : {}),
      },
      status,
    );
  }
}
