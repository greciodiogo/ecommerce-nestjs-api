import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class ChatResponseDto {
  response: string;
  source: string;
  responseTimeMs: number;
  sessionId: string;
}
