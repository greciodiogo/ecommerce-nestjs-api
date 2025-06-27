import { IsOptional, IsString, IsNumberString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ShopkeeperSaleFilterDto {
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => value === '' ? undefined : value)
  productId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
} 