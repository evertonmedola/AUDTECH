import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RespostaPadrao<T> {
  sucesso: boolean;
  dados: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, RespostaPadrao<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<RespostaPadrao<T>> {
    return next.handle().pipe(
      map((dados) => ({
        sucesso: true,
        dados,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
