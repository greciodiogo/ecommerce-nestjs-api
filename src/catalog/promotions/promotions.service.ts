import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Promotion } from './models/promotion.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PromotionCreateDto } from './dto/promotion-create.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { Category } from '../../catalog/categories/models/category.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepository: Repository<Promotion>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async getPromotions(): Promise<Promotion[]> {
    return this.promotionsRepository.find({
      relations: ['categories'],
      order: { updated: 'DESC' },
    });
  }

  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return this.promotionsRepository.find({
      where: {
        isActive: true,
        startDate: { $lte: now } as any,
        endDate: { $gte: now } as any,
      },
      relations: ['categories'],
      order: { updated: 'DESC' },
    });
  }

  async getPromotion(id: number): Promise<Promotion> {
    const promotion = await this.promotionsRepository.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!promotion) {
      throw new NotFoundError('promotion', 'id', id.toString());
    }
    return promotion;
  }

  async createPromotion(promotionData: PromotionCreateDto): Promise<Promotion> {
    // Validate dates
    const startDate = new Date(promotionData.startDate);
    const endDate = new Date(promotionData.endDate);
    
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    // Get categories
    const categories = await this.categoriesRepository.findByIds(promotionData.categoryIds);
    if (categories.length !== promotionData.categoryIds.length) {
      throw new Error('Some categories not found');
    }

    const promotion = new Promotion();
    promotion.name = promotionData.name;
    promotion.description = promotionData.description;
    promotion.startDate = startDate;
    promotion.endDate = endDate;
    promotion.discount = promotionData.discount;
    promotion.isActive = promotionData.isActive ?? true;
    promotion.categories = categories;

    return await this.promotionsRepository.save(promotion);
  }

  async updatePromotion(id: number, promotionData: PromotionUpdateDto): Promise<Promotion> {
    const promotion = await this.getPromotion(id);

    if (promotionData.startDate && promotionData.endDate) {
      const startDate = new Date(promotionData.startDate);
      const endDate = new Date(promotionData.endDate);
      
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }
    }

    if (promotionData.categoryIds) {
      const categories = await this.categoriesRepository.findByIds(promotionData.categoryIds);
      if (categories.length !== promotionData.categoryIds.length) {
        throw new Error('Some categories not found');
      }
      promotion.categories = categories;
    }

    if (promotionData.name) promotion.name = promotionData.name;
    if (promotionData.description) promotion.description = promotionData.description;
    if (promotionData.startDate) promotion.startDate = new Date(promotionData.startDate);
    if (promotionData.endDate) promotion.endDate = new Date(promotionData.endDate);
    if (promotionData.discount !== undefined) promotion.discount = promotionData.discount;
    if (promotionData.isActive !== undefined) promotion.isActive = promotionData.isActive;

    return await this.promotionsRepository.save(promotion);
  }

  async deletePromotion(id: number): Promise<void> {
    const promotion = await this.getPromotion(id);
    await this.promotionsRepository.remove(promotion);
  }

  async getPromotionsByCategory(categoryId: number): Promise<Promotion[]> {
    const now = new Date();
    return this.promotionsRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('promotion.isActive = :isActive', { isActive: true })
      .andWhere('promotion.startDate <= :now', { now })
      .andWhere('promotion.endDate >= :now', { now })
      .orderBy('promotion.updated', 'DESC')
      .getMany();
  }

  async togglePromotionStatus(id: number): Promise<Promotion> {
    const promotion = await this.getPromotion(id);
    promotion.isActive = !promotion.isActive;
    return await this.promotionsRepository.save(promotion);
  }
} 