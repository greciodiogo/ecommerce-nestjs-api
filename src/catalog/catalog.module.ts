import { Module } from '@nestjs/common';
import { AttributeTypesModule } from './attribute-types/attribute-types.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductRatingsModule } from './product-ratings/product-ratings.module';
import { ProductsModule } from './products/products.module';
import { FaqsModule } from './faqs/faqs.module';
import { ShopsModule } from './shops/shops.module';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [
  AttributeTypesModule,
    CategoriesModule,
    ProductRatingsModule,
    ProductsModule,
    FaqsModule,
    ShopsModule,
    PromotionsModule,
  ],
  exports: [
    AttributeTypesModule,
    CategoriesModule,
    ProductRatingsModule,
    ProductsModule,
    FaqsModule,
    ShopsModule,
    PromotionsModule
  ],
})
export class CatalogModule {}
