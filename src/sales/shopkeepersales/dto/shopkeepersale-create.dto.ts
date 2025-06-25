import { IsInt, IsNotEmpty, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class ShopkeeperSaleCreateDto {
  @IsString()
  @IsNotEmpty()
  order_number: string;

  @IsInt()
  @IsNotEmpty()
  shopId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  productIds: number[];

  @IsInt()
  @IsNotEmpty()
  quantity: number;
} 