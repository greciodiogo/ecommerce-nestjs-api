import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class ShopkeeperSaleFilterDto {
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  productId?: number;

  @IsOptional()
  @IsDateString()
  date?: string;
} 