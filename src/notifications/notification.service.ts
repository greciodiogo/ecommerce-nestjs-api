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
import { FcmService } from './fcm.service';
import { DeviceToken } from './models/device-token.entity';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    private readonly gateway: NotificationsGateway,
    private readonly usersService: UsersService,
    private readonly fcmService: FcmService,
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
    
    // Send real-time notification via WebSocket
    this.gateway.sendNotificationToUser(user.id, savedNotification);
    
    // Send push notification to user's devices
    await this.sendPushNotificationToUser(user.id, savedNotification);
    
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
          type: notifyUser.type || NotificationType.SYSTEM,
          relatedEntityId: notifyUser.relatedEntityId,
          actionUrl: notifyUser.actionUrl,
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

  // Device Token Management
  async registerDeviceToken(userId: number, tokenData: RegisterDeviceTokenDto): Promise<DeviceToken> {
    const user = await this.usersService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if token already exists
    let deviceToken = await this.deviceTokenRepository.findOne({
      where: { token: tokenData.token },
      relations: ['user'],
    });

    if (deviceToken) {
      // Update existing token
      deviceToken.deviceName = tokenData.deviceName || deviceToken.deviceName;
      deviceToken.deviceType = tokenData.deviceType || deviceToken.deviceType;
      deviceToken.isActive = true;
      deviceToken.user = user;
      return this.deviceTokenRepository.save(deviceToken);
    }

    // Create new token
    deviceToken = this.deviceTokenRepository.create({
      user,
      token: tokenData.token,
      deviceName: tokenData.deviceName,
      deviceType: tokenData.deviceType || 'mobile',
      isActive: true,
    });

    return this.deviceTokenRepository.save(deviceToken);
  }

  async removeDeviceToken(token: string, userId?: number): Promise<void> {
    const where: any = { token };
    if (userId) {
      where.user = { id: userId };
    }

    const result = await this.deviceTokenRepository.delete(where);
    
    if (result.affected === 0) {
      throw new NotFoundError('Device token not found', 'token', token);
    }
  }

  async getUserDeviceTokens(userId: number): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: { user: { id: userId }, isActive: true },
    });
  }

  // Push Notification Methods
  private async sendPushNotificationToUser(userId: number, notification: Notification): Promise<void> {
    if (!this.fcmService.isAvailable()) {
      return;
    }

    const deviceTokens = await this.getUserDeviceTokens(userId);
    
    if (deviceTokens.length === 0) {
      return;
    }

    const tokens = deviceTokens.map(dt => dt.token);
    const response = await this.fcmService.sendToMultipleDevices(tokens, notification);

    // Handle invalid tokens
    if (response && response.failureCount > 0) {
      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];
        if (!resp.success && 
            (resp.error?.code === 'messaging/invalid-registration-token' ||
             resp.error?.code === 'messaging/registration-token-not-registered')) {
          // Deactivate invalid token
          await this.deviceTokenRepository.update(
            { token: tokens[i] },
            { isActive: false }
          );
        }
      }
    }
  }
}
