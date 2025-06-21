import { IsOptional, IsString, IsDateString } from 'class-validator';

export class OrderFilterDto {
  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  shopName?: string;
} 