// src/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from 'src/users/models/user.entity';
import { Role } from 'src/users/models/role.enum';
import { UsersService } from 'src/users/users.service';
import { Notification } from './models/notification.entity';
import { NotifyUsersByRoleDto } from './dto/notify-users-role.dto';
import { NotFoundError } from 'src/errors/not-found.error';
import { NotificationsGateway } from 'src/notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
    private readonly usersService: UsersService,

  ) { }


  async getNotifications(withRead?: boolean): Promise<Notification[] | null> {
    const notification = this.notificationsRepository.find({
      where: { isRead: !withRead ? true : undefined },
    });
    if (!notification) {
      throw new NotFoundError('Not found notifications');
    }
    return notification;
  }

  async findAllNotificationsByUserId(userId: number, withRead?: boolean): Promise<Notification[] | null> {
    const notification = this.notificationsRepository.find({
      where: { 
        user: { id: userId },
        isRead: !withRead ? false : undefined 
      },
      order: { createdAt: 'DESC' },
    });
    if (!notification) {
      throw new NotFoundError('Not found notifications for user', 'userId', userId.toString());
    }
    return notification;
  }

  async findNotificationByUserId(notificationId: number, userId: number, withRead?: boolean): Promise<Notification | null> {
    const notification = this.notificationsRepository.findOne({
      where: {
        user: { id: userId },
        id: notificationId,
        isRead: !withRead ? false : undefined
      },
      order: { createdAt: 'DESC' },
    });
    if (!notification) {
      throw new NotFoundError('Not found notification for user', 'userId', userId.toString());
    }
    return notification;
  }

  async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    const notification = new Notification();

    notification.title = notificationData.title;
    notification.message = notificationData.message;

    const user = await this.usersService.getUser(notificationData.userId);

    if (!user) {
      throw new NotFoundException(`User não encontrado.`);
    }

    notification.user = user;

    const savedNotification = this.notificationsRepository.save(notification);
    this.gateway.sendNotificationToUser(user.id, savedNotification)
    return savedNotification
  }

  async notifyUsersByRole(notifyUser: NotifyUsersByRoleDto): Promise<Notification[]> {
    const users = await this.usersService.findUsersByRole(notifyUser.role);

    if (!users.length) {
      return [];
    }

    const notifications = await Promise.all(
      users.map((user: User) =>
        this.createNotification({
          title: notifyUser.title,
          message: notifyUser.message,
          userId: user.id,
        }),
      ),
    );

    return notifications;
  }

  async markAsRead(notificationId: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOneByOrFail({ id: notificationId });
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }
}
