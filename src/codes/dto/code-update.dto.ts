import { IsEmail, IsOptional } from 'class-validator';

export class CodeUpdateDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  code?: string;

  @IsOptional()
  expiresAt?: string;

  @IsOptional()
  visible?: boolean;

}
