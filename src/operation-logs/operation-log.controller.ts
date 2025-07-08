import { Controller, Get, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { OperationLogsService } from './operation-logs.service';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';

@ApiTags('operation-logs')
@ApiBearerAuth()
@Controller('operation-logs')
export class OperationLogController {
  constructor(private readonly logsService: OperationLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all operation logs' })
  @ApiOkResponse({ description: 'List of all operation logs' })
  async getAll() {
    return this.logsService['operationLogsRepository'].find({ order: { timestamp: 'DESC' } });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific operation log by ID' })
  @ApiOkResponse({ description: 'Operation log found' })
  @ApiNotFoundResponse({ description: 'Operation log not found' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.logsService['operationLogsRepository'].findOne({ where: { id } });
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an operation log by ID' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ description: 'Operation log deleted' })
  @ApiNotFoundResponse({ description: 'Operation log not found' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.logsService['operationLogsRepository'].delete({ id });
    return { message: 'Deleted' };
  }
} 