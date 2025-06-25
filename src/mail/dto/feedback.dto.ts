import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class FeedbackDto {
  @ApiProperty({
    description: 'O e-mail do remetente.',
    example: 'cliente@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'O assunto da mensagem.',
    example: 'Problema com o meu pedido',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'O corpo da mensagem de feedback.',
    example: 'Gostaria de reportar um problema...',
  })
  @IsString()
  @IsNotEmpty()
  body: string;
} 