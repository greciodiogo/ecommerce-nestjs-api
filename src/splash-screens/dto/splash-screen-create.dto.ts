import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SplashScreenCreateDto {
  @ApiProperty({ description: 'Título do splash screen' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Descrição do splash screen', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL da imagem' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ description: 'Ordem de exibição', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Duração em milissegundos', default: 3000 })
  @IsInt()
  @Min(1000)
  @IsOptional()
  duration?: number;

  @ApiProperty({ description: 'Se está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
