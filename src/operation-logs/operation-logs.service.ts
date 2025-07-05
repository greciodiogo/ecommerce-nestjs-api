import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
} 