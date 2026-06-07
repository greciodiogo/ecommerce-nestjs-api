import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, MessageRole, ResponseSource } from './entities/chat-message.entity';
import { QuickResponsesService } from './services/quick-responses.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { GeminiAIService } from './services/gemini-ai.service';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: number;
}

export interface ChatResponse {
  response: string;
  source: ResponseSource;
  responseTimeMs: number;
  sessionId: string;
  products?: Array<{
    id: number;
    name: string;
    price: number;
    image?: string;
    shopName?: string;
    shopId?: number;
    stock?: number;
    description?: string;
  }>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly quickResponsesService: QuickResponsesService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly geminiAIService: GeminiAIService,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    let sessionId = request.sessionId || crypto.randomBytes(16).toString('hex');
    
    try {
      // Get or create session
      let session: ChatSession;
      if (request.sessionId) {
        try {
          session = await this.sessionRepository.findOne({
            where: { id: request.sessionId },
          });
        } catch (dbError) {
          this.logger.error('Database error finding session:', dbError);
          // Continue without session if DB fails
        }
      }
      
      if (!session && this.sessionRepository) {
        try {
          session = this.sessionRepository.create({
            userId: request.userId,
            active: true,
          });
          session = await this.sessionRepository.save(session);
          sessionId = session.id;
        } catch (dbError) {
          this.logger.error('Database error creating session:', dbError);
          // Continue without saving session if DB fails
        }
      }

      // Save user message (try, but don't fail if it doesn't work)
      if (session && this.messageRepository) {
        try {
          const userMessage = this.messageRepository.create({
            sessionId: session.id,
            role: MessageRole.USER,
            content: request.message,
          });
          await this.messageRepository.save(userMessage);
        } catch (dbError) {
          this.logger.error('Database error saving user message:', dbError);
          // Continue without saving if DB fails
        }
      }

      // Try hybrid strategy with better prioritization
      let response: string;
      let source: ResponseSource;
      let products: any[] | undefined;

      try {
        // Layer 1: Quick responses (ONLY for greetings and FAQs - 40% of cases)
        response = this.quickResponsesService.findQuickResponse(request.message);
        if (response) {
          source = ResponseSource.QUICK;
          this.logger.log(`✅ Quick response found for: "${request.message}"`);
        } else {
          // Layer 2: Knowledge base search (for product/shop queries - 40% of cases)
          try {
            const kbResult = await this.knowledgeBaseService.search(request.message);
            if (kbResult) {
              response = kbResult.text;
              products = kbResult.products;
              source = ResponseSource.DATABASE;
              this.logger.log(`✅ Knowledge base response found for: "${request.message}" with ${products?.length || 0} products`);
            }
          } catch (kbError) {
            this.logger.error('Knowledge base error:', kbError);
            response = null;
          }
          
          if (!response) {
            // Layer 3: AI for complex queries (20% of cases)
            if (this.geminiAIService.isConfigured()) {
              try {
                const context = session ? await this.buildContext(session.id, request.userId) : 'Primeira interação';
                response = await this.geminiAIService.chat(request.message, context);
                source = ResponseSource.AI;
                this.logger.log(`✅ AI response generated for: "${request.message}"`);
              } catch (aiError) {
                this.logger.error('AI error:', aiError);
                response = null;
              }
            }
            
            if (!response) {
              // Fallback if everything fails
              response = `Hmm, não consegui encontrar uma resposta específica para "${request.message}". 

Posso ajudar com:
🔍 Buscar produtos (ex: "tem vinho", "quanto custa cerveja")
🏆 Comparar preços (ex: "qual é o mais caro")
🏪 Encontrar lojas
⏰ Horários do shopping
📍 Localização

O que você gostaria de saber? 😊`;
              source = ResponseSource.QUICK;
            }
          }
        }
      } catch (error) {
        this.logger.error('Error generating response:', error);
        response = 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente? 😅';
        source = ResponseSource.QUICK;
      }

      const responseTimeMs = Date.now() - startTime;

      // Save assistant message (try, but don't fail if it doesn't work)
      if (session && this.messageRepository) {
        try {
          const assistantMessage = this.messageRepository.create({
            sessionId: session.id,
            role: MessageRole.ASSISTANT,
            content: response,
            source,
            responseTimeMs,
          });
          await this.messageRepository.save(assistantMessage);
        } catch (dbError) {
          this.logger.error('Database error saving assistant message:', dbError);
          // Continue without saving if DB fails
        }
      }

      return {
        response,
        source,
        responseTimeMs,
        sessionId,
        products,
      };
    } catch (error) {
      this.logger.error('Critical error in chat service:', error);
      // Return a basic response even if everything fails
      return {
        response: 'Olá! Como posso ajudar você hoje? 👋',
        source: ResponseSource.QUICK,
        responseTimeMs: Date.now() - startTime,
        sessionId,
      };
    }
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getUserSessions(userId: number): Promise<ChatSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 10,
    });
  }

  private async buildContext(sessionId: string, userId?: number): Promise<string> {
    const recentMessages = await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    if (recentMessages.length === 0) return 'Primeira interação';

    const context = recentMessages
      .reverse()
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `Histórico recente:\n${context}`;
  }
}
