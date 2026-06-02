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
      keywords: ['como vai', 'como está', 'como estas', 'tudo bem', 'how are you', 'how do you do'],
      response: 'Estou ótimo, obrigado por perguntar! Como posso ajudar você hoje? 😊',
      priority: 1,
    },
    {
      keywords: ['o que faz', 'que faz', 'o que esse app faz', 'para que serve', 'what does', 'what is this', 'app purpose'],
      response: 'Sou o Assistente Encontrar! Posso te ajudar a:\n\n🔍 Encontrar produtos\n🏪 Descobrir lojas\n⏰ Ver horários\n📍 Saber a localização\n💳 Informações sobre pagamento\n\nO que você procura? 😊',
      priority: 1,
    },
    {
      keywords: ['horário', 'horarios', 'hora', 'abre', 'fecha', 'funciona', 'aberto', 'fechado', 'opening', 'hours', 'schedule'],
      response: 'O Encontrar Shopping funciona de segunda a sábado das 10h às 22h, e aos domingos das 14h às 20h. 🕐',
      priority: 1,
    },
    {
      keywords: ['localização', 'localizacao', 'endereço', 'endereco', 'onde fica', 'local', 'location', 'address', 'where'],
      response: 'Estamos localizados na Av. Principal, 123 - Centro. Você pode ver no mapa do app! 📍',
      priority: 1,
    },
    {
      keywords: ['contato', 'contacto', 'telefone', 'whatsapp', 'email', 'falar', 'contact', 'phone', 'call'],
      response: 'Entre em contato conosco:\n📱 WhatsApp: (11) 99999-9999\n📧 Email: contato@encontrarshopping.com',
      priority: 1,
    },
    {
      keywords: ['estacionamento', 'estacionar', 'carro', 'vaga', 'parking', 'park'],
      response: 'Temos estacionamento gratuito nas primeiras 2 horas! Depois disso, R$ 5,00 por hora adicional. 🚗',
      priority: 1,
    },
    {
      keywords: ['entrega', 'delivery', 'entregar', 'frete', 'shipping', 'deliver'],
      response: 'Fazemos entregas em toda a cidade! O prazo varia de 1 a 3 dias úteis. Você pode ver o valor do frete no carrinho. 📦',
      priority: 1,
    },
    {
      keywords: ['pagamento', 'pagar', 'cartão', 'cartao', 'pix', 'boleto', 'payment', 'pay'],
      response: 'Aceitamos: Cartão de crédito/débito, PIX, boleto e dinheiro (nas lojas físicas). 💳',
      priority: 1,
    },
    {
      keywords: ['troca', 'devolução', 'devolver', 'trocar', 'return', 'exchange'],
      response: 'Você tem 7 dias para trocar ou devolver produtos. Basta apresentar a nota fiscal e o produto em perfeito estado. 🔄',
      priority: 1,
    },
    {
      keywords: ['pedido', 'compra', 'rastrear', 'acompanhar', 'order', 'track'],
      response: 'Você pode acompanhar seu pedido na seção "Meus Pedidos" do app. Quer que eu busque algum pedido específico? 📱',
      priority: 2,
    },
    {
      keywords: ['promoção', 'promocao', 'desconto', 'oferta', 'promotion', 'discount', 'sale'],
      response: 'Temos várias promoções ativas! Veja na página inicial do app ou me diga que tipo de produto você procura. 🏷️',
      priority: 2,
    },
    {
      keywords: ['cadastro', 'registrar', 'criar conta', 'register', 'sign up'],
      response: 'Para criar sua conta, clique em "Entrar" e depois em "Criar conta". É rápido e fácil! 👤',
      priority: 1,
    },
    {
      keywords: ['senha', 'esqueci', 'recuperar', 'login', 'password', 'forgot'],
      response: 'Para recuperar sua senha, clique em "Esqueci minha senha" na tela de login. Você receberá um email com instruções. 🔐',
      priority: 1,
    },
    {
      keywords: ['ajuda', 'help', 'suporte', 'problema', 'support', 'issue'],
      response: 'Estou aqui para ajudar! Me diga qual é sua dúvida ou problema que vou te auxiliar. 😊',
      priority: 3,
    },
    {
      keywords: ['obrigado', 'obrigada', 'valeu', 'thanks', 'thank you'],
      response: 'Por nada! Estou sempre aqui para ajudar. Precisa de mais alguma coisa? 😊',
      priority: 3,
    },
    {
      keywords: ['oi', 'olá', 'ola', 'hey', 'hi', 'hello', 'bom dia', 'boa tarde', 'boa noite', 'good morning', 'good afternoon'],
      response: 'Olá! Bem-vindo ao Encontrar Shopping! Como posso ajudar você hoje? 👋',
      priority: 3,
    },
  ];

  findQuickResponse(message: string): string | null {
    const normalized = message.toLowerCase().trim();
    
    // Skip quick responses if asking about specific products/shops (PT and EN)
    const productKeywords = [
      // Portuguese
      'tem', 'vende', 'vendem', 'procuro', 'quero', 'busco', 'preciso de', 'produto', 'comprar',
      // English
      'have', 'has', 'sell', 'selling', 'looking', 'want', 'need', 'product', 'buy', 'purchase'
    ];
    const isProductQuery = productKeywords.some((keyword) => normalized.includes(keyword));
    
    if (isProductQuery) {
      // Let Knowledge Base handle product queries
      return null;
    }
    
    // Extract words from message for exact matching
    const messageWords = normalized.split(/[\s,;.!?]+/).filter(w => w.length > 0);
    
    // Find matching responses using word boundaries (exact word match)
    const matches = this.responses
      .filter((response) => {
        // Check if any keyword matches any word in the message (exact match)
        return response.keywords.some((keyword) => {
          const keywordWords = keyword.split(/\s+/);
          // For multi-word keywords (e.g., "onde fica"), check if phrase exists
          if (keywordWords.length > 1) {
            return normalized.includes(keyword);
          }
          // For single-word keywords, check exact word match
          return messageWords.includes(keyword);
        });
      })
      .sort((a, b) => a.priority - b.priority);

    return matches.length > 0 ? matches[0].response : null;
  }

  getAllResponses(): QuickResponse[] {
    return this.responses;
  }
}
