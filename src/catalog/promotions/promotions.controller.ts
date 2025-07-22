import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '../../users/models/role.enum';
import { PromotionsService } from './promotions.service';
import { PromotionCreateDto } from './dto/promotion-create.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Promotion } from './models/promotion.entity';
import { Product } from '../products/models/product.entity';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles(Role.Admin, Role.Manager)
  @ApiCreatedResponse({ type: Promotion, description: 'Promotion created' })
  @ApiBadRequestResponse({ description: 'Invalid promotion data' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  async createPromotion(@Body() body: PromotionCreateDto): Promise<Promotion> {
    return await this.promotionsService.createPromotion(body);
  }

  @Get()
  @ApiOkResponse({ type: [Promotion], description: 'List of all promotions' })
  async getPromotions(): Promise<Promotion[]> {
    return this.promotionsService.getPromotions();
  }

  @Get('/active')
  @ApiOkResponse({ type: [Promotion], description: 'List of active promotions' })
  async getActivePromotions(): Promise<Promotion[]> {
    return this.promotionsService.getActivePromotions(new Date());
  }

  @Get('/:id')
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiOkResponse({ type: Promotion, description: 'Promotion with given id' })
  async getPromotion(@Param('id', ParseIntPipe) id: number): Promise<Promotion> {
    return await this.promotionsService.getPromotion(id);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiBadRequestResponse({ description: 'Invalid promotion data' })
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Promotion, description: 'Promotion updated' })
  async updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PromotionUpdateDto,
  ): Promise<Promotion> {
    return await this.promotionsService.updatePromotion(id, body);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ description: 'Promotion deleted' })
  async deletePromotion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.promotionsService.deletePromotion(id);
  }

  @Get('/:id/products')
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiOkResponse({ type: [Product], description: 'Promotion products' })
  async getPromotionProducts(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product[]> {
    return await this.promotionsService.getPromotionProducts(id);
  }

  @Post('/:id/products')
  @Roles(Role.Admin, Role.Manager)
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiCreatedResponse({
    type: Product,
    description: 'Product added to promotion',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'number' },
      },
      required: ['productId'],
    },
  })
  async addPromotionProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body('productId') productId: number,
  ): Promise<Product> {
    return await this.promotionsService.addPromotionProduct(id, productId);
  }

  @Delete('/:id/products/:productId')
  @Roles(Role.Admin, Role.Manager)
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiOkResponse({ description: 'Product deleted from promotion' })
  async deletePromotionProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    await this.promotionsService.deletePromotionProduct(id, productId);
  }
} 