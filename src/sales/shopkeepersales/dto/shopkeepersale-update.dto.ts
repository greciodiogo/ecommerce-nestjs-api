import { IsInt, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ShopkeeperSaleProductUpdateDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;
}

export class ShopkeeperSaleUpdateDto {
  @IsString()
  @IsOptional()
  order_number?: string;

  @IsInt()
  @IsOptional()
  shopId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopkeeperSaleProductUpdateDto)
  @IsOptional()
  products?: ShopkeeperSaleProductUpdateDto[];
} 