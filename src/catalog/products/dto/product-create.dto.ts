import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ProductCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  name_en?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  description_en?: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  comission: number;

  @IsNumber()
  @IsOptional()
  shopId?: number;
}
