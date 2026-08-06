import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Turns every unhandled error into a consistent JSON body and keeps internals
 * out of the response.
 *
 * Previously an unmapped Prisma error surfaced raw — leaking table and column
 * names — and anything unexpected became a bare 500 with no way to correlate the
 * response to a log line. Each failure now carries a reference id that appears
 * in both.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const reference = randomUUID();

    const { status, message } = this.describe(exception);

    if (status >= 500) {
      this.logger.error(
        `[${reference}] ${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${reference}] ${request.method} ${request.url} -> ${status}: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      reference,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private describe(exception: unknown): { status: number; message: unknown } {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return {
        status: exception.getStatus(),
        message:
          typeof body === 'object' && body !== null && 'message' in body
            ? body.message
            : body,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'That record already exists.',
          };
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Record not found.',
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Referenced record does not exist.',
          };
        default:
          // Deliberately generic: Prisma messages name tables and columns.
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'The request could not be completed.',
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'The request could not be completed.',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
