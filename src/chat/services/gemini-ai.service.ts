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
- Responda SEMPRE em português angolano
- Seja amigável, prestativo e conciso (máximo 2-3 linhas)
- Use emojis quando apropriado 😊🛍️💰
- Use os dados dos produtos fornecidos acima para responder com EXATIDÃO
- Preços estão em AOA (Kwanzas Angolanos) e já estão divididos por 100
- Para perguntas como "qual é o produto mais caro", "mais barato", analise os preços e responda com o produto específico
- Para perguntas sobre "quanto custa X", busque X nos produtos e retorne o preço
- Se perguntarem sobre disponibilidade ("tem vinho?", "vendem cerveja?"), procure nos nomes dos produtos
- Se não houver produtos relevantes nos dados, diga que não encontrou mas que pode ajudar com outra coisa
- Não invente preços ou produtos - use APENAS os dados fornecidos
- Seja específico: mencione nomes de produtos e preços exatos quando relevante
- Foque em: produtos, preços, lojas, comparações, disponibilidade

Exemplos de respostas boas:
- "O produto mais caro é o [Nome] por [Preço] AOA 💰"
- "Sim, temos [Produto] por [Preço] AOA na loja [Nome] 🍷"
- "Encontrei [Produto] e [Produto2], custam entre [Preço1] e [Preço2] AOA 🛍️"

Mensagem do usuário: ${message}

Responda de forma útil, específica e baseada nos dados:`;

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
      const normalizedMessage = message.toLowerCase();
      
      // Detect query type and fetch relevant products
      let products: Product[];
      
      if (normalizedMessage.includes('caro') || normalizedMessage.includes('expensive') || normalizedMessage.includes('mais custa')) {
        // Get most expensive products
        products = await this.productRepository.find({
          where: { visible: true },
          relations: ['shop'],
          take: 30,
          order: { price: 'DESC' },
        });
      } else if (normalizedMessage.includes('barato') || normalizedMessage.includes('cheap') || normalizedMessage.includes('menos custa')) {
        // Get cheapest products
        products = await this.productRepository.find({
          where: { visible: true },
          relations: ['shop'],
          take: 30,
          order: { price: 'ASC' },
        });
      } else {
        // Get a diverse sample of products
        products = await this.productRepository.find({
          where: { visible: true },
          relations: ['shop'],
          take: 30,
        });
      }

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
