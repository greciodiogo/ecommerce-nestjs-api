import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CategoryCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  service_fee?: number;

  @IsNumber()
  @IsOptional()
  parentCategoryId?: number;
}
