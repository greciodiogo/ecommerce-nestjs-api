import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './models/operation-log.entity';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogInterceptor } from './operation-log.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { OperationLogsReportService } from './operation-logs-report.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { OperationLogsReportController } from './operation-logs-report.controller';
import { OperationLogController } from './operation-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OperationLog]), ScheduleModule, UsersModule, MailModule],
  providers: [
    OperationLogsService,
    OperationLogsReportService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
  exports: [OperationLogsService],
  controllers: [OperationLogsReportController, OperationLogController],
})
export class OperationLogsModule {} 