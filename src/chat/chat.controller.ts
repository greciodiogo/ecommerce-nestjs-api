import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Body() dto: ChatRequestDto,
    @Req() req: any,
  ): Promise<ChatResponseDto> {
    try {
      const userId = req.user?.id;
      
      const result = await this.chatService.chat({
        message: dto.message,
        sessionId: dto.sessionId,
        userId,
      });

      return result;
    } catch (error) {
      console.error('[ChatController] Error:', error);
      throw error;
    }
  }

  @Get('history/:sessionId')
  async getHistory(@Param('sessionId') sessionId: string) {
    return this.chatService.getHistory(sessionId);
  }

  @Get('sessions')
  async getSessions(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      return [];
    }
    return this.chatService.getUserSessions(userId);
  }
}
