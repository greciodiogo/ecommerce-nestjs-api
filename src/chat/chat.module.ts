import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { QuickResponsesService } from './services/quick-responses.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { GeminiAIService } from './services/gemini-ai.service';
import { Product } from '../catalog/products/models/product.entity';
import { Shop } from '../catalog/shops/models/shop.entity';
import { Promotion } from '../catalog/promotions/models/promotion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatSession,
      ChatMessage,
      Product,
      Shop,
      Promotion,
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    QuickResponsesService,
    KnowledgeBaseService,
    GeminiAIService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
