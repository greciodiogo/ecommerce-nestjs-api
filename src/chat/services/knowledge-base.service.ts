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

  async searchProducts(keywords: string[]): Promise<{ text: string; products: any[] } | null> {
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
        const price = product.price / 100;
        const formattedPrice = price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
        response += `${index + 1}. **${product.name}**\n`;
        response += `   💰 ${formattedPrice} AOA\n`;
        response += `\n`;
      });

      if (uniqueProducts.length > 5) {
        response += `... e mais ${uniqueProducts.length - 5} produto(s).\n\n`;
      }

      response += 'Quer saber mais sobre algum produto? 😊';
      
      // Return both text and structured product data
      return {
        text: response,
        products: uniqueProducts.map(p => {
          // Build image URL from first photo
          let imageUrl: string | undefined;
          if (p.photos && p.photos.length > 0) {
            const firstPhoto = p.photos[0];
            imageUrl = `/products/${p.id}/photos/${firstPhoto.id}`;
          }

          return {
            id: p.id,
            name: p.name,
            price: p.price,
            image: imageUrl,
            shopName: p.shop?.shopName,
            shopId: p.shop?.id,
            stock: p.stock,
            description: p.description,
          };
        }),
      };
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

  async search(query: string): Promise<{ text: string; products?: any[] } | null> {
    try {
      console.log('[KnowledgeBase] Searching for:', query);

      // Extract keywords - MINIMAL filtering for better matching
      // Only remove very common words that add no value
      const stopWords = ['o', 'a', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'the', 'and', 'or', 'is', 'in', 'to'];
      
      const keywords = query
        .toLowerCase()
        .split(/[\s,]+/)
        .map(word => word.trim())
        .filter(word => word.length >= 2 && !stopWords.includes(word)) // Changed from > 3 to >= 2
        .filter((word, index, self) => self.indexOf(word) === index);

      console.log('[KnowledgeBase] Keywords extracted:', keywords);

      // If we have ANY keywords, search
      if (keywords.length > 0) {
        // Try products first
        const productResult = await this.searchProducts(keywords);
        if (productResult) {
          console.log('[KnowledgeBase] Found products');
          return productResult;
        }

        // Then try shops
        const shopResult = await this.searchShops(keywords);
        if (shopResult) {
          console.log('[KnowledgeBase] Found shops');
          return { text: shopResult };
        }
      }

      console.log('[KnowledgeBase] No results found for query:', query);
      return null;
    } catch (error) {
      console.error('[KnowledgeBase] Error:', error);
      return null;
    }
  }
}
