import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { OperationLogsService } from './operation-logs.service';

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const entity = this.extractEntityFromPath(request.path);
    const entityId = request.params?.id || undefined;
    const action = this.mapMethodToAction(method);

    if (!user || !action || !entity) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (result) => {
        await this.operationLogsService.logOperation({
          userId: user.id,
          action,
          entity,
          entityId: entityId ? entityId.toString() : undefined,
          details: {
            body: request.body,
            params: request.params,
            result,
          },
        });
      }),
    );
  }

  private mapMethodToAction(method: string): string | null {
    switch (method) {
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return null;
    }
  }

  private extractEntityFromPath(path: string): string | null {
    // Example: /shops/123 -> shops
    const match = path.match(/^\/?([a-zA-Z0-9\-_]+)/);
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : null;
  }
} 