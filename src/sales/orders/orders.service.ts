import { Injectable } from '@nestjs/common';
import { Between, Column, Repository, Like } from 'typeorm';
import { Order } from './models/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderCreateDto } from './dto/order-create.dto';
import { UsersService } from '../../users/users.service';
import { ProductsService } from '../../catalog/products/products.service';
import { OrderUpdateDto } from './dto/order-update.dto';
import { OrderItem } from './models/order-item.entity';
import { OrderDelivery } from './models/order-delivery.entity';
import { DeliveryMethodsService } from '../delivery-methods/delivery-methods.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { OrderPayment } from './models/order-payment.entity';
import { NotFoundError } from '../../errors/not-found.error';
import { Role } from '../../users/models/role.enum';
import { OrderItemDto } from './dto/order-item.dto';
import { OrderStatus } from './models/order-status.enum';
import { User } from 'src/users/models/user.entity';
import { MailService } from '../../mail/mail.service';
import moment from 'moment';
import { NotificationsService } from 'src/notifications/notification.service';
import { Shop } from 'src/catalog/shops/models/shop.entity';
import { OrderFilterDto } from './dto/order-filter.dto';

const today = new Date();
const dayOfWeek = today.getDay(); // 0 (domingo) a 6 (sábado)
const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

export const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - diffToMonday);
startOfWeek.setHours(0, 0, 0, 0);

export const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);
endOfWeek.setHours(23, 59, 59, 999);

class OrderItemWithTotal extends OrderItem {
  @Column({ type: 'double precision' })
  total: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Shop)
    private readonly shopsRepository: Repository<Shop>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
    private readonly mailService: MailService,
    private readonly deliveryMethodsService: DeliveryMethodsService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async getOrders(
    filters: OrderFilterDto,
    withUser = false,
    withProducts = false,
  ): Promise<Order[]> {
    const { 
      order_number, 
      customerName, 
      status, 
      paymentMethodId, 
      deliveryMethodId, 
      startDate, 
      endDate, 
      shopName 
    } = filters;
    
    const where: any = {};

    if (order_number && order_number.trim() !== '') {
      where.order_number = order_number;
    }

    if (customerName && customerName.trim() !== '') {
      where.fullName = Like(`%${customerName}%`);
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethodId && paymentMethodId.trim() !== '') {
      where.payment = {
        method: {
          id: paymentMethodId
        }
      };
    }

    if (deliveryMethodId && deliveryMethodId.trim() !== '') {
      where.delivery = {
        method: {
          id: deliveryMethodId
        }
      };
    }

    if (startDate || endDate) {
      where.created = {};
      
      if (startDate && startDate.trim() !== '') {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.created.gte = start;
      }
      
      if (endDate && endDate.trim() !== '') {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created.lte = end;
      }
    }

    if (shopName && shopName.trim() !== '') {
      where.items = {
        product: {
          shop: {
            shopName: shopName,
          },
        },
      };
    }

    return this.ordersRepository.find({
      where,
      relations: [
        ...(withUser ? ['user'] : []),
        'items',
        'items.product',
        'items.product.shop',
        ...(withProducts ? ['items.product'] : []),
        'delivery',
        'delivery.method',
        'payment',
        'payment.method',
        'return',
      ],
      order: {
        updated: 'DESC',
      },
    });
  }


  async getOrderByStatus(weekly: boolean = false, orderStatus: OrderStatus): Promise<number> {
    let where: any = {
      status: orderStatus,
    };
    if (weekly) {
      where.updated = Between(startOfWeek, endOfWeek);
    }

    if (orderStatus) {
      where.status = orderStatus;
    }

    return this.ordersRepository.count({ where });
  }

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

  async getSales(withUser = false, withProducts = false): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { status: OrderStatus.Confirmed }, // <--- Aqui o filtro
      relations: [
        ...(withUser ? ['user'] : []),
        'items',
        ...(withProducts ? ['items.product'] : []),
        'delivery',
        'payment',
        'return',
      ],
      order: {
        updated: 'DESC',
      },
    });
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'items',
        'items.product',
        'delivery',
        'payment',
        'return',
      ],
      order: {
        updated: 'DESC',
      },
    });
  }

  async getOrder(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.product',
        'delivery',
        'payment',
        'return',
      ],
    });
    if (!order) {
      throw new NotFoundError('order', 'id', id.toString());
    }
    return order;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { contactEmail: email },
      relations: [
        'items',
        'items.product',
        'delivery',
        'payment',
        'return',
      ],
    });
  }

  async checkOrderUser(userId: number, id: number): Promise<boolean> {
    const order = await this.ordersRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });
    return !!order;
  }

  async createOrder(
    userId: number | null,
    orderData: OrderCreateDto,
    ignoreSubscribers = false,
  ): Promise<Order> {
    const order = new Order();
    if (userId) {
      order.user = await this.usersService.getUser(userId);
    }
    order.items = await this.getItems(order, orderData.items);
    order.fullName = orderData.fullName;
    order.contactEmail = orderData.contactEmail;
    order.contactPhone = orderData.contactPhone;
    order.message = orderData.message;
    const deliveryMethod = await this.deliveryMethodsService.getMethod(
      orderData.delivery.methodId,
    );
    const delivery = new OrderDelivery();
    Object.assign(delivery, orderData.delivery);
    order.delivery = delivery;
    order.delivery.method = deliveryMethod;
    const paymentMethod = await this.paymentMethodsService.getMethod(
      orderData.payment.methodId,
    );
    const payment = new OrderPayment();
    Object.assign(payment, orderData.payment);
    order.payment = payment;
    order.payment.method = paymentMethod;

    const total = order.items.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);
    const roundedTotal = Math.round(total * 100) / 100;

    let savedOrder = await this.ordersRepository.save(order, { listeners: !ignoreSubscribers });

    const orderNumber = this.generateOrderNumber(savedOrder);
    savedOrder.order_number = orderNumber;

    // 3. Segundo save (agora com order_number)
    savedOrder = await this.ordersRepository.save(savedOrder);

    const orderForEmail = {
      ...savedOrder,
      roundedTotal,
      createdFormatted: moment(savedOrder.created).format('DD/MM/YYYY [às] HH:mm'),
    };

    // Envia o email com os dados formatados
    if (savedOrder) {
      await this.mailService.sendOrderInvoiceEmail(orderData.contactEmail, orderForEmail);
      await this.notifySystemAdmin([Role.Admin, Role.Manager], savedOrder)
      await this.notifyShopkeepersOnOrder(savedOrder)
    }

    return savedOrder;
  }

  public notifySystemAdmin(roles: Array<Role>, order: Order) {
    roles.forEach((role) => {
      this.notificationsService.notifyUsersByRole({
        title: 'new order placed #' + order.order_number,
        message: 'new order placed #' + order.order_number,
        role: role,
      })
    })
  }

  async notifyShopkeepersOnOrder(order: any): Promise<any> {
    const uniqueShopkeepers = new Map<number, { userId: number; products: { id: number; quantity: number }[] }>();

    for (const item of order.items) {
      const product_ = await this.productsService.getProduct(item.productId);
      const shop = await this.shopsRepository.findOne({
        where: { id: product_.shopId },
        relations: ['user'],
      });
      if (!shop || !shop.user) continue;
      if (!uniqueShopkeepers.has(shop.user.id)) {
        uniqueShopkeepers.set(shop.user.id, {
          userId: shop.user.id,
          products: [],
        });
      }
      uniqueShopkeepers.get(shop.user.id)?.products.push({ id: product_.id, quantity: item.quantity });
    }
    for (const shopkeeper of uniqueShopkeepers.values()) {
      const productDetails = shopkeeper.products.map(p => `ID: ${p.id}, Qty: ${p.quantity}`).join(' | ');
      await this.notificationsService.createNotification({
        title: `New Order #${order.order_number}, Products: ${productDetails}`,
        message: `Products in your order: ${productDetails}`,
        userId: shopkeeper.userId,
      });
    }
  }

  private async getItems(order: Order, items: OrderItemDto[]) {
    const res = [];
    for (const item of items) {
      const product = await this.productsService.getProduct(
        item.productId,
        order.user &&
        [Role.Admin, Role.Manager, Role.Sales].includes(order.user.role),
      );
      res.push({
        product,
        quantity: item.quantity,
        price: product.price,
        total: product.price * item.quantity, // Aqui você adiciona o total calculado
      } as OrderItemWithTotal);
    }
    return res;
  }

  async updateOrder(
    id: number,
    orderData: OrderUpdateDto,
    ignoreSubscribers = false,
  ): Promise<Order> {
    const order = await this.getOrder(id);
    if (orderData.items) {
      order.items = await this.getItems(order, orderData.items);
    }
    if (orderData.delivery) {
      const deliveryMethod = await this.deliveryMethodsService.getMethod(
        orderData.delivery.methodId,
      );
      Object.assign(order.delivery, orderData.delivery);
      order.delivery.method = deliveryMethod;
    }
    if (orderData.payment) {
      const paymentMethod = await this.paymentMethodsService.getMethod(
        orderData.payment.methodId,
      );
      Object.assign(order.payment, orderData.payment);
      order.payment.method = paymentMethod;
    }
    const { delivery, payment, items, ...toAssign } = orderData;
    Object.assign(order, toAssign);
    return this.ordersRepository.save(order, { listeners: !ignoreSubscribers });
  }

  async deleteOrder(id: number): Promise<void> {
    await this.getOrder(id);
    await this.ordersRepository.delete({ id });
    return;
  }

  generateOrderNumber(order: Order): string {
    const year = new Date(order.created).getFullYear();
    const paddedId = order.id.toString().padStart(6, '0');
    return `Enc${year}/${paddedId}`;
  }
}
