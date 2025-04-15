import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FaqCreateDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsString()
  @IsNotEmpty()
  answer: string;
}
