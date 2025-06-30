import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { OrderStatus } from '../models/order-status.enum';

export class OrderFilterDto {
  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  deliveryMethodId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  shopName?: string;
} 