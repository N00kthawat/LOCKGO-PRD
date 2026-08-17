import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorResponseBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (
        typeof errorResponse === 'object' &&
        errorResponse !== null &&
        'code' in errorResponse &&
        'message' in errorResponse
      ) {
        response.status(status).json(errorResponse);
        return;
      }

      const body = this.createErrorBody(
        this.mapHttpStatusToCode(status),
        typeof errorResponse === 'string'
          ? errorResponse
          : exception.message || 'Request failed',
      );

      response.status(status).json(body);
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        this.createErrorBody(
          'INTERNAL_SERVER_ERROR',
          'An unexpected error occurred',
        ),
      );
  }

  private createErrorBody(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ): ErrorResponseBody {
    return {
      code,
      message,
      ...(details ? { details } : {}),
    };
  }

  private mapHttpStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'HTTP_ERROR';
    }
  }
}
