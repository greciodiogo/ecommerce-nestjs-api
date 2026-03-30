import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BannerCreateDto {
  @ApiProperty({ description: 'Título do banner' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição do banner', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL de destino ao clicar', required: false })
  @IsString()
  @IsOptional()
  linkUrl?: string;

  @ApiProperty({ description: 'Ordem de exibição', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Se está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
