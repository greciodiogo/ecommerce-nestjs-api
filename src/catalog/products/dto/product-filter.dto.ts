import { IsOptional, IsString, IsNumberString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
  @IsOptional()
  @IsNumberString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;
} 