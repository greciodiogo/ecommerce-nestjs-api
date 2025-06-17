import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { PromotionsService } from './promotions.service';
import { PromotionCreateDto } from './dto/promotion-create.dto';

@Injectable()
export class PromotionsImporter implements Importer {
  constructor(private promotionsService: PromotionsService) {}

  async import(
    promotions: Collection,
    idMaps: Record<string, IdMap>,
  ): Promise<IdMap> {
    const parsedPromotions = this.parsePromotions(promotions, idMaps);
    const idMap: IdMap = {};
    for (const promotion of parsedPromotions) {
      const createdPromotion = await this.promotionsService.createPromotion(promotion);
      idMap[promotion.id] = createdPromotion.id;
    }
    return idMap;
  }

  async clear() {
    const promotions = await this.promotionsService.getPromotions();
    let deleted = 0;
    for (const promotion of promotions) {
      await this.promotionsService.deletePromotion(promotion.id);
      deleted += 1;
    }
    return deleted;
  }

  private parsePromotions(promotions: Collection, idMaps: Record<string, IdMap>) {
    const parsedPromotions: (PromotionCreateDto & { id: number })[] = [];
    for (const promotion of promotions) {
      parsedPromotions.push(this.parsePromotion(promotion, idMaps));
    }
    return parsedPromotions;
  }

  private parsePromotion(
    promotion: Collection[number],
    { categories: categoriesIdMap }: Record<string, IdMap>,
  ) {
    const parsedPromotion = new PromotionCreateDto() as any;
    try {
      parsedPromotion.id = promotion.id as number;
      parsedPromotion.created = new Date(promotion.created as string);
      parsedPromotion.updated = new Date(promotion.updated as string);
      parsedPromotion.name = promotion.name as string;
      parsedPromotion.description = promotion.description as string;
      parsedPromotion.startDate = new Date(promotion.startDate as string).toISOString();
      parsedPromotion.endDate = new Date(promotion.endDate as string).toISOString();
      parsedPromotion.discount = promotion.discount as number;
      parsedPromotion.isActive = promotion.isActive as boolean;
      
      let categoryIds: number[];
      if (typeof promotion.categoryIds === 'string') {
        categoryIds = JSON.parse(promotion.categoryIds);
      } else {
        categoryIds = promotion.categoryIds as unknown as number[];
      }
      parsedPromotion.categoryIds = categoryIds.map(
        (categoryId) => categoriesIdMap[categoryId],
      );
    } catch (e) {
      throw new ParseError('promotion');
    }
    return parsedPromotion;
  }
} 