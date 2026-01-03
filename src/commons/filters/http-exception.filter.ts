import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  BaseError,
  ValidationError,
  UniqueConstraintError,
  DatabaseError,
} from 'sequelize';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // NestJS HttpException
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      statusCode = exception.getStatus();

      if (typeof res === 'object' && res !== null) {
        if (Array.isArray((res as any).message)) {
          message = (res as any).message.join(', ');
        } else {
          message = (res as any).message || message;
        }
      } else if (typeof res === 'string') {
        message = res;
      }

      // Sequelize validation error
    } else if (exception instanceof ValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.errors.map((err) => err.message).join(', ');

      // Sequelize unique constraint error
    } else if (exception instanceof UniqueConstraintError) {
      statusCode = HttpStatus.CONFLICT;
      message = exception.errors.map((err) => err.message).join(', ');

      // Sequelize database error (query error)
    } else if (exception instanceof DatabaseError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;

      // Generic Sequelize error
    } else if (exception instanceof BaseError) {
      message = exception.message;

      // Fallback
    } else if (exception?.message) {
      message = exception.message;
    }

    response.status(statusCode).json({
      status: 'failure',
      statusCode,
      message,
    });
  }
}
