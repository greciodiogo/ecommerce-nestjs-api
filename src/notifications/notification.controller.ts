import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/models/role.enum';
import { User } from 'src/users/models/user.entity';
import { ReqUser } from 'src/auth/decorators/user.decorator';
import { NotificationsService } from './notification.service';
import { Notification } from './models/notification.entity';
import { NotifyUsersByRoleDto } from './dto/notify-users-role.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Get all notifications (Admin/Manager only)' })
  @ApiQuery({ name: 'includeRead', required: false, type: Boolean })
  @ApiOkResponse({ type: [Notification], description: 'List of all notifications' })
  getNotifications(
    @Query('includeRead') includeRead?: boolean,
  ): Promise<Notification[]> {
    return this.notificationsService.getNotifications(includeRead === true);
  }

  @Get('/me')
  @ApiOperation({ summary: 'Get notifications for authenticated user' })
  @ApiQuery({ name: 'includeRead', required: false, type: Boolean })
  @ApiOkResponse({ type: [Notification], description: 'User notifications' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  async findAllNotificationsMe(
    @ReqUser() user: User,
    @Query('includeRead') includeRead?: boolean,
  ): Promise<Notification[]> {
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.notificationsService.findAllNotificationsByUserId(user.id, includeRead === true);
  }

  @Get('/me/poll')
  @ApiOperation({ summary: 'Poll for new notifications (long-polling)' })
  @ApiQuery({ name: 'lastId', required: false, type: Number })
  @ApiOkResponse({ type: [Notification], description: 'New notifications since lastId' })
  async pollNotifications(
    @ReqUser() user: User,
    @Query('lastId') lastId?: number,
  ): Promise<Notification[]> {
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Buscar notificações não lidas mais recentes que lastId
    const where: any = {
      user: { id: user.id },
      isRead: false,
    };
    
    if (lastId) {
      where.id = { $gt: lastId };
    }
    
    return this.notificationsService.findAllNotificationsByUserId(user.id, false);
  }
  @ApiOperation({ summary: 'Get unread notifications count for authenticated user' })
  @ApiOkResponse({ description: 'Unread notifications count' })
  async getUnreadCount(@ReqUser() user: User): Promise<{ count: number }> {
    if (!user) {
      throw new UnauthorizedException();
    }
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Get('/users/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Get notifications by user ID (Admin/Manager only)' })
  @ApiQuery({ name: 'includeRead', required: false, type: Boolean })
  @ApiOkResponse({ type: [Notification], description: 'User notifications' })
  @ApiNotFoundResponse({ description: 'User or notifications not found' })
  async findAllNotificationsByUserId(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRead') includeRead?: boolean,
  ): Promise<Notification[]> {
    return this.notificationsService.findAllNotificationsByUserId(id, includeRead === true);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiCreatedResponse({ type: Notification, description: 'Notification created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid data provided' })
  async createNotification(
    @Body() body: CreateNotificationDto,
  ): Promise<Notification> {
    return await this.notificationsService.createNotification(body);
  }

  @Post('/notifyUsersByRole')
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Notify users by role' })
  @ApiCreatedResponse({ type: [Notification], description: 'Notifications created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid data provided' })
  async notifyUsersByRole(
    @Body() body: NotifyUsersByRoleDto,
  ): Promise<Notification[]> {
    return await this.notificationsService.notifyUsersByRole(body);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiOkResponse({ type: Notification, description: 'Notification marked as read' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: User,
  ): Promise<Notification> {
    return await this.notificationsService.markAsRead(id, user?.id);
  }

  @Patch('/me/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for authenticated user' })
  @ApiOkResponse({ description: 'All notifications marked as read' })
  async markAllAsRead(@ReqUser() user: User): Promise<{ message: string }> {
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.notificationsService.markAllAsRead(user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiOkResponse({ description: 'Notification deleted successfully' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  async deleteNotification(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: User,
  ): Promise<{ message: string }> {
    await this.notificationsService.deleteNotification(id, user?.id);
    return { message: 'Notification deleted successfully' };
  }

  // Device Token Endpoints
  @Post('/device-tokens')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiCreatedResponse({ description: 'Device token registered successfully' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  async registerDeviceToken(
    @ReqUser() user: User,
    @Body() body: any,
  ): Promise<{ message: string }> {
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.notificationsService.registerDeviceToken(user.id, body);
    return { message: 'Device token registered successfully' };
  }

  @Delete('/device-tokens/:token')
  @ApiOperation({ summary: 'Remove device token' })
  @ApiOkResponse({ description: 'Device token removed successfully' })
  async removeDeviceToken(
    @Param('token') token: string,
    @ReqUser() user: User,
  ): Promise<{ message: string }> {
    await this.notificationsService.removeDeviceToken(token, user?.id);
    return { message: 'Device token removed successfully' };
  }
}
