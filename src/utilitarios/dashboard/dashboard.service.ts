import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { Order } from 'src/sales/orders/models/order.entity';
import { DashboardState } from './model/dashboard.model';
import { OrderStatus } from 'src/sales/orders/models/order-status.enum';
import { ProductsService } from 'src/catalog/products/products.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  // Método que calcula e retorna as métricas do Dashboard
  async getDashboardData(
    filters: DashboardFilterDto,
  ): Promise<DashboardState> {
    const { period } = filters;
    return {
      confirmedToday: await this.getOrderByStatus(
        OrderStatus.Confirmed,
        'daily',
      ),
      confirmedOrderWeek: await this.getOrderByStatus(
        OrderStatus.Confirmed,
        period,
      ),
      completedDeliveriesWeek: await this.getOrderByStatus(
        OrderStatus.Delivered,
        period,
      ),
      newUsers: await this.usersService.getNewUsersCount(period),
      totalSales: await this.getTotalSales(period),
      lowStockProductsCount:
        await this.productsService.getLowStockProductsCount(5),
    };
  }

  // Método para contar pedidos por status
  async getOrderByStatus(
    orderStatus: OrderStatus,
    period?: 'weekly' | 'monthly' | 'yearly' | 'daily',
  ): Promise<number> {
    const where: any = {
      status: orderStatus,
    };
    if (period) {
      where.updated = this.getDateRange(period);
    }
    return this.ordersRepository.count({ where });
  }

  // Método para calcular as vendas totais
  async getTotalSales(
    period?: 'weekly' | 'monthly' | 'yearly',
  ): Promise<number> {
    const where: any = {
      status: OrderStatus.Confirmed,
    };

    if (period) {
      where.updated = this.getDateRange(period);
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

  private getDateRange(period: 'weekly' | 'monthly' | 'yearly' | 'daily') {
    const today = new Date();
    if (period === 'daily') {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      return Between(startOfDay, endOfDay);
    }
    if (period === 'weekly') {
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return Between(startOfWeek, endOfWeek);
    }
    if (period === 'monthly') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );
      endOfMonth.setHours(23, 59, 59, 999);
      return Between(startOfMonth, endOfMonth);
    }
    if (period === 'yearly') {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      return Between(startOfYear, endOfYear);
    }
  }
}
