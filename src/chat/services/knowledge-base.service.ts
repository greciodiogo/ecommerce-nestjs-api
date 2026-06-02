import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../../catalog/products/models/product.entity';
import { Shop } from '../../catalog/shops/models/shop.entity';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async searchProducts(keywords: string[]): Promise<string | null> {
    try {
      console.log('[KnowledgeBase] Searching products for keywords:', keywords);
      
      // Build OR conditions for each keyword
      const whereConditions = keywords.flatMap(keyword => [
        { name: ILike(`%${keyword}%`) },
        { description: ILike(`%${keyword}%`) },
      ]);

      const products = await this.productRepository.find({
        where: whereConditions,
        take: 10, // Increased to show more results
        relations: ['shop'],
      });

      console.log('[KnowledgeBase] Found products:', products.length);

      if (products.length === 0) return null;

      // Remove duplicates by id
      const uniqueProducts = Array.from(
        new Map(products.map(p => [p.id, p])).values()
      );

      let response = `Encontrei ${uniqueProducts.length} produto(s):\n\n`;
      
      uniqueProducts.slice(0, 5).forEach((product, index) => {
        response += `${index + 1}. **${product.name}**\n`;
        response += `   💰 ${(product.price / 100).toFixed(2)} AOA\n`;
        if (product.shop) {
          response += `   🏪 ${product.shop.shopName}\n`;
        }
        response += `\n`;
      });

      if (uniqueProducts.length > 5) {
        response += `... e mais ${uniqueProducts.length - 5} produto(s).\n\n`;
      }

      response += 'Quer saber mais sobre algum produto? 😊';
      
      return response;
    } catch (error) {
      console.error('[KnowledgeBase] Error searching products:', error);
      return null;
    }
  }

  async searchShops(keywords: string[]): Promise<string | null> {
    try {
      console.log('[KnowledgeBase] Searching shops for keywords:', keywords);
      
      // Build OR conditions for each keyword
      const whereConditions = keywords.flatMap(keyword => [
        { shopName: ILike(`%${keyword}%`) },
        { address: ILike(`%${keyword}%`) },
      ]);

      const shops = await this.shopRepository.find({
        where: whereConditions,
        take: 10,
      });

      console.log('[KnowledgeBase] Found shops:', shops.length);

      if (shops.length === 0) return null;

      // Remove duplicates by id
      const uniqueShops = Array.from(
        new Map(shops.map(s => [s.id, s])).values()
      );

      let response = `Encontrei ${uniqueShops.length} loja(s):\n\n`;
      
      uniqueShops.slice(0, 5).forEach((shop, index) => {
        response += `${index + 1}. **${shop.shopName}**\n`;
        if (shop.address) {
          response += `   📍 ${shop.address}\n`;
        }
        if (shop.contactPhone) {
          response += `   📞 ${shop.contactPhone}\n`;
        }
        response += `\n`;
      });

      if (uniqueShops.length > 5) {
        response += `... e mais ${uniqueShops.length - 5} loja(s).\n\n`;
      }

      return response;
    } catch (error) {
      console.error('[KnowledgeBase] Error searching shops:', error);
      return null;
    }
  }

  async search(query: string): Promise<string | null> {
    try {
      // Extract keywords from query (remove common words in PT and EN)
      const stopWords = [
        // Portuguese
        'tem', 'vende', 'vendem', 'procuro', 'quero', 'busco', 'preciso', 'de', 'um', 'uma', 'o', 'a', 'os', 'as', 'para', 'com', 'sem', 'aqui', 'ai', 'aí', 'e', 'ou', 'que', 'esse', 'esse', 'isso', 'esta', 'está', 'como', 'vai', 'faz', 'fazer', 'app', 'aplicativo',
        // English
        'have', 'has', 'sell', 'selling', 'looking', 'want', 'need', 'search', 'searching', 'for', 'the', 'and', 'or', 'with', 'without', 'here', 'there', 'what', 'how', 'does', 'app', 'application', 'this', 'that'
      ];
      
      const keywords = query
        .toLowerCase()
        .split(/[\s,]+/) // Split by spaces or commas
        .filter(word => word.length > 3 && !stopWords.includes(word)) // Minimum 4 characters
        .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates

      console.log('[KnowledgeBase] Original query:', query);
      console.log('[KnowledgeBase] Extracted keywords:', keywords);

      // If no valid keywords, it's probably a general question
      if (keywords.length === 0) return null;

      // Try products first
      const productResult = await this.searchProducts(keywords);
      if (productResult) return productResult;

      // Then try shops
      const shopResult = await this.searchShops(keywords);
      if (shopResult) return shopResult;

      return null;
    } catch (error) {
      console.error('[KnowledgeBase] Error searching:', error);
      return null;
    }
  }
}
