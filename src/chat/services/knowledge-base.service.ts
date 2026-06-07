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
      console.log('🔍 [KnowledgeBase] ========================================');
      console.log('🔍 [KnowledgeBase] Searching products for keywords:', keywords);
      
      if (keywords.length === 0) {
        console.log('🔍 [KnowledgeBase] ❌ No keywords provided');
        return null;
      }
      
      // Build proper OR query using QueryBuilder for better control
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.shop', 'shop')
        .leftJoinAndSelect('product.photos', 'photos'); // Add photos relation

      // Add WHERE conditions with OR between them
      // Build dynamic where clause for first keyword
      const firstKeyword = keywords[0];
      queryBuilder.where(
        '(LOWER(product.name) LIKE :keyword0_name OR LOWER(product.description) LIKE :keyword0_desc)',
        {
          keyword0_name: `%${firstKeyword.toLowerCase()}%`,
          keyword0_desc: `%${firstKeyword.toLowerCase()}%`,
        },
      );

      // Add OR conditions for remaining keywords
      keywords.slice(1).forEach((keyword, index) => {
        const paramIndex = index + 1;
        queryBuilder.orWhere(
          `(LOWER(product.name) LIKE :keyword${paramIndex}_name OR LOWER(product.description) LIKE :keyword${paramIndex}_desc)`,
          {
            [`keyword${paramIndex}_name`]: `%${keyword.toLowerCase()}%`,
            [`keyword${paramIndex}_desc`]: `%${keyword.toLowerCase()}%`,
          },
        );
      });

      // Order by: products with keyword in name come first, then by stock, then by ID
      queryBuilder.addOrderBy(
        `CASE WHEN LOWER(product.name) LIKE :orderKeyword THEN 0 ELSE 1 END`,
        'ASC',
      );
      queryBuilder.setParameter('orderKeyword', `%${firstKeyword.toLowerCase()}%`);
      queryBuilder.addOrderBy('product.stock', 'DESC');
      queryBuilder.addOrderBy('product.id', 'DESC');

      // Log the SQL query for debugging with parameters
      console.log('🔍 [KnowledgeBase] SQL Query:', queryBuilder.getSql());
      console.log('🔍 [KnowledgeBase] Parameters:', queryBuilder.getParameters());

      const products = await queryBuilder
        .limit(10)
        .getMany();

      console.log('🔍 [KnowledgeBase] SQL Query executed');
      console.log('🔍 [KnowledgeBase] Found products:', products.length);
      if (products.length > 0) {
        console.log('🔍 [KnowledgeBase] Products found:', products.map(p => ({ id: p.id, name: p.name })));
      }

      if (products.length === 0) {
        console.log('🔍 [KnowledgeBase] ❌ No products found for keywords:', keywords);
        console.log('🔍 [KnowledgeBase] ========================================');
        return null;
      }

      // Remove duplicates by id
      const uniqueProducts = Array.from(
        new Map(products.map(p => [p.id, p])).values()
      );

      console.log('🔍 [KnowledgeBase] Unique products after dedup:', uniqueProducts.length);

      // Simplified response - just the count, no list (cards will show the products)
      let response = `Encontrei ${uniqueProducts.length} produto(s) 🛍️`;
      
      if (uniqueProducts.length > 5) {
        response += `\n\nMostrando os primeiros 5 resultados. Role para ver mais! ⬇️`;
      }
      
      console.log('🔍 [KnowledgeBase] ✅ Returning', uniqueProducts.length, 'products');
      console.log('🔍 [KnowledgeBase] ========================================');
      
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
      console.error('❌ [KnowledgeBase] Error searching products:', error);
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
      console.log('🔍 [KnowledgeBase] ========================================');
      console.log('🔍 [KnowledgeBase] Original query:', query);

      // Extract keywords - IMPROVED filtering
      // Remove common Portuguese question words and very generic terms
      const stopWords = [
        'o', 'a', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'por', 'um', 'uma',
        'tem', 'há', 'existe', 'quero', 'preciso', 'qual', 'onde', 'quando', 'como',
        'the', 'and', 'or', 'is', 'in', 'to', 'have', 'has', 'want', 'need',
      ];
      
      const keywords = query
        .toLowerCase()
        // Remove emojis and special characters, keep only letters, numbers and spaces
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .split(/[\s,]+/)
        .map(word => word.trim())
        .filter(word => word.length >= 3) // Minimum 3 characters to avoid too generic searches
        .filter(word => !stopWords.includes(word))
        .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates

      console.log('🔍 [KnowledgeBase] Keywords extracted:', keywords);

      // If we have ANY keywords, search
      if (keywords.length > 0) {
        // Try products first
        const productResult = await this.searchProducts(keywords);
        if (productResult) {
          console.log('🔍 [KnowledgeBase] ✅ Found products');
          console.log('🔍 [KnowledgeBase] ========================================');
          return productResult;
        }

        // Then try shops
        const shopResult = await this.searchShops(keywords);
        if (shopResult) {
          console.log('🔍 [KnowledgeBase] ✅ Found shops');
          console.log('🔍 [KnowledgeBase] ========================================');
          return { text: shopResult };
        }
      }

      console.log('🔍 [KnowledgeBase] ❌ No results found for query:', query);
      console.log('🔍 [KnowledgeBase] ========================================');
      return null;
    } catch (error) {
      console.error('❌ [KnowledgeBase] Error:', error);
      return null;
    }
  }
}
