import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopkeeperSale } from './shopkeepersale.entity';
import { ShopkeeperSalesService } from './shopkeepersales.service';
import { ShopkeeperSalesController } from './shopkeepersales.controller';
import { Shop } from '../../catalog/shops/models/shop.entity';
import { Product } from '../../catalog/products/models/product.entity';
import { ShopkeeperSaleProduct } from './shopkeepersale-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShopkeeperSale, ShopkeeperSaleProduct, Shop, Product])],
  providers: [ShopkeeperSalesService],
  controllers: [ShopkeeperSalesController],
  exports: [ShopkeeperSalesService],
})
export class ShopkeeperSalesModule {} 