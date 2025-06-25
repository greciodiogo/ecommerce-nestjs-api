import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';

export class ShopkeeperSaleUpdateDto {
  @IsString()
  @IsOptional()
  order_number?: string;

  @IsInt()
  @IsOptional()
  shopId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  productIds?: number[];

  @IsInt()
  @IsOptional()
  quantity?: number;
} 