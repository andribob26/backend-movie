import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data
        ) {
          const {
            message,
            data: actualData,
            pagination,
          } = data as {
            message: string;
            data: any;
            pagination?: any;
          };
          return {
            status: 'success',
            message,
            statusCode,
            data: actualData,
            ...(pagination && { pagination }),
          };
        }

        return {
          status: 'success',
          message: 'OK',
          statusCode,
          data,
        };
      }),
    );
  }
}
