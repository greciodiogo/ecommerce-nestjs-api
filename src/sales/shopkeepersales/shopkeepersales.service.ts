import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopkeeperSale } from './shopkeepersale.entity';
import { ShopkeeperSaleCreateDto } from './dto/shopkeepersale-create.dto';
import { ShopkeeperSaleUpdateDto } from './dto/shopkeepersale-update.dto';
import { Shop } from '../../catalog/shops/models/shop.entity';
import { Product } from '../../catalog/products/models/product.entity';
import { User } from '../../users/models/user.entity';
import { ShopkeeperSaleFilterDto } from './dto/shopkeepersale-filter.dto';
import { Between } from 'typeorm';

@Injectable()
export class ShopkeeperSalesService {
  constructor(
    @InjectRepository(ShopkeeperSale)
    private readonly shopkeeperSalesRepository: Repository<ShopkeeperSale>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createDto: ShopkeeperSaleCreateDto): Promise<ShopkeeperSale> {
    const shop = await this.shopRepository.findOne({ where: { id: createDto.shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    const products = await this.productRepository.findByIds(createDto.productIds);
    if (products.length !== createDto.productIds.length) throw new NotFoundException('One or more products not found');
    const sale = this.shopkeeperSalesRepository.create({
      order_number: createDto.order_number,
      shop,
      products,
      quantity: createDto.quantity,
    });
    return this.shopkeeperSalesRepository.save(sale);
  }

  async createForUser(user: User, createDto: ShopkeeperSaleCreateDto): Promise<ShopkeeperSale> {
    const shop = await this.shopRepository.findOne({ where: { user: { id: user.id } } });
    if (!shop) throw new NotFoundException('User does not have a shop');
    const products = await this.productRepository.findByIds(createDto.productIds);
    if (products.length !== createDto.productIds.length) throw new NotFoundException('One or more products not found');
    const sale = this.shopkeeperSalesRepository.create({
      order_number: createDto.order_number,
      shop,
      products,
      quantity: createDto.quantity,
    });
    return this.shopkeeperSalesRepository.save(sale);
  }

  async findAll(filters?: ShopkeeperSaleFilterDto): Promise<ShopkeeperSale[]> {
    const query = this.shopkeeperSalesRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('sale.products', 'product');

    if (filters?.orderNumber) {
      query.andWhere('sale.order_number ILIKE :orderNumber', { orderNumber: `%${filters.orderNumber}%` });
    }
    if (filters?.productName) {
      query.andWhere('product.name ILIKE :productName', { productName: `%${filters.productName}%` });
    }
    if (filters?.productId) {
      query.andWhere('product.id = :productId', { productId: filters.productId });
    }
    if (filters?.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('sale.created BETWEEN :startDate AND :endDate', { startDate, endDate });
    }
    return query.getMany();
  }

  async findOne(id: number): Promise<ShopkeeperSale> {
    const sale = await this.shopkeeperSalesRepository.findOne({ where: { id }, relations: ['shop', 'products'] });
    if (!sale) throw new NotFoundException('ShopkeeperSale not found');
    return sale;
  }

  async update(id: number, updateDto: ShopkeeperSaleUpdateDto): Promise<ShopkeeperSale> {
    const sale = await this.findOne(id);
    if (updateDto.shopId) {
      const shop = await this.shopRepository.findOne({ where: { id: updateDto.shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
      sale.shop = shop;
    }
    if (updateDto.productIds) {
      const products = await this.productRepository.findByIds(updateDto.productIds);
      if (products.length !== updateDto.productIds.length) throw new NotFoundException('One or more products not found');
      sale.products = products;
    }
    if (updateDto.order_number !== undefined) sale.order_number = updateDto.order_number;
    if (updateDto.quantity !== undefined) sale.quantity = updateDto.quantity;
    return this.shopkeeperSalesRepository.save(sale);
  }

  async remove(id: number): Promise<void> {
    const sale = await this.findOne(id);
    await this.shopkeeperSalesRepository.remove(sale);
  }

  async findAllForUser(user: User, filters?: ShopkeeperSaleFilterDto): Promise<ShopkeeperSale[]> {
    const shop = await this.shopRepository.findOne({ where: { user: { id: user.id } } });
    if (!shop) throw new NotFoundException('User does not have a shop');
    const query = this.shopkeeperSalesRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('sale.products', 'product')
      .where('sale.shop = :shopId', { shopId: shop.id });

    if (filters?.orderNumber) {
      query.andWhere('sale.order_number ILIKE :orderNumber', { orderNumber: `%${filters.orderNumber}%` });
    }
    if (filters?.productName) {
      query.andWhere('product.name ILIKE :productName', { productName: `%${filters.productName}%` });
    }
    if (filters?.productId) {
      query.andWhere('product.id = :productId', { productId: filters.productId });
    }
    if (filters?.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('sale.created BETWEEN :startDate AND :endDate', { startDate, endDate });
    }
    return query.getMany();
  }
} 