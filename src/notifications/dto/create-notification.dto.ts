// src/notifications/dto/create-notification.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../models/notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  userId: number;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsNumber()
  @IsOptional()
  relatedEntityId?: number;

  @IsString()
  @IsOptional()
  actionUrl?: string;
}
