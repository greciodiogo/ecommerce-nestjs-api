import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class ShopItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  quantity: number;
}
