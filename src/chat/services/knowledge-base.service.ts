import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product } from '../../catalog/products/models/product.entity';
import { Shop } from '../../catalog/shops/models/shop.entity';
import { Promotion } from '../../catalog/promotions/models/promotion.entity';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  async searchPromotions(): Promise<{ text: string; products: any[] } | null> {
    try {
      console.log('🎉 [KnowledgeBase] ========================================');
      console.log('🎉 [KnowledgeBase] Searching for active promotions');
      
      const now = new Date();
      
      // Find all active promotions
      const activePromotions = await this.promotionRepository.find({
        where: {
          isActive: true,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
        },
        relations: ['products', 'products.shop', 'products.photos'],
      });

      console.log('🎉 [KnowledgeBase] Found active promotions:', activePromotions.length);

      if (activePromotions.length === 0) {
        console.log('🎉 [KnowledgeBase] ❌ No active promotions found');
        console.log('🎉 [KnowledgeBase] ========================================');
        return {
          text: 'Não temos produtos em promoção no momento. 😔\n\nMas fique atento! Em breve teremos novas ofertas! 🎁',
          products: [],
        };
      }

      // Collect all products from active promotions
      const allProducts: Product[] = [];
      const productPromotionMap = new Map<number, { promotion: Promotion; discount: number }>();

      activePromotions.forEach(promotion => {
        if (promotion.products && promotion.products.length > 0) {
          promotion.products.forEach(product => {
            // Only include visible products with stock
            if (product.visible && product.stock > 0) {
              allProducts.push(product);
              productPromotionMap.set(product.id, {
                promotion,
                discount: Number(promotion.discount),
              });
            }
          });
        }
      });

      console.log('🎉 [KnowledgeBase] Total products in promotions:', allProducts.length);

      if (allProducts.length === 0) {
        console.log('🎉 [KnowledgeBase] ❌ No visible products in promotions');
        console.log('🎉 [KnowledgeBase] ========================================');
        return {
          text: 'Não temos produtos em promoção disponíveis no momento. 😔',
          products: [],
        };
      }

      // Remove duplicates by id
      const uniqueProducts = Array.from(
        new Map(allProducts.map(p => [p.id, p])).values()
      );

      console.log('🎉 [KnowledgeBase] Unique products after dedup:', uniqueProducts.length);

      const response = `Encontrei ${uniqueProducts.length} produto(s) em promoção! 🎉🔥\n\nAproveite os descontos! 💰`;
      
      console.log('🎉 [KnowledgeBase] ✅ Returning', uniqueProducts.length, 'promotional products');
      console.log('🎉 [KnowledgeBase] ========================================');
      
      // Return both text and structured product data with promotional prices
      return {
        text: response,
        products: uniqueProducts.map(p => {
          const promotionData = productPromotionMap.get(p.id);
          const discount = promotionData?.discount || 0;
          const originalPrice = p.price;
          const promotionalPrice = originalPrice * (1 - discount / 100);

          // Build image URL from first photo
          let imageUrl: string | undefined;
          if (p.photos && p.photos.length > 0) {
            const firstPhoto = p.photos[0];
            imageUrl = `/products/${p.id}/photos/${firstPhoto.id}`;
          }

          return {
            id: p.id,
            name: p.name,
            price: promotionalPrice, // Use promotional price
            originalPrice: originalPrice, // Keep original for display
            discountPercentage: discount,
            image: imageUrl,
            shopName: p.shop?.shopName,
            shopId: p.shop?.id,
            stock: p.stock,
            description: p.description,
            hasActivePromotion: true,
          };
        }),
      };
    } catch (error) {
      console.error('❌ [KnowledgeBase] Error searching promotions:', error);
      return null;
    }
  }

  async searchProducts(keywords: string[]): Promise<{ text: string; products: any[]; keywords?: string[]; searchType?: 'products' } | null> {
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

      // Only show visible products with stock > 0
      queryBuilder.andWhere('product.visible = :visible', { visible: true });
      queryBuilder.andWhere('product.stock > :minStock', { minStock: 0 });

      // Add WHERE conditions with OR between them
      // Build dynamic where clause for first keyword
      const firstKeyword = keywords[0];
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE :keyword0_name OR LOWER(COALESCE(product.description, \'\')) LIKE :keyword0_desc)',
        {
          keyword0_name: `%${firstKeyword.toLowerCase()}%`,
          keyword0_desc: `%${firstKeyword.toLowerCase()}%`,
        },
      );

      // Add OR conditions for remaining keywords
      keywords.slice(1).forEach((keyword, index) => {
        const paramIndex = index + 1;
        queryBuilder.orWhere(
          `(LOWER(product.name) LIKE :keyword${paramIndex}_name OR LOWER(COALESCE(product.description, '')) LIKE :keyword${paramIndex}_desc)`,
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
        keywords, // Return keywords for context
        searchType: 'products' as const,
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

  async search(
    query: string,
    contextKeywords?: string[],
    contextProductIds?: number[],
  ): Promise<{ 
    text: string; 
    products?: any[];
    keywords?: string[];
    searchType?: 'products' | 'shops' | 'promotions' | 'expensive' | 'cheap';
  } | null> {
    try {
      console.log('🔍 [KnowledgeBase] ========================================');
      console.log('🔍 [KnowledgeBase] Original query:', query);
      console.log('🔍 [KnowledgeBase] Context keywords:', contextKeywords);
      console.log('🔍 [KnowledgeBase] Context product IDs:', contextProductIds);

      const queryLower = query.toLowerCase();

      // Check if user is asking about promotions
      const promotionKeywords = ['promoção', 'promoções', 'promocao', 'promocoes', 'desconto', 'descontos', 'oferta', 'ofertas'];
      const isPromotionQuery = promotionKeywords.some(keyword => queryLower.includes(keyword));

      if (isPromotionQuery) {
        console.log('🎉 [KnowledgeBase] Detected promotion query');
        const promotionResult = await this.searchPromotions();
        if (promotionResult) {
          return {
            ...promotionResult,
            searchType: 'promotions',
          };
        }
      }

      // Check if user is asking for most expensive products
      const expensiveKeywords = ['mais caro', 'mais caros', 'caro', 'caros', 'preço alto', 'mais expensive'];
      const isExpensiveQuery = expensiveKeywords.some(keyword => queryLower.includes(keyword));

      if (isExpensiveQuery) {
        console.log('💎 [KnowledgeBase] Detected expensive query - searching by highest price');
        
        // USE CONTEXT: if we have context keywords/products, search within them
        if (contextKeywords && contextKeywords.length > 0) {
          console.log('💎 [KnowledgeBase] Using context keywords:', contextKeywords);
          return await this.searchMostExpensive(contextKeywords);
        } else if (contextProductIds && contextProductIds.length > 0) {
          console.log('💎 [KnowledgeBase] Using context product IDs:', contextProductIds);
          return await this.searchMostExpensiveFromIds(contextProductIds);
        } else {
          return await this.searchMostExpensive();
        }
      }

      // Check if user is asking for cheapest products
      const cheapKeywords = ['mais barato', 'mais baratos', 'barato', 'baratos', 'preço baixo', 'em conta'];
      const isCheapQuery = cheapKeywords.some(keyword => queryLower.includes(keyword));

      if (isCheapQuery) {
        console.log('💰 [KnowledgeBase] Detected cheap query - searching by lowest price');
        
        // USE CONTEXT: if we have context keywords/products, search within them
        if (contextKeywords && contextKeywords.length > 0) {
          console.log('💰 [KnowledgeBase] Using context keywords:', contextKeywords);
          return await this.searchCheapest(contextKeywords);
        } else if (contextProductIds && contextProductIds.length > 0) {
          console.log('💰 [KnowledgeBase] Using context product IDs:', contextProductIds);
          return await this.searchCheapestFromIds(contextProductIds);
        } else {
          return await this.searchCheapest();
        }
      }

      // Extract keywords - IMPROVED filtering
      // Remove common Portuguese question words and very generic terms
      const stopWords = [
        'o', 'a', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'por', 'um', 'uma',
        'tem', 'há', 'existe', 'quero', 'preciso', 'qual', 'onde', 'quando', 'como',
        'the', 'and', 'or', 'is', 'in', 'to', 'have', 'has', 'want', 'need',
        'me', 'mostrar', 'mostre', 'ver', 'buscar', 'procurar', 'encontrar', 'achar',
      ];
      
      const keywords = query
        .toLowerCase()
        // Remove emojis and special characters, keep only letters, numbers and spaces
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .split(/[\s,]+/)
        .map(word => word.trim())
        .filter(word => word.length >= 2) // CHANGED: Minimum 2 characters (was 3) - allows "tv", "pc", etc
        .filter(word => !stopWords.includes(word))
        .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates

      console.log('🔍 [KnowledgeBase] Keywords extracted:', keywords);
      console.log('🔍 [KnowledgeBase] Keywords count:', keywords.length);

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
      } else {
        // No keywords extracted - try searching with original query as single keyword
        console.log('🔍 [KnowledgeBase] No keywords extracted, using original query');
        const singleKeyword = query.toLowerCase().trim();
        
        if (singleKeyword.length >= 2) {
          const productResult = await this.searchProducts([singleKeyword]);
          if (productResult) {
            console.log('🔍 [KnowledgeBase] ✅ Found products with original query');
            console.log('🔍 [KnowledgeBase] ========================================');
            return productResult;
          }

          const shopResult = await this.searchShops([singleKeyword]);
          if (shopResult) {
            console.log('🔍 [KnowledgeBase] ✅ Found shops with original query');
            console.log('🔍 [KnowledgeBase] ========================================');
            return { text: shopResult };
          }
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

  async searchMostExpensive(keywords?: string[]): Promise<{ text: string; products: any[]; searchType: 'expensive' } | null> {
    try {
      console.log('💎 [KnowledgeBase] ========================================');
      console.log('💎 [KnowledgeBase] Searching for most expensive products');
      if (keywords) {
        console.log('💎 [KnowledgeBase] Filtering by keywords:', keywords);
      }
      
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.shop', 'shop')
        .leftJoinAndSelect('product.photos', 'photos')
        .where('product.visible = :visible', { visible: true })
        .andWhere('product.price > :minPrice', { minPrice: 0 });

      // If keywords provided, filter by them
      if (keywords && keywords.length > 0) {
        const keywordConditions = keywords.map((keyword, index) => {
          const paramName = `keyword${index}`;
          queryBuilder.setParameter(`${paramName}_name`, `%${keyword.toLowerCase()}%`);
          queryBuilder.setParameter(`${paramName}_desc`, `%${keyword.toLowerCase()}%`);
          return `(LOWER(product.name) LIKE :${paramName}_name OR LOWER(COALESCE(product.description, '')) LIKE :${paramName}_desc)`;
        });
        queryBuilder.andWhere(`(${keywordConditions.join(' OR ')})`);
      }

      const products = await queryBuilder
        .orderBy('product.price', 'DESC') // Order by price DESCENDING
        .limit(10)
        .getMany();

      console.log('💎 [KnowledgeBase] Found products:', products.length);
      if (products.length > 0) {
        console.log('💎 [KnowledgeBase] Top 3 prices:', products.slice(0, 3).map(p => ({ name: p.name, price: p.price })));
      }

      if (products.length === 0) {
        console.log('💎 [KnowledgeBase] ❌ No products found');
        console.log('💎 [KnowledgeBase] ========================================');
        return null;
      }

      const response = `Encontrei ${products.length} produto(s) 💎\n\nOrdenados do mais caro para o mais barato! 📊`;
      
      console.log('💎 [KnowledgeBase] ✅ Returning', products.length, 'products');
      console.log('💎 [KnowledgeBase] ========================================');
      
      return {
        text: response,
        searchType: 'expensive' as const,
        products: products.map(p => {
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
      console.error('❌ [KnowledgeBase] Error searching most expensive:', error);
      return null;
    }
  }

  async searchMostExpensiveFromIds(productIds: number[]): Promise<{ text: string; products: any[]; searchType: 'expensive' } | null> {
    try {
      console.log('💎 [KnowledgeBase] ========================================');
      console.log('💎 [KnowledgeBase] Searching for most expensive from specific IDs:', productIds);
      
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.shop', 'shop')
        .leftJoinAndSelect('product.photos', 'photos')
        .where('product.id IN (:...ids)', { ids: productIds })
        .orderBy('product.price', 'DESC')
        .getMany();

      console.log('💎 [KnowledgeBase] Found products:', products.length);
      if (products.length > 0) {
        console.log('💎 [KnowledgeBase] Top 3 prices:', products.slice(0, 3).map(p => ({ name: p.name, price: p.price })));
      }

      if (products.length === 0) {
        console.log('💎 [KnowledgeBase] ❌ No products found');
        console.log('💎 [KnowledgeBase] ========================================');
        return null;
      }

      const response = `Encontrei ${products.length} produto(s) 💎\n\nOrdenados do mais caro para o mais barato! 📊`;
      
      console.log('💎 [KnowledgeBase] ✅ Returning', products.length, 'products');
      console.log('💎 [KnowledgeBase] ========================================');
      
      return {
        text: response,
        searchType: 'expensive' as const,
        products: products.map(p => {
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
      console.error('❌ [KnowledgeBase] Error searching most expensive from IDs:', error);
      return null;
    }
  }

  async searchCheapest(keywords?: string[]): Promise<{ text: string; products: any[]; searchType: 'cheap' } | null> {
    try {
      console.log('💰 [KnowledgeBase] ========================================');
      console.log('💰 [KnowledgeBase] Searching for cheapest products');
      if (keywords) {
        console.log('💰 [KnowledgeBase] Filtering by keywords:', keywords);
      }
      
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.shop', 'shop')
        .leftJoinAndSelect('product.photos', 'photos')
        .where('product.visible = :visible', { visible: true })
        .andWhere('product.price > :minPrice', { minPrice: 0 });

      // If keywords provided, filter by them
      if (keywords && keywords.length > 0) {
        const keywordConditions = keywords.map((keyword, index) => {
          const paramName = `keyword${index}`;
          queryBuilder.setParameter(`${paramName}_name`, `%${keyword.toLowerCase()}%`);
          queryBuilder.setParameter(`${paramName}_desc`, `%${keyword.toLowerCase()}%`);
          return `(LOWER(product.name) LIKE :${paramName}_name OR LOWER(COALESCE(product.description, '')) LIKE :${paramName}_desc)`;
        });
        queryBuilder.andWhere(`(${keywordConditions.join(' OR ')})`);
      }

      const products = await queryBuilder
        .orderBy('product.price', 'ASC') // Order by price ASCENDING
        .limit(10)
        .getMany();

      console.log('💰 [KnowledgeBase] Found products:', products.length);
      if (products.length > 0) {
        console.log('💰 [KnowledgeBase] Top 3 prices:', products.slice(0, 3).map(p => ({ name: p.name, price: p.price })));
      }

      if (products.length === 0) {
        console.log('💰 [KnowledgeBase] ❌ No products found');
        console.log('💰 [KnowledgeBase] ========================================');
        return null;
      }

      const response = `Encontrei ${products.length} produto(s) 💰\n\nOrdenados do mais barato para o mais caro! 📊`;
      
      console.log('💰 [KnowledgeBase] ✅ Returning', products.length, 'products');
      console.log('💰 [KnowledgeBase] ========================================');
      
      return {
        text: response,
        searchType: 'cheap' as const,
        products: products.map(p => {
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
      console.error('❌ [KnowledgeBase] Error searching cheapest:', error);
      return null;
    }
  }

  async searchCheapestFromIds(productIds: number[]): Promise<{ text: string; products: any[]; searchType: 'cheap' } | null> {
    try {
      console.log('💰 [KnowledgeBase] ========================================');
      console.log('💰 [KnowledgeBase] Searching for cheapest from specific IDs:', productIds);
      
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.shop', 'shop')
        .leftJoinAndSelect('product.photos', 'photos')
        .where('product.id IN (:...ids)', { ids: productIds })
        .orderBy('product.price', 'ASC')
        .getMany();

      console.log('💰 [KnowledgeBase] Found products:', products.length);
      if (products.length > 0) {
        console.log('💰 [KnowledgeBase] Top 3 prices:', products.slice(0, 3).map(p => ({ name: p.name, price: p.price })));
      }

      if (products.length === 0) {
        console.log('💰 [KnowledgeBase] ❌ No products found');
        console.log('💰 [KnowledgeBase] ========================================');
        return null;
      }

      const response = `Encontrei ${products.length} produto(s) 💰\n\nOrdenados do mais barato para o mais caro! 📊`;
      
      console.log('💰 [KnowledgeBase] ✅ Returning', products.length, 'products');
      console.log('💰 [KnowledgeBase] ========================================');
      
      return {
        text: response,
        searchType: 'cheap' as const,
        products: products.map(p => {
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
      console.error('❌ [KnowledgeBase] Error searching cheapest from IDs:', error);
      return null;
    }
  }
}
