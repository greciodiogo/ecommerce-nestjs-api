import { Controller, Post } from '@nestjs/common';
import { OperationLogsReportService } from './operation-logs-report.service';

@Controller('test-operation-logs-report')
export class OperationLogsReportController {
  constructor(private readonly reportService: OperationLogsReportService) {}

  @Post()
  async triggerReport() {
    console.log("")
    await this.reportService.sendWeeklyReport();
    return { message: 'Report triggered!' };
  }
} 