import { forwardRef, Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './models/shop.entity';
import { UsersModule } from '../../users/users.module';
import { ShopsExporter } from './shops.exporter';
import { ShopsImporter } from './shops.importer';
import { ShopItem } from './models/shop-item.entity';
import { ProductsModule } from '../products/products.module';
import { User } from 'src/users/models/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, ShopItem, User]),
    UsersModule, 
    forwardRef(() => ProductsModule),
  ],
  providers: [ShopsService, ShopsExporter, ShopsImporter],
  controllers: [ShopsController],
  exports: [ShopsService, ShopsExporter, ShopsImporter, TypeOrmModule],
})
export class ShopsModule {}
