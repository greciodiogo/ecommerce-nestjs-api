import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { OperationLog } from './models/operation-log.entity';

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly operationLogsRepository: Repository<OperationLog>,
  ) {}

  private generateDescription(params: { action: string; entity: string; entityId?: string; details?: any }): string {
    const { action, entity, entityId } = params;
    if (action === 'log in' && entity === 'auth') return 'user accessed system';
    if (action === 'log out' && entity === 'auth') return 'user leaved system';
    if (action === 'create' && entity === 'auth') return 'user authentication';
    if (action === 'create' && entity === 'products') return 'product creation';
    if (action === 'update' && entity === 'products' && entityId) return `update product #${entityId}`;
    if (action === 'update' && entity === 'categories' && entityId) return `update #${entityId} in categories`;
    if (action === 'delete' && entity === 'categories' && entityId) return `delete #${entityId} in categories`;
    // General fallback for any action/entity/entityId
    if (action && entity && entityId) return `${action} ${entity} #${entityId}`;
    if (action && entity) return `${action} ${entity}`;
    if (action) return action;
    return '';
  }

  async logOperation(params: {
    userId: number;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
  }): Promise<OperationLog> {
    let { action, entity, entityId, details } = params;
    let description: string | undefined;
    const entityNorm = entity ? entity.toLowerCase() : '';
    // Detect log in/log out with refined logic
    if (action === 'create' && entityNorm === 'auth' && !entityId) {
      if (details && typeof details === 'object' && details.body && typeof details.body === 'object' && Object.keys(details.body).length === 0) {
        // Log out
        action = 'log out';
        entity = 'auth';
        description = 'user leaved system';
      } else {
        // Log in
        action = 'log in';
        entity = 'auth';
        description = 'user accessed system';
      }
    }
    const log = this.operationLogsRepository.create({
      ...params,
      action,
      entity,
      timestamp: new Date(),
      description: description || this.generateDescription({ action, entity, entityId, details }),
    });
    return this.operationLogsRepository.save(log);
  }

  async getLogsFromLastWeek(): Promise<OperationLog[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Monday = 1, Sunday = 0
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - diffToMonday - 7);
    lastMonday.setHours(0, 0, 0, 0);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    return this.operationLogsRepository.find({
      where: { timestamp: Between(lastMonday, lastSunday) },
      order: { timestamp: 'ASC' },
    });
  }

  async getLogsFromToday(): Promise<OperationLog[]> {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    return this.operationLogsRepository.find({
      where: { timestamp: Between(start, end) },
      order: { timestamp: 'ASC' },
    });
  }

  async getAllLogs(): Promise<OperationLog[]> {
    // Exclude log in/log out for auth entity
    return this.operationLogsRepository.find({
      where: [
        { action: Not('log in'), entity: 'auth' },
        { action: Not('log out'), entity: 'auth' },
        { entity: Not('auth') },
      ],
      order: { timestamp: 'DESC' },
    });
  }
} 