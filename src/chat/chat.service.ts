import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    
    // Get or create session
    let session: ChatSession;
    if (request.sessionId) {
      session = await this.sessionRepository.findOne({
        where: { id: request.sessionId },
      });
    }
    
    if (!session) {
      session = this.sessionRepository.create({
        userId: request.userId,
        active: true,
      });
      session = await this.sessionRepository.save(session);
    }

    // Save user message
    const userMessage = this.messageRepository.create({
      sessionId: session.id,
      role: MessageRole.USER,
      content: request.message,
    });
    await this.messageRepository.save(userMessage);

    // Try hybrid strategy
    let response: string;
    let source: ResponseSource;

    try {
      // Layer 1: Quick responses (70% of cases)
      response = this.quickResponsesService.findQuickResponse(request.message);
      if (response) {
        source = ResponseSource.QUICK;
        this.logger.log(`Quick response found for: "${request.message}"`);
      } else {
        // Layer 2: Knowledge base search (20% of cases)
        response = await this.knowledgeBaseService.search(request.message);
        if (response) {
          source = ResponseSource.DATABASE;
          this.logger.log(`Database response found for: "${request.message}"`);
        } else {
          // Layer 3: AI (10% of cases)
          if (this.geminiAIService.isConfigured()) {
            const context = await this.buildContext(session.id, request.userId);
            response = await this.geminiAIService.chat(request.message, context);
            source = ResponseSource.AI;
            this.logger.log(`AI response generated for: "${request.message}"`);
          } else {
            // Fallback if AI not configured
            response = 'Desculpe, não entendi sua pergunta. Pode reformular ou perguntar sobre horários, localização, produtos ou lojas? 😊';
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

    // Save assistant message
    const assistantMessage = this.messageRepository.create({
      sessionId: session.id,
      role: MessageRole.ASSISTANT,
      content: response,
      source,
      responseTimeMs,
    });
    await this.messageRepository.save(assistantMessage);

    return {
      response,
      source,
      responseTimeMs,
      sessionId: session.id,
    };
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
