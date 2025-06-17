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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Promotion } from './models/promotion.entity';

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
    return this.promotionsService.getActivePromotions();
  }

  @Get('/category/:categoryId')
  @ApiOkResponse({ type: [Promotion], description: 'List of promotions for a specific category' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async getPromotionsByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<Promotion[]> {
    return this.promotionsService.getPromotionsByCategory(categoryId);
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

  @Patch('/:id/toggle')
  @Roles(Role.Admin, Role.Manager)
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Promotion, description: 'Promotion status toggled' })
  async togglePromotionStatus(@Param('id', ParseIntPipe) id: number): Promise<Promotion> {
    return await this.promotionsService.togglePromotionStatus(id);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiNotFoundResponse({ description: 'Promotion not found' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ description: 'Promotion deleted' })
  async deletePromotion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.promotionsService.deletePromotion(id);
  }
} 