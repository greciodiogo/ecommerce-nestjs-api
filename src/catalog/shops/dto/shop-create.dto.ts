import {
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ShopItemDto } from './shop-item.dto';
import { Exclude, Type } from 'class-transformer';
import { Column, Index } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';

export class ShopCreateDto {
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @IsNotEmptyObject({ nullable: false }, { each: true })
  @Type(() => ShopItemDto)
  products: ShopItemDto[];

  @IsString()
  @IsNotEmpty()
  shopName: string;

  @IsString()
  @IsNotEmpty()
  alvara: string;

  @IsString()
  @IsNotEmpty()
  nif: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  contactPhone: string;
  
  @IsString()
  @IsOptional()
  address?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
