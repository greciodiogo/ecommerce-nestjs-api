import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product } from '../../catalog/products/models/product.entity';

@Injectable()
export class GeminiAIService {
  private readonly logger = new Logger(GeminiAIService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
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

    // Get product data to give context to AI
    const productContext = await this.getProductContext(message);

    const prompt = `
Você é um assistente virtual do Encontrar Shopping, um marketplace online em Angola.

${productContext ? `DADOS DOS PRODUTOS DISPONÍVEIS:\n${productContext}\n` : ''}

Contexto da conversa: ${context || 'Primeira interação'}

Regras importantes:
- Responda SEMPRE em português
- Seja amigável, prestativo e conciso (máximo 3-4 linhas)
- Use emojis quando apropriado  
- Use os dados dos produtos fornecidos acima para responder com precisão
- Preços estão em AOA (Kwanzas Angolanos)
- Se perguntarem sobre "mais caro", "mais barato", etc, analise os preços dos produtos
- Se não houver produtos relevantes nos dados, diga que não encontrou
- Não invente informações - use APENAS os dados fornecidos
- Foque em: produtos, preços, lojas, comparações

Mensagem do usuário: ${message}

Responda de forma útil e baseada nos dados:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  private async getProductContext(message: string): Promise<string | null> {
    try {
      // Get top 20 products to give context to AI
      const products = await this.productRepository.find({
        where: { visible: true },
        relations: ['shop'],
        take: 20,
        order: { price: 'DESC' }, // Start with most expensive for "mais caro" queries
      });

      if (products.length === 0) return null;

      const productList = products
        .map(p => `- ${p.name}: ${(p.price / 100).toFixed(2)} AOA (Loja: ${p.shop?.shopName || 'N/A'})`)
        .join('\n');

      return productList;
    } catch (error) {
      this.logger.error('Error fetching product context:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return !!this.model;
  }
}
