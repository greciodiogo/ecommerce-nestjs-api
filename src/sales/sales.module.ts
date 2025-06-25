import { Module } from '@nestjs/common';
import { DeliveryMethodsModule } from './delivery-methods/delivery-methods.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { OrdersModule } from './orders/orders.module';
import { ReturnsModule } from './returns/returns.module';
import { ShopkeeperSalesModule } from './shopkeepersales/shopkeepersales.module';

@Module({
  imports: [
    DeliveryMethodsModule,
    PaymentMethodsModule,
    OrdersModule,
    ReturnsModule,
    ShopkeeperSalesModule,
  ],
  exports: [
    DeliveryMethodsModule,
    PaymentMethodsModule,
    OrdersModule,
    ReturnsModule,
    ShopkeeperSalesModule,
  ],
})
export class SalesModule {}
