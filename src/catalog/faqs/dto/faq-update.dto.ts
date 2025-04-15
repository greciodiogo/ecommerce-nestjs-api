import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FaqUpdateDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  question?: string;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  answer?: string;
}
