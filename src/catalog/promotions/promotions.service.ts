import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Promotion } from './models/promotion.entity';
import { NotFoundError } from '../../errors/not-found.error';
import { NotRelatedError } from '../../errors/not-related.error';
import { PromotionCreateDto } from './dto/promotion-create.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/models/product.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private promotionsRepository: Repository<Promotion>,
    private productsService: ProductsService,
  ) {}

  async getPromotions(withProducts = false): Promise<Promotion[]> {
    return this.promotionsRepository.find({
      relations: [...(withProducts ? ['products'] : [])],
      order: { updated: 'DESC' },
    });
  }

  async getActivePromotions(currentDate: Date): Promise<Promotion[]> {
    return this.promotionsRepository.find({
      where: {
        isActive: true,
        startDate: LessThanOrEqual(currentDate),
        endDate: MoreThanOrEqual(currentDate),
      },
      relations: ['products'],
      order: { updated: 'DESC' },
    });
  }

  async getPromotion(id: number, withProducts = false): Promise<Promotion> {
    const promotion = await this.promotionsRepository.findOne({
      where: { id },
      relations: [...(withProducts ? ['products'] : [])],
    });
    if (!promotion) {
      throw new NotFoundError('promotion', 'id', id.toString());
    }
    return promotion;
  }

  async getPromotionBySlug(
    slug: string,
    withProducts = false,
  ): Promise<Promotion> {
    const promotion = await this.promotionsRepository.findOne({
      where: { slug },
      relations: [...(withProducts ? ['products'] : [])],
    });
    if (!promotion) {
      throw new NotFoundError('promotion', 'slug', slug);
    }
    return promotion;
  }

  async createPromotion(promotionData: PromotionCreateDto): Promise<Promotion> {
    const promotion = new Promotion();
    Object.assign(promotion, promotionData);
    if (promotionData.productIds) {
      promotion.products = await this.productsService.getProductsByIds(
        promotionData.productIds,
      );
    }
    return await this.promotionsRepository.save(promotion);
  }

  async updatePromotion(
    id: number,
    promotionData: PromotionUpdateDto,
  ): Promise<Promotion> {
    const promotion = await this.getPromotion(id, true);
    Object.assign(promotion, promotionData);
    if (promotionData.productIds) {
      promotion.products = await this.productsService.getProductsByIds(
        promotionData.productIds,
      );
    }
    return await this.promotionsRepository.save(promotion);
  }

  async deletePromotion(id: number): Promise<boolean> {
    await this.getPromotion(id);
    await this.promotionsRepository.delete({ id });
    return true;
  }

  async getPromotionProducts(
    id: number,
    withHidden?: boolean,
  ): Promise<Product[]> {
    const promotion = await this.getPromotion(id, true);
    if (!withHidden) {
      return promotion.products.filter((product) => product.visible);
    }
    return promotion.products;
  }

  async getPromotionProductsBySlug(
    slug: string,
    withHidden?: boolean,
  ): Promise<Product[]> {
    const promotion = await this.getPromotionBySlug(slug, true);
    if (!withHidden) {
      return promotion.products.filter((product) => product.visible);
    }
    return promotion.products;
  }

  async addPromotionProduct(id: number, productId: number): Promise<Product> {
    const product = await this.productsService.getProduct(productId);
    const promotion = await this.getPromotion(id, true);
    promotion.products.push(product);
    await this.promotionsRepository.save(promotion);
    return product;
  }

  async deletePromotionProduct(
    id: number,
    productId: number,
  ): Promise<boolean> {
    const product = await this.productsService.getProduct(productId);
    const promotion = await this.getPromotion(id, true);
    if (!promotion.products.some((p) => p.id === product.id)) {
      throw new NotRelatedError('promotion', 'product');
    }
    promotion.products = promotion.products.filter((p) => p.id !== product.id);
    await this.promotionsRepository.save(promotion);
    return true;
  }

  async getActivePromotionsForProduct(
    currentDate: Date,
    productId: number,
  ): Promise<Promotion[]> {
    return this.promotionsRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.products', 'product')
      .where('promotion.isActive = :isActive', { isActive: true })
      .andWhere('promotion.startDate <= :currentDate', { currentDate })
      .andWhere('promotion.endDate >= :currentDate', { currentDate })
      .andWhere('product.id = :productId', { productId })
      .getMany();
  }

  async getIdsOfActivePromotions(currentDate: Date): Promise<number[]> {
    const promotions = await this.promotionsRepository.find({
      where: {
        isActive: true,
        startDate: LessThanOrEqual(currentDate),
        endDate: MoreThanOrEqual(currentDate),
      },
      select: ['id'],
    });
    return promotions.map((p) => p.id);
  }
} 