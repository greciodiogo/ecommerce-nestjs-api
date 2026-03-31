// src/notifications/dto/create-notification.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/users/models/role.enum';
import { NotificationType } from '../models/notification.entity';

export class NotifyUsersByRoleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

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
