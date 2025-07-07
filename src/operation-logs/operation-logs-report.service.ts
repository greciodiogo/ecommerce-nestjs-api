import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OperationLogsService } from './operation-logs.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { jsPDF } from 'jspdf';
import { Role } from '../users/models/role.enum';

@Injectable()
export class OperationLogsReportService {
  private readonly logger = new Logger(OperationLogsReportService.name);

  constructor(
    private readonly operationLogsService: OperationLogsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 1 * * 1') // Every Monday at 1am
  async sendWeeklyReport() {
    this.logger.log('Generating weekly operation logs report...');
    // 1. Fetch admin users
    const admins = await this.usersService.findUsersByRole(Role.Admin);
    if (!admins || admins.length === 0) {
    this.logger.warn('No admin users found. Skipping report.');
    return;
    }
    // 2. Fetch last week's logs
    const logs = await this.operationLogsService.getLogsFromLastWeek();
    // 3. Generate PDF
    const pdfBuffer = this.generatePdf(logs);
    // 4. Send email to each admin
    for (const admin of admins) {
      await this.mailService.sendMailWithAttachment({
        to: admin.email,
        subject: 'Weekly Operation Logs Report',
        text: 'Attached is the operation logs report for last week.',
        attachments: [
          {
            filename: 'operation-logs-report.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    }
    this.logger.log('Weekly operation logs report sent to all admins.');
  }

  generatePdf(logs: any[]): Buffer {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('Weekly Operation Logs Report', 10, 10);
    const headers = ['ID', 'UserID', 'Action', 'Entity', 'EntityID', 'Timestamp'];
    let y = 20;
    doc.text(headers.join(' | '), 10, y);
    y += 8;
    logs.forEach(log => {
      const row = [
        log.id,
        log.userId,
        log.action,
        log.entity,
        log.entityId || '',
        new Date(log.timestamp).toLocaleString(),
      ].join(' | ');
      doc.text(row, 10, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });
    // Return as Buffer for nodemailer
    return Buffer.from(doc.output('arraybuffer'));
  }
} 