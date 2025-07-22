import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { Promotion } from './models/promotion.entity';
import { PromotionsExporter } from './promotions.exporter';
import { PromotionsImporter } from './promotions.importer';
import { Product } from '../products/models/product.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, Product]), ProductsModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsExporter, PromotionsImporter],
  exports: [PromotionsService, PromotionsExporter, PromotionsImporter],
})
export class PromotionsModule {} 