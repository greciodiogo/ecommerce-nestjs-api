import { IsOptional, IsString, IsNumberString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ShopkeeperSaleFilterDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() === '' ? undefined : value?.trim())
  orderNumber?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() === '' ? undefined : value?.trim())
  productName?: string;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => value?.trim() === '' ? undefined : value?.trim())
  productId?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value?.trim() === '' ? undefined : value?.trim())
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value?.trim() === '' ? undefined : value?.trim())
  endDate?: string;
} 