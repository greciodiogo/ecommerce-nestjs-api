import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class OrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}
