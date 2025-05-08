import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SendVerificationCodeDto {
  @IsEmail()
  email: string;

  @IsOptional()
  code?: string;
}
