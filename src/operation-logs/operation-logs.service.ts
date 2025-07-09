import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OperationLog } from './models/operation-log.entity';

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly operationLogsRepository: Repository<OperationLog>,
  ) {}

  private generateDescription(params: { action: string; entity: string; entityId?: string; details?: any }): string {
    const { action, entity, entityId } = params;
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
    const log = this.operationLogsRepository.create({
      ...params,
      timestamp: new Date(),
      description: this.generateDescription(params),
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
    return this.operationLogsRepository.find({ order: { timestamp: 'DESC' } });
  }
} 