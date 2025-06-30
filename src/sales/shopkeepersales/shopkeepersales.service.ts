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
import { ShopkeeperSaleProduct } from './shopkeepersale-product.entity';

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
    const sale = this.shopkeeperSalesRepository.create({
      order_number: createDto.order_number,
      shop,
    });
    const savedSale = await this.shopkeeperSalesRepository.save(sale);
    // Create ShopkeeperSaleProduct entries
    const saleProducts: ShopkeeperSaleProduct[] = [];
    for (const p of createDto.products) {
      const product = await this.productRepository.findOne({ where: { id: p.productId } });
      if (!product) throw new NotFoundException(`Product with id ${p.productId} not found`);
      const saleProduct = new ShopkeeperSaleProduct();
      saleProduct.shopkeeperSale = savedSale;
      saleProduct.product = product;
      saleProduct.quantity = p.quantity;
      saleProducts.push(saleProduct);
    }
    await Promise.all(saleProducts.map(sp => this.shopkeeperSalesRepository.manager.save(sp)));
    return this.findOne(savedSale.id);
  }

  async createForUser(user: User, createDto: ShopkeeperSaleCreateDto): Promise<ShopkeeperSale> {
    const shop = await this.shopRepository.findOne({ where: { user: { id: user.id } } });
    if (!shop) throw new NotFoundException('User does not have a shop');
    const sale = this.shopkeeperSalesRepository.create({
      order_number: createDto.order_number,
      shop,
    });
    const savedSale = await this.shopkeeperSalesRepository.save(sale);
    // Create ShopkeeperSaleProduct entries
    const saleProducts: ShopkeeperSaleProduct[] = [];
    for (const p of createDto.products) {
      const product = await this.productRepository.findOne({ where: { id: p.productId } });
      if (!product) throw new NotFoundException(`Product with id ${p.productId} not found`);
      const saleProduct = new ShopkeeperSaleProduct();
      saleProduct.shopkeeperSale = savedSale;
      saleProduct.product = product;
      saleProduct.quantity = p.quantity;
      saleProducts.push(saleProduct);
    }
    await Promise.all(saleProducts.map(sp => this.shopkeeperSalesRepository.manager.save(sp)));
    return this.findOne(savedSale.id);
  }

  async findAll(filters?: ShopkeeperSaleFilterDto): Promise<ShopkeeperSale[]> {
    const query = this.shopkeeperSalesRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('sale.products', 'saleProduct')
      .leftJoinAndSelect('saleProduct.product', 'product');

    if (filters?.orderNumber) {
      query.andWhere('sale.order_number ILIKE :orderNumber', { orderNumber: `%${filters.orderNumber}%` });
    }
    if (filters?.productName) {
      query.andWhere('product.name ILIKE :productName', { productName: `%${filters.productName}%` });
    }
    if (filters?.productId) {
      query.andWhere('product.id = :productId', { productId: filters.productId });
    }
    if (filters?.startDate || filters?.endDate) {
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        query.andWhere('sale.created >= :startDate', { startDate });
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.andWhere('sale.created <= :endDate', { endDate });
      }
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
    if (updateDto.order_number !== undefined) sale.order_number = updateDto.order_number;
    await this.shopkeeperSalesRepository.save(sale);
    // Update products if provided
    if (updateDto.products) {
      // Remove existing products
      await this.shopkeeperSalesRepository.manager.delete(ShopkeeperSaleProduct, { shopkeeperSale: sale });
      // Add new products
      const saleProducts: ShopkeeperSaleProduct[] = [];
      for (const p of updateDto.products) {
        const product = await this.productRepository.findOne({ where: { id: p.productId } });
        if (!product) throw new NotFoundException(`Product with id ${p.productId} not found`);
        const saleProduct = new ShopkeeperSaleProduct();
        saleProduct.shopkeeperSale = sale;
        saleProduct.product = product;
        saleProduct.quantity = p.quantity;
        saleProducts.push(saleProduct);
      }
      await Promise.all(saleProducts.map(sp => this.shopkeeperSalesRepository.manager.save(sp)));
    }
    return this.findOne(sale.id);
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
      .leftJoinAndSelect('sale.products', 'saleProduct')
      .leftJoinAndSelect('saleProduct.product', 'product')
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
    if (filters?.startDate || filters?.endDate) {
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        query.andWhere('sale.created >= :startDate', { startDate });
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.andWhere('sale.created <= :endDate', { endDate });
      }
    }

    return query.getMany();
  }
} 