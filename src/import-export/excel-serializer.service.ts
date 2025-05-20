// excel-serializer.service.ts
import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelSerializer {
  async serialize(data: Record<string, any[]>): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    for (const [sheetName, rows] of Object.entries(data)) {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Gerar o arquivo como buffer Excel (.xlsx)
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
