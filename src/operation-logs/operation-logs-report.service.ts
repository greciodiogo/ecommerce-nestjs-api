import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OperationLogsService } from './operation-logs.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { jsPDF } from 'jspdf';
import { Role } from '../users/models/role.enum';
import * as fs from 'fs';
import * as path from 'path';
import autoTable from 'jspdf-autotable';

@Injectable()
export class OperationLogsReportService {
  private readonly logger = new Logger(OperationLogsReportService.name);

  constructor(
    private readonly operationLogsService: OperationLogsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 21 * * *') // Every day at 9 p.m.
  async sendWeeklyReport() {
    this.logger.log('Generating weekly operation logs report...');
    // 1. Fetch admin users
    const admins = await this.usersService.findUsersByRole(Role.Admin);
    if (!admins || admins.length === 0) {
    this.logger.warn('No admin users found. Skipping report.');
    return;
    }
    // 2. Fetch today's logs
    const logs = await this.operationLogsService.getLogsFromToday();
    // 3. Generate PDF
    const pdfBuffer = await this.generatePdf(logs);
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

  async generatePdf(logs: any[]): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;
    // Add logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = logoData.toString('base64');
      doc.addImage('data:image/png;base64,' + logoBase64, 'PNG', 10, y, 30, 20);
    } catch (e) {
      doc.setFontSize(10);
      doc.text('LOGO', 10, y + 10);
    }
    y += 28;
    doc.setFontSize(16);
    doc.setTextColor(33, 94, 191);
    doc.text('Daily Operation Logs Report', pageWidth / 2, y, { align: 'center' });
    y += 8;
    // Reporting period (today)
    const now = new Date();
    const todayStr = now.toLocaleDateString();
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Period: ${todayStr}`, 10, y);
    y += 6;
    doc.text(`Total logs: ${logs.length}`, 10, y);
    y += 4;
    // Fetch user names for all logs
    const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)));
    const users = await this.usersService.findUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, (u.firstName || '') + ' ' + (u.lastName || '') || u.email || 'Unknown']));
    // Table columns
    const columns = [
      { header: 'User', dataKey: 'user' },
      { header: 'Action', dataKey: 'action' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Entity', dataKey: 'entity' },
      { header: 'Timestamp', dataKey: 'timestamp' },
    ];
    // Table rows
    const rows = logs.map(log => ({
      user: userMap.get(log.userId) || 'Unknown',
      action: log.action,
      description: log.description || '',
      entity: log.entity,
      timestamp: new Date(log.timestamp).toLocaleString(),
    }));
    // Add table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey])),
      startY: y + 6,
      theme: 'grid',
      headStyles: { fillColor: [33, 94, 191], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, halign: 'center' },
      margin: { left: 10, right: 10 },
      didDrawPage: (data) => {
        // Footer with page number and generation date
        const pageCount = doc.getNumberOfPages();
        const str = 'Page ' + data.pageNumber + ' of ' + pageCount;
        doc.setFontSize(9);
        doc.text(str, pageWidth - 30, doc.internal.pageSize.getHeight() - 8);
        doc.text('Generated: ' + now.toLocaleString(), 10, doc.internal.pageSize.getHeight() - 8);
      },
    });
    return Buffer.from(doc.output('arraybuffer'));
  }
} 