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
} 