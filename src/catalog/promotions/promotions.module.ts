import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { Promotion } from './models/promotion.entity';
import { Category } from '../../catalog/categories/models/category.entity';
import { PromotionsExporter } from './promotions.exporter';
import { PromotionsImporter } from './promotions.importer';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, Category])],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsExporter, PromotionsImporter],
  exports: [PromotionsService, PromotionsExporter, PromotionsImporter],
})
export class PromotionsModule {} 