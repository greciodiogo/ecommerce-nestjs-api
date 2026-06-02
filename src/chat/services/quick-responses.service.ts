import { Injectable } from '@nestjs/common';

interface QuickResponse {
  keywords: string[];
  response: string;
  priority: number;
}

@Injectable()
export class QuickResponsesService {
  private readonly responses: QuickResponse[] = [
    {
      keywords: ['horário', 'horarios', 'hora', 'abre', 'fecha', 'funciona', 'aberto'],
      response: 'O Encontrar Shopping funciona de segunda a sábado das 10h às 22h, e aos domingos das 14h às 20h. 🕐',
      priority: 1,
    },
    {
      keywords: ['localização', 'localizacao', 'endereço', 'endereco', 'onde', 'fica', 'local'],
      response: 'Estamos localizados na Av. Principal, 123 - Centro. Você pode ver no mapa do app! 📍',
      priority: 1,
    },
    {
      keywords: ['contato', 'telefone', 'whatsapp', 'email', 'falar'],
      response: 'Entre em contato conosco:\n📱 WhatsApp: (11) 99999-9999\n📧 Email: contato@encontrarshopping.com',
      priority: 1,
    },
    {
      keywords: ['estacionamento', 'estacionar', 'carro', 'vaga'],
      response: 'Temos estacionamento gratuito nas primeiras 2 horas! Depois disso, R$ 5,00 por hora adicional. 🚗',
      priority: 1,
    },
    {
      keywords: ['entrega', 'delivery', 'entregar', 'frete'],
      response: 'Fazemos entregas em toda a cidade! O prazo varia de 1 a 3 dias úteis. Você pode ver o valor do frete no carrinho. 📦',
      priority: 1,
    },
    {
      keywords: ['pagamento', 'pagar', 'cartão', 'cartao', 'pix', 'boleto'],
      response: 'Aceitamos: Cartão de crédito/débito, PIX, boleto e dinheiro (nas lojas físicas). 💳',
      priority: 1,
    },
    {
      keywords: ['troca', 'devolução', 'devolver', 'trocar'],
      response: 'Você tem 7 dias para trocar ou devolver produtos. Basta apresentar a nota fiscal e o produto em perfeito estado. 🔄',
      priority: 1,
    },
    {
      keywords: ['pedido', 'compra', 'rastrear', 'acompanhar'],
      response: 'Você pode acompanhar seu pedido na seção "Meus Pedidos" do app. Quer que eu busque algum pedido específico? 📱',
      priority: 2,
    },
    {
      keywords: ['promoção', 'promocao', 'desconto', 'oferta'],
      response: 'Temos várias promoções ativas! Veja na página inicial do app ou me diga que tipo de produto você procura. 🏷️',
      priority: 2,
    },
    {
      keywords: ['cadastro', 'registrar', 'criar conta'],
      response: 'Para criar sua conta, clique em "Entrar" e depois em "Criar conta". É rápido e fácil! 👤',
      priority: 1,
    },
    {
      keywords: ['senha', 'esqueci', 'recuperar', 'login'],
      response: 'Para recuperar sua senha, clique em "Esqueci minha senha" na tela de login. Você receberá um email com instruções. 🔐',
      priority: 1,
    },
    {
      keywords: ['ajuda', 'help', 'suporte', 'problema'],
      response: 'Estou aqui para ajudar! Me diga qual é sua dúvida ou problema que vou te auxiliar. 😊',
      priority: 3,
    },
    {
      keywords: ['obrigado', 'obrigada', 'valeu', 'thanks'],
      response: 'Por nada! Estou sempre aqui para ajudar. Precisa de mais alguma coisa? 😊',
      priority: 3,
    },
    {
      keywords: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite'],
      response: 'Olá! Bem-vindo ao Encontrar Shopping! Como posso ajudar você hoje? 👋',
      priority: 3,
    },
  ];

  findQuickResponse(message: string): string | null {
    const normalized = message.toLowerCase().trim();
    
    // Skip quick responses if asking about specific products/shops
    const productKeywords = ['tem', 'vende', 'vendem', 'procuro', 'quero', 'busco', 'preciso de', 'produto', 'comprar'];
    const isProductQuery = productKeywords.some((keyword) => normalized.includes(keyword));
    
    if (isProductQuery && normalized.length > 15) {
      // Let Knowledge Base handle product queries
      return null;
    }
    
    // Find matching responses
    const matches = this.responses
      .filter((response) =>
        response.keywords.some((keyword) => normalized.includes(keyword)),
      )
      .sort((a, b) => a.priority - b.priority);

    return matches.length > 0 ? matches[0].response : null;
  }

  getAllResponses(): QuickResponse[] {
    return this.responses;
  }
}
