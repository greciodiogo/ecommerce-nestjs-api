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
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @ApiCreatedResponse({ type: Shop, description: 'Shop created' })
  @ApiBadRequestResponse({ description: 'Invalid shop data' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async createShop(
    @ReqUser() user: User | null,
    @Body() body: ShopCreateDto,
  ): Promise<Shop> {
    return await this.shopsService.createShop(body);
  }

  @Get()
  // @Roles(Role.Admin)
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: [Shop], description: 'List of all shops' })
  async getShops(): Promise<Shop[]> {
    return this.shopsService.getShops();
  }

  @Get(':id')
  @ApiOkResponse({ type: Shop, description: 'Shop by id' })
  @ApiNotFoundResponse({ description: 'Shop not found' })
  async getShopById(@Param('id', ParseIntPipe) id: number): Promise<Shop> {
    return this.shopsService.getShop(id);
  }

  @Patch('/:id')
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  @ApiBadRequestResponse({ description: 'Invalid shop data' })
  @ApiNotFoundResponse({ description: 'Shop not found' })
  // @ApiUnauthorizedResponse({ description: 'User not logged in' })
  // @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Shop, description: 'Shop updated' })
  async updateShop(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ShopUpdateDto,
  ): Promise<Shop> {
    return await this.shopsService.updateShop(id, body);
  }
}
