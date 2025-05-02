import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../../users/users.module';
import { CatalogModule } from '../../catalog/catalog.module';
import { DashboardService } from './dashboard.service';
import { Order } from 'src/sales/orders/models/order.entity';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, DashboardService]),
    UsersModule,
    CatalogModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
