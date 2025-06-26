import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '../../users/models/role.enum';
import { OrdersService } from './orders.service';
import { OrderCreateDto } from './dto/order-create.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReqUser } from '../../auth/decorators/user.decorator';
import { User } from '../../users/models/user.entity';
import { OrderUpdateDto } from './dto/order-update.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Order } from './models/order.entity';
import { OrderFilterDto } from './dto/order-filter.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiCreatedResponse({ type: Order, description: 'Order created' })
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async createOrder(
    @ReqUser() user: User | null,
    @Body() body: OrderCreateDto,
  ): Promise<Order> {
    return await this.ordersService.createOrder(user?.id ?? null, body);
  }

  @Post('/notifyShopkeepersOnOrder')
  // @ApiCreatedResponse({ type: Order, description: 'Order created' })
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async notifyShopkeepersOnOrder(
    @Body() body: any,
  ): Promise<Order> {
    return await this.ordersService.notifyShopkeepersOnOrder(body);
  }

  @Get('/sales')
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: [Order], description: 'List of all sales' })
  async getSales(): Promise<Order[]> {
    return this.ordersService.getSales();
  }
  @Get()
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: [Order], description: 'List of all orders' })
  async getOrders(@Query() filters: OrderFilterDto): Promise<Order[]> {
    return this.ordersService.getOrders(filters);
  }

  @Get('/by-email')
  @ApiOkResponse({ type: [Order], description: "List of a customer's orders by email" })
  @ApiQuery({ name: 'email', required: true, type: String })
  async getOrdersByEmail(@Query('email') email: string): Promise<Order[]> {
    return this.ordersService.getOrdersByEmail(email);
  }

  @Get('/my')
  // @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({
    type: [Order],
    description: "List of current user's orders",
  })
  async getUserOrders(@ReqUser() user: User): Promise<Order[]> {
    return await this.ordersService.getUserOrders(user.id);
  }

  @Get('/:id')
  // @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiNotFoundResponse({ description: 'Order not found' })
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Order, description: 'Order with given id' })
  async getOrder(
    @ReqUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    const checkUser = await this.ordersService.checkOrderUser(user.id, id);
    if (!checkUser && user.role === Role.Customer) {
      throw new ForbiddenException();
    }
    return await this.ordersService.getOrder(id);
  }

  @Patch('/:id')
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Order, description: 'Order updated' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: OrderUpdateDto,
  ): Promise<Order> {
    return await this.ordersService.updateOrder(id, body);
  }
}
