// src/notifications/dto/create-notification.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/users/models/role.enum';

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
}
