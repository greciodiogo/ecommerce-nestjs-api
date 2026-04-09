import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class OrderNotificationDto {
  @ApiProperty({ description: 'Type of notification', example: 'new_order' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Notification title', example: 'Novo Pedido Recebido' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message', example: 'Novo pedido #12345 recebido' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Order ID', example: 12345 })
  @IsNumber()
  orderId: number;

  @ApiPropertyOptional({ description: 'Order number', example: 'ORD-2024-001' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiPropertyOptional({ description: 'Order status', example: 'PENDING' })
  @IsString()
  @IsOptional()
  orderStatus?: string;

  @ApiPropertyOptional({ description: 'Total amount', example: 1500.00 })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'User ID', example: 123 })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ description: 'Creation date', example: '2024-01-15T10:30:00Z' })
  @IsString()
  @IsOptional()
  createdAt?: string;

  @ApiPropertyOptional({ description: 'Source system', example: 'encontrarCore' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
