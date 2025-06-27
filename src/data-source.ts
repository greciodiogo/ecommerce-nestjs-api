import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ShopkeeperSale } from './sales/shopkeepersales/shopkeepersale.entity';
import { ShopkeeperSaleProduct } from './sales/shopkeepersales/shopkeepersale-product.entity';
import { Shop } from './catalog/shops/models/shop.entity';
import { Product } from './catalog/products/models/product.entity';
// Add other entities as needed

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  entities: [
    ShopkeeperSale,
    ShopkeeperSaleProduct,
    Shop,
    Product,
    // Add other entities here as needed
  ],
  migrations: ['src/migration/*.ts'],
  synchronize: false,
}); 