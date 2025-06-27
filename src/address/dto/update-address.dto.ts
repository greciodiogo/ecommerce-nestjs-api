import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsNumber()
  parentAddressId?: number;

  @IsOptional()
  @IsNumber()
  price?: number;
} 