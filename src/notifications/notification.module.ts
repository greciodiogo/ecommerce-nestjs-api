// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/models/user.entity';
import { NotificationsService } from './notification.service';
import { NotificationsController } from './notification.controller';
import { Notification } from './models/notification.entity';
import { UsersModule } from 'src/users/users.module';
import { NotificationsGateway } from 'src/notifications.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User]),
    UsersModule],
  providers: [NotificationsService, NotificationsGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule { }
