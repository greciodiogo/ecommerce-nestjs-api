import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { Order } from 'src/sales/orders/models/order.entity';
import { DashboardState } from './model/dashboard.model';
import { OrderStatus } from 'src/sales/orders/models/order-status.enum';
import { ProductsService } from 'src/catalog/products/products.service';

const today = new Date();
const dayOfWeek = today.getDay(); // 0 (domingo) a 6 (sábado)
const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

export const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - diffToMonday);
startOfWeek.setHours(0, 0, 0, 0);

export const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);
endOfWeek.setHours(23, 59, 59, 999);

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  // Método que calcula e retorna as métricas do Dashboard
  async getDashboardData(): Promise<DashboardState> {
    return {
      confirmedToday: await this.getOrderByStatus(false, OrderStatus.Confirmed),
      confirmedOrderWeek: await this.getOrderByStatus(true, OrderStatus.Confirmed),
      completedDeliveriesWeek: await this.getOrderByStatus(false, OrderStatus.Delivered),
      newUsers: await this.usersService.getNewUsersCount(true),
      totalSales: await this.getTotalSales(),
      lowStockProductsCount: await this.productsService.getLowStockProductsCount(5),
    };
  }

  // Método para contar pedidos por status
  async getOrderByStatus(weekly: boolean = false, orderStatus: OrderStatus): Promise<number> {
    let where: any = {
      status: orderStatus,
    };
    if (weekly) {
      where.updated = Between(startOfWeek, endOfWeek);
    }
    return this.ordersRepository.count({ where });
  }

  // Método para calcular as vendas totais
  async getTotalSales(weekly: boolean = false): Promise<number> {
    let where: any = {
      status: OrderStatus.Confirmed,
    };

    if (weekly) {
      where.updated = Between(startOfWeek, endOfWeek);
    }

    const confirmedOrders = await this.ordersRepository.find({
      where,
      relations: ['items'],
    });

    let total = 0;
    for (const order of confirmedOrders) {
      for (const item of order.items) {
        total += item.price * item.quantity;
      }
    }

    return total;
  }
}
