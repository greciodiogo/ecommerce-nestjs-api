import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import { ExportService } from './export.service';
import { Response } from 'express';
import { ExportDto } from './dto/export.dto';
import { fileResponseSchema } from '../local-files/models/file-response.schema';

@ApiTags('import-export')
@Controller('export')
@Roles(Role.Admin)
@ApiUnauthorizedResponse({ description: 'User is not logged in' })
@ApiForbiddenResponse({ description: 'User is not admin' })
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post('')
  @ApiCreatedResponse({
    schema: fileResponseSchema,
    description: 'Exported data',
  })
  @ApiProduces('application/json', 'application/gzip', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') // adicionando zip para xlsx
  async export(
    @Res({ passthrough: true }) res: Response,
    @Body() data: ExportDto,
  ) {
    let contentType: string;

    switch (data.format) {
      case 'csv':
        contentType = 'application/gzip';
        break;
      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'json':
      default:
        contentType = 'application/json';
    }

    res.header('Content-Type', contentType);
    res.header(
      'Content-Disposition',
      `attachment; filename="${this.exportService.getFilename(data.format)}"`,
    );
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    return await this.exportService.export(data.data, data.format);
  }
}
