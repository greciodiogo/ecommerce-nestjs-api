import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '../../users/models/role.enum';
import { ShopCreateDto } from './dto/shop-create.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReqUser } from '../../auth/decorators/user.decorator';
import { User } from '../../users/models/user.entity';
import { ShopUpdateDto } from './dto/shop-update.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Shop } from './models/shop.entity';
import { ShopsService } from './shops.service';

@ApiTags('shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly ordersService: ShopsService) {}

  @Post()
  @ApiCreatedResponse({ type: Shop, description: 'Shop created' })
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async createShop(
    @ReqUser() user: User | null,
    @Body() body: ShopCreateDto,
  ): Promise<Shop> {
    return await this.ordersService.createShop(body);
  }

  @Get()
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: [Shop], description: 'List of all orders' })
  async getShops(): Promise<Shop[]> {
    return this.ordersService.getShops();
  }

  @Patch('/:id')
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiNotFoundResponse({ description: 'Shop not found' })
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Shop, description: 'Shop updated' })
  async updateShop(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ShopUpdateDto,
  ): Promise<Shop> {
    return await this.ordersService.updateShop(id, body);
  }
}
