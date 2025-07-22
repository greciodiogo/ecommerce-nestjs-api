import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { Promotion } from './models/promotion.entity';
import { PromotionsService } from './promotions.service';

@Injectable()
export class PromotionsExporter implements Exporter<Promotion> {
  constructor(private promotionsService: PromotionsService) {}

  async export(): Promise<Promotion[]> {
    const promotions = await this.promotionsService.getPromotions();
    const preparedPromotions: Promotion[] = [];
    for (const promotion of promotions) {
      preparedPromotions.push(this.preparePromotion(promotion));
    }
    return preparedPromotions;
  }

  private preparePromotion(promotion: Promotion) {
    const preparedPromotion = new Promotion() as any;
    preparedPromotion.id = promotion.id;
    preparedPromotion.created = promotion.created;
    preparedPromotion.updated = promotion.updated;
    preparedPromotion.name = promotion.name;
    preparedPromotion.description = promotion.description;
    preparedPromotion.startDate = promotion.startDate;
    preparedPromotion.endDate = promotion.endDate;
    preparedPromotion.discount = promotion.discount;
    preparedPromotion.isActive = promotion.isActive;
    preparedPromotion.productIds = promotion.products?.map((product) => product.id) || [];
    return preparedPromotion;
  }
} 