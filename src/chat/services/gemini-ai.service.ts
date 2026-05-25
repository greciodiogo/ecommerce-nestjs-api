import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiAIService {
  private readonly logger = new Logger(GeminiAIService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
    } else {
      this.logger.warn('GEMINI_API_KEY not configured. AI responses will be disabled.');
    }
  }

  async chat(message: string, context?: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI not configured');
    }

    const prompt = `
Você é um assistente virtual do Encontrar Shopping, um marketplace online.

Contexto do usuário: ${context || 'Nenhum contexto adicional'}

Regras:
- Responda em português brasileiro
- Seja amigável, prestativo e conciso
- Use emojis quando apropriado
- Se não souber algo, seja honesto
- Foque em ajudar com produtos, lojas, pedidos e navegação no app
- Não invente informações sobre produtos ou preços

Mensagem do usuário: ${message}

Responda de forma útil e amigável:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.model;
  }
}
