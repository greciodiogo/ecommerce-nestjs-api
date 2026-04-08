// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/models/user.entity';
import { NotificationsService } from './notification.service';
import { NotificationsController } from './notification.controller';
import { Notification } from './models/notification.entity';
import { DeviceToken } from './models/device-token.entity';
import { UsersModule } from 'src/users/users.module';
import { NotificationsGateway } from 'src/notifications.gateway';
import { FcmService } from './fcm.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, DeviceToken, User]),
    UsersModule],
  providers: [NotificationsService, NotificationsGateway, FcmService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule { }
