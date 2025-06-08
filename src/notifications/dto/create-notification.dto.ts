// src/notifications/dto/create-notification.dto.ts
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  userId: number;
}
