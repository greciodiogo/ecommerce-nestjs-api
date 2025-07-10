import { Controller, Get, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { OperationLogsService } from './operation-logs.service';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import { UsersService } from '../users/users.service';

@ApiTags('operation-logs')
@ApiBearerAuth()
@Controller('operation-logs')
export class OperationLogController {
  constructor(
    private readonly logsService: OperationLogsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all operation logs' })
  @ApiOkResponse({ description: 'List of all operation logs' })
  async getAll() {
    const logs = await this.logsService.getAllLogs();
    const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)));
    const users = await this.usersService.findUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, (u.firstName || '') + ' ' + (u.lastName || '') || u.email || 'Unknown']));
    return logs.map(log => ({
      ...log,
      userName: userMap.get(log.userId) || 'Unknown',
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific operation log by ID' })
  @ApiOkResponse({ description: 'Operation log found' })
  @ApiNotFoundResponse({ description: 'Operation log not found' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const log = await this.logsService['operationLogsRepository'].findOne({ where: { id } });
    if (!log) return null;
    let userName = 'Unknown';
    if (log.userId) {
      const user = await this.usersService.getUser(log.userId).catch(() => null);
      if (user) userName = (user.firstName || '') + ' ' + (user.lastName || '') || user.email || 'Unknown';
    }
    return { ...log, userName };
  }

  @Get('users/session')
  @ApiOperation({ summary: 'Get all user session logs (log in/log out)' })
  @ApiOkResponse({ description: 'List of all user session logs' })
  async getUserSessions() {
    const logs = await this.logsService['operationLogsRepository'].find({
      where: [
        { action: 'log in', entity: 'auth' },
        { action: 'log out', entity: 'auth' },
      ],
      order: { timestamp: 'DESC' },
    });
    const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)));
    const users = await this.usersService.findUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, (u.firstName || '') + ' ' + (u.lastName || '') || u.email || 'Unknown']));
    return logs.map(log => {
      let action = log.action;
      let description = log.description;
      if (log.action === 'log in') {
        action = 'logged in';
        description = 'user accessed system';
      } else if (log.action === 'log out') {
        action = 'logged out';
        description = 'user leaved system';
      }
      return {
        ...log,
        action,
        description,
        userName: userMap.get(log.userId) || 'Unknown',
      };
    });
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