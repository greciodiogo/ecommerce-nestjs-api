// src/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from 'src/users/models/user.entity';
import { Role } from 'src/users/models/role.enum';
import { UsersService } from 'src/users/users.service';
import { Notification, NotificationType } from './models/notification.entity';
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

  async getNotifications(includeRead = false): Promise<Notification[]> {
    const where: any = {};
    if (!includeRead) {
      where.isRead = false;
    }
    
    return this.notificationsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findAllNotificationsByUserId(userId: number, includeRead = false): Promise<Notification[]> {
    const where: any = { user: { id: userId } };
    if (!includeRead) {
      where.isRead = false;
    }

    return this.notificationsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findNotificationByUserId(notificationId: number, userId: number): Promise<Notification | null> {
    const notification = await this.notificationsRepository.findOne({
      where: {
        user: { id: userId },
        id: notificationId,
      },
    });
    
    if (!notification) {
      throw new NotFoundError('Notification not found', 'id', notificationId.toString());
    }
    
    return notification;
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationsRepository.count({
      where: {
        user: { id: userId },
        isRead: false,
      },
    });
  }

  async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    const notification = new Notification();

    notification.title = notificationData.title;
    notification.message = notificationData.message;
    notification.type = notificationData.type || NotificationType.GENERAL;
    notification.relatedEntityId = notificationData.relatedEntityId;
    notification.actionUrl = notificationData.actionUrl;

    const user = await this.usersService.getUser(notificationData.userId);

    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    notification.user = user;

    const savedNotification = await this.notificationsRepository.save(notification);
    
    // Send real-time notification
    this.gateway.sendNotificationToUser(user.id, savedNotification);
    
    return savedNotification;
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
          type: NotificationType.SYSTEM,
        }),
      ),
    );

    return notifications;
  }

  async markAsRead(notificationId: number, userId?: number): Promise<Notification> {
    const where: any = { id: notificationId };
    if (userId) {
      where.user = { id: userId };
    }

    const notification = await this.notificationsRepository.findOne({ where });
    
    if (!notification) {
      throw new NotFoundError('Notification not found', 'id', notificationId.toString());
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationsRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(notificationId: number, userId?: number): Promise<void> {
    const where: any = { id: notificationId };
    if (userId) {
      where.user = { id: userId };
    }

    const result = await this.notificationsRepository.delete(where);
    
    if (result.affected === 0) {
      throw new NotFoundError('Notification not found', 'id', notificationId.toString());
    }
  }
}
