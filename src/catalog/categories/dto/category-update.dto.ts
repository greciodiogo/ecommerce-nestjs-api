import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CategoryGroupDto } from './category-group.dto';
import { Type } from 'class-transformer';

export class CategoryUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  service_fee?: number;

  @IsOptional()
  parentCategoryId?: number;

  @IsOptional()
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @IsNotEmptyObject({ nullable: false }, { each: true })
  @Type(() => CategoryGroupDto)
  groups?: CategoryGroupDto[];
}
