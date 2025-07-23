import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PromotionUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  productIds?: number[];
} 