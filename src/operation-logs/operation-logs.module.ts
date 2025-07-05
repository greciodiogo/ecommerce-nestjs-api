import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './models/operation-log.entity';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogInterceptor } from './operation-log.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  providers: [
    OperationLogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
  exports: [OperationLogsService],
})
export class OperationLogsModule {} 