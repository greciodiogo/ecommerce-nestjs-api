import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/models/role.enum';
import { User } from 'src/users/models/user.entity';
import { ReqUser } from 'src/auth/decorators/user.decorator';
import { NotificationsService } from './notification.service';
import { Notification } from './models/notification.entity';
import { NotifyUsersByRoleDto } from './dto/notify-users-role.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  /**
   * Cria uma nova notificação.
   * Ex: ao criar um pedido, pode-se invocar este endpoint.
   */

  @Get()
  @ApiOkResponse({ type: [Notification], description: 'List of all Notifications' })
  getNotifications(@ReqUser() user?: User): Promise<Notification[]> {
    // if(user && [Role.Admin, Role.Manager, Role.Sales].includes(user?.role)) {
    return this.notificationsService.getNotifications(true);
    // }
    return this.notificationsService.getNotifications();
  }

  @Get('/me')
  @ApiOperation({ summary: 'Buscar notificações do usuário autenticado' })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiNotFoundResponse({ description: 'Usuário ou notificações não encontrados' })
  @ApiOkResponse({ type: [Notification], description: 'Notificações do próprio usuário' })
  async findAllNotificationsMe(@ReqUser() user: User): Promise<Notification[]> {
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.notificationsService.findAllNotificationsByUserId(user.id, false);
  }

  @Get('/users/:id')
  @ApiOperation({ summary: 'Buscar notificações por ID de usuário' })
  @ApiOkResponse({ type: [Notification], description: 'Lista de notificações por usuário' })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiNotFoundResponse({ description: 'Usuário ou notificações não encontrados' })
  async findAllNotificationsByUserId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Notification[]> {
    return this.notificationsService.findAllNotificationsByUserId(id, false);
  }

  // @Get('/users/:id')
  // @ApiOperation({ summary: 'find All notifications by User id' })
  // @ApiOkResponse({ type: Notification, description: 'List of all Notifications By User Id' })
  // @ApiNotFoundResponse({ description: 'Notification not found' })
  // // @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  // async findNotificationByUserId(
  //   @Param('id', ParseIntPipe) id: number,
  //   @ReqUser() user: User,
  // ): Promise<Notification> {
  //   return await this.notificationsService.findNotificationByUserId(id, user.id);
  // }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova notificação' })
  @ApiCreatedResponse({ type: Notification, description: 'Notificação criada com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  async createNotification(
    @Body() body: CreateNotificationDto,
  ): Promise<Notification> {
    return await this.notificationsService.createNotification(body);
  }

  @Post('/notifyUsersByRole')
  @ApiOperation({ summary: 'Notify users by role' })
  @ApiCreatedResponse({ type: Notification, description: 'Notificação criada com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  async notifyUsersByRole(
    @Body() body: NotifyUsersByRoleDto,
  ): Promise<Notification[]> {
    return await this.notificationsService.notifyUsersByRole(body);
  }

  /**
   * Lista todas as notificações visíveis ao usuário.
   */
  // @Get()
  // @ApiOperation({ summary: 'Listar notificações do usuário logado' })
  // @ApiOkResponse({ type: [Notification], description: 'Lista de notificações' })
  // async getUserNotifications(@ReqUser() user: User): Promise<Notification[]> {
  //   return await this.notificationsService.getNotificationsForUser(user);
  // }

  /**
   * Marca uma notificação como lida.
   */
  //   @Patch(':id/read')
  //   @ApiOperation({ summary: 'Marcar notificação como lida' })
  //   @ApiOkResponse({ type: Notification, description: 'Notificação marcada como lida' })
  //   @ApiNotFoundResponse({ description: 'Notificação não encontrada' })
  //   async markAsRead(
  //     @Param('id', ParseIntPipe) id: number,
  //     @ReqUser() user: User,
  //   ): Promise<Notification> {
  //     return await this.notificationsService.markAsRead(id, user);
  //   }
}
