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

  async searchProducts(query: string): Promise<string | null> {
    const products = await this.productRepository.find({
      where: [
        { name: ILike(`%${query}%`) },
        { description: ILike(`%${query}%`) },
      ],
      take: 5,
      relations: ['shop'],
    });

    if (products.length === 0) return null;

    let response = `Encontrei ${products.length} produto(s) relacionado(s):\n\n`;
    
    products.forEach((product, index) => {
      response += `${index + 1}. **${product.name}**\n`;
      response += `   💰 R$ ${product.price.toFixed(2)}\n`;
      if (product.shop) {
        response += `   🏪 ${product.shop.shopName}\n`;
      }
      response += `\n`;
    });

    response += 'Quer saber mais sobre algum desses produtos?';
    
    return response;
  }

  async searchShops(query: string): Promise<string | null> {
    const shops = await this.shopRepository.find({
      where: [
        { shopName: ILike(`%${query}%`) },
        { address: ILike(`%${query}%`) },
      ],
      take: 5,
    });

    if (shops.length === 0) return null;

    let response = `Encontrei ${shops.length} loja(s):\n\n`;
    
    shops.forEach((shop, index) => {
      response += `${index + 1}. **${shop.shopName}**\n`;
      if (shop.address) {
        response += `   📍 ${shop.address}\n`;
      }
      if (shop.contactPhone) {
        response += `   📞 ${shop.contactPhone}\n`;
      }
      response += `\n`;
    });

    return response;
  }

  async search(query: string): Promise<string | null> {
    // Try products first
    const productResult = await this.searchProducts(query);
    if (productResult) return productResult;

    // Then try shops
    const shopResult = await this.searchShops(query);
    if (shopResult) return shopResult;

    return null;
  }
}
