import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ShopItemDto } from './shop-item.dto';
import { Type } from 'class-transformer';

export class ShopUpdateDto {
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ShopItemDto)
  @IsOptional()
  products?: ShopItemDto[];

  @IsString()
  @IsOptional()
  shopName?: string;
  
  @IsString()
  @IsOptional()
  alvara?: string;
  
  @IsString()
  @IsOptional()
  nif?: string;

  @IsPhoneNumber()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
