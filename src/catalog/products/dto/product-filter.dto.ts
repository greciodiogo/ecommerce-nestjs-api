import { IsOptional, IsString, IsNumberString } from 'class-validator';

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
} 