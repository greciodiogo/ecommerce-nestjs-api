import { forwardRef, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './models/product.entity';
import { Attribute } from './models/attribute.entity';
import { ProductPhotosModule } from './product-photos/product-photos.module';
import { AttributeTypesModule } from '../attribute-types/attribute-types.module';
import { ProductsExporter } from './products.exporter';
import { ProductsImporter } from './products.importer';
import { Shop } from '../shops/models/shop.entity';
import { User } from 'src/users/models/user.entity';
import { ShopsModule } from '../shops/shops.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Attribute, User]),
    ProductPhotosModule,
    AttributeTypesModule,
    ShopsModule,
    forwardRef(() => ShopsModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsExporter, ProductsImporter],
  exports: [
    ProductsService,
    ProductsExporter,
    ProductsImporter,
    ProductPhotosModule,
  ],
})
export class ProductsModule {}
