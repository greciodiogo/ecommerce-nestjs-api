import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ProductUpdateDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salesPrice?: number;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  comission?: number;

  @IsString()
  @IsOptional()
  photosOrder?: string;

  @IsNumber()
  @IsOptional()
  shopId?: number;
}
