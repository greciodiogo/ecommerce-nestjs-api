import { IsInt, IsNotEmpty, IsString, IsArray, ArrayNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ShopkeeperSaleProductCreateDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;
}

export class ShopkeeperSaleCreateDto {
  @IsString()
  @IsNotEmpty()
  order_number: string;

  @IsInt()
  @IsOptional()
  shopId?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ShopkeeperSaleProductCreateDto)
  products: ShopkeeperSaleProductCreateDto[];
} 