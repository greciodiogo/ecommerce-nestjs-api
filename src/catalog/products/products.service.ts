import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './models/product.entity';
import { In, LessThan, Repository, FindOptionsWhere, Like } from 'typeorm';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { Attribute } from './models/attribute.entity';
import { AttributeDto } from './dto/attribute.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { OrderItem } from '../../sales/orders/models/order-item.entity';
import { AttributeTypesService } from '../attribute-types/attribute-types.service';
import { Shop } from '../shops/models/shop.entity';
import { User } from 'src/users/models/user.entity';
import { ShopsService } from '../shops/shops.service';
import { ProductFilterDto } from './dto/product-filter.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(Attribute)
    private attributesRepository: Repository<Attribute>,

    private attributeTypesService: AttributeTypesService,

    @InjectRepository(Shop)
    private readonly shopsRepository: Repository<Shop>,

    @Inject(forwardRef(() => ShopsService))
    private readonly shopsService: ShopsService,
  ) { }

  async getProducts(
    filters: ProductFilterDto,
    user?: User,
    onlyVisible?: boolean,
  ): Promise<Product[]> {
    const { id, name, shopName, minStock, maxStock, minPrice, maxPrice } = filters;
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.shop', 'shop')
      .leftJoinAndSelect('product.attributes', 'attributes')
      .leftJoinAndSelect('product.photos', 'photos');

    if (id) {
      queryBuilder.andWhere('product.id = :id', { id: +id });
    }
    if (name) {
      queryBuilder.andWhere('LOWER(product.name) LIKE LOWER(:name)', { name: `%${name}%` });
    }
    if (shopName) {
      queryBuilder.andWhere('LOWER(shop.shopName) LIKE LOWER(:shopName)', {
        shopName: `%${shopName}%`,
      });
    }

    if (minStock !== undefined) {
      queryBuilder.andWhere('product.stock >= :minStock', { minStock });
    }
    if (maxStock !== undefined) {
      queryBuilder.andWhere('product.stock <= :maxStock', { maxStock });
    }
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (user) {
      const shops = await this.shopsRepository.find({
        where: { user: { id: user.id } },
        select: ['id'],
      });
      const shopIds = shops.map((shop) => shop.id);
      if (shopIds.length > 0) {
        queryBuilder.andWhere('product.shopId IN (:...shopIds)', { shopIds });
      }
    }

    if (onlyVisible || onlyVisible === undefined) {
      queryBuilder.andWhere('product.visible = :visible', { visible: true });
    }

    const products = await queryBuilder.orderBy('product.updated', 'DESC').getMany();

    // ✅ Se price for nulo, define como price + 10%
    for (const product of products) {
      if (product.price == null) {
        product.price = Math.round(product.purchasePrice * 1.1);
      }
    }

    return products;
  }

  async getProductsByShopId(shopId: number): Promise<Product[]> {
    return this.productsRepository.find({
      where: { shop: { id: shopId } },
      relations: ['shop', 'attributes', 'photos'],
      order: { updated: 'DESC' },
    });
  }

  async getProduct(id: number, withHidden = false, user?: User): Promise<Product> {
    const whereCondition: any = { id };
  
    if (!withHidden) {
      whereCondition.visible = true;
    }
  
    if (user) {
      const shopIds = await this.shopsService.getShopIdsByUser(user);
      if (shopIds.length === 0) {
        throw new NotFoundError('product', 'id', id.toString());
      }
      whereCondition.shop = { id: In(shopIds) };
    }
  
    const product = await this.productsRepository.findOne({
    where: whereCondition,
    relations: ['shop'],
    });

    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }

    // ✅ Corrige price se estiver ausente
    if (product.price == null) {
      product.price = Math.round(product.purchasePrice * 1.1);
    }

    return product;
  }
  

  async createProduct(productData: ProductCreateDto, user?: User): Promise<Product> {
    const product = new Product();
  
    product.name = productData.name;
    product.purchasePrice = productData.purchasePrice;
    product.price = Math.round(productData.purchasePrice * 1.1);
    const calculatedSalesPrice = Math.round(productData.purchasePrice * 1.1);

    if (productData.price !== undefined && productData.price < productData.purchasePrice) {
      throw new BadRequestException('O preço de venda (purchasePrice) não pode ser inferior ao preço base (price).');
    }
    product.price = calculatedSalesPrice;
    product.description = productData.description;
    product.stock = productData.stock;
    // product.comission = productData.comission;
    product.visible = productData.visible ?? true;
    product.photosOrder = '';
  
    const shop = await this.shopsRepository.findOne({
      where: { user: { id: user.id } },
    });
  
    if (!shop) {
      throw new NotFoundException(`Loja associada ao utilizador não encontrada.`);
    }
  
    product.shop = shop;
  
    return this.productsRepository.save(product);
  }
  
  

  async updateProduct(
    id: number,
    productData: ProductUpdateDto,
  ): Promise<Product> {
    const product = await this.getProduct(id, true);
    if (productData.photosOrder) {
      await this.checkProductPhotosOrder(product, productData.photosOrder);
    }

    // Atualiza os campos existentes
    Object.assign(product, productData);

    // Recalcula o purchasePrice se necessário
    if (productData.comission !== undefined) {
      const commissionPercentage = productData.comission;
      const basePrice = productData.purchasePrice ?? product.purchasePrice; // usa o novo preço se informado

      const calculatedSalesPrice = basePrice * (1 + commissionPercentage / 100);

      // Só recalcula price se não foi informado manualmente
      if (productData.price === undefined) {
        product.price = calculatedSalesPrice;
      }
    }

        // Se purchasePrice foi atualizado, recalcula o price com 10%
    if (productData.purchasePrice !== undefined) {
      product.price = Math.round(productData.purchasePrice * 1.1);
    }


    // Validação: price não pode ser menor que price
    const finalPrice = productData.price ?? product.purchasePrice;
    const finalSalesPrice = productData.price ?? product.price;

    if (finalSalesPrice < finalPrice) {
      throw new BadRequestException(
        'O preço de venda (price) não pode ser inferior ao preço base (purchasePrice).',
      );
    }

    return this.productsRepository.save(product);
  }


  async checkProductPhotosOrder(product: Product, newOrder: string) {
    const photos = product.photos;
    const sortedPhotos = photos.sort((a, b) => a.id - b.id).map((p) => p.id);
    const sortedNewOrder = newOrder
      .split(',')
      .map((p) => parseInt(p))
      .sort((a, b) => a - b);
    if (sortedPhotos.join(',') !== sortedNewOrder.join(',')) {
      throw new NotFoundError('product photo');
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    await this.getProduct(id, true);
    await this.productsRepository.delete({ id });
    return true;
  }

  async checkProductsStocks(items: OrderItem[]) {
    const products = await this.productsRepository.find({
      where: { id: In(items.map((i) => i.product.id)) },
    });
    for (const p of products) {
      const item = items.find((i) => i.product.id === p.id);
      if (item && p.stock < item.quantity) {
        return false;
      }
    }
    return true;
  }

  async updateProductsStocks(type: 'add' | 'subtract', items: OrderItem[]) {
    const products = await this.productsRepository.find({
      where: { id: In(items.map((i) => i.product.id)) },
    });
    for (const p of products) {
      const item = items.find((i) => i.product.id === p.id);
      if (!item) {
        continue;
      }
      if (type === 'add') {
        p.stock += item.quantity;
      } else {
        p.stock -= item.quantity;
      }
      await this.productsRepository.save(p);
    }
  }

  async updateProductAttributes(
    id: number,
    attributes: AttributeDto[],
  ): Promise<Product> {
    const product = await this.getProduct(id, true);
    const attributesToSave = [];
    for (const attribute of attributes) {
      const attributeType = await this.attributeTypesService.getAttributeType(
        attribute.typeId,
      );
      await this.attributeTypesService.checkAttributeType(
        attributeType.valueType,
        attribute.value,
      );
      const newAttribute = new Attribute();
      newAttribute.type = attributeType;
      newAttribute.value = attribute.value;
      attributesToSave.push(newAttribute);
    }
    product.attributes = await this.attributesRepository.save(attributesToSave);
    return this.productsRepository.save(product);
  }

  async getLowStockProductsCount(quantity: number, user?: User): Promise<number> {
    const queryBuilder = this.productsRepository.createQueryBuilder('product');
    
    queryBuilder.where('product.stock < :quantity', { quantity });

    if (user) {
      const shops = await this.shopsRepository.find({
        where: { user: { id: user.id } },
        select: ['id'],
      });
      const shopIds = shops.map((shop) => shop.id);
      if (shopIds.length > 0) {
        queryBuilder.andWhere('product.shopId IN (:...shopIds)', { shopIds });
      }
    }

    return queryBuilder.getCount();
  }

  async getProductsPaginated(
    filters: ProductFilterDto,
    user: User,
    onlyVisible: boolean,
    page: number,
    limit: number,
  ) {
    const { id, name, shopName, minStock, maxStock, minPrice, maxPrice } = filters;
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.shop', 'shop')
      .leftJoinAndSelect('product.attributes', 'attributes')
      .leftJoinAndSelect('product.photos', 'photos');

    if (id) {
      queryBuilder.andWhere('product.id = :id', { id: +id });
    }
    if (name) {
      queryBuilder.andWhere('LOWER(product.name) LIKE LOWER(:name)', { name: `%${name}%` });
    }
    if (shopName) {
      queryBuilder.andWhere('LOWER(shop.shopName) LIKE LOWER(:shopName)', {
        shopName: `%${shopName}%`,
      });
    }
    if (minStock !== undefined) {
      queryBuilder.andWhere('product.stock >= :minStock', { minStock });
    }
    if (maxStock !== undefined) {
      queryBuilder.andWhere('product.stock <= :maxStock', { maxStock });
    }
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }
    if (user) {
      const shops = await this.shopsRepository.find({
        where: { user: { id: user.id } },
        select: ['id'],
      });
      const shopIds = shops.map((shop) => shop.id);
      if (shopIds.length > 0) {
        queryBuilder.andWhere('product.shopId IN (:...shopIds)', { shopIds });
      }
    }
    if (onlyVisible || onlyVisible === undefined) {
      queryBuilder.andWhere('product.visible = :visible', { visible: true });
    }

    const [products, total] = await queryBuilder
      .orderBy('product.updated', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    for (const product of products) {
      if (product.price == null) {
        product.price = Math.round(product.purchasePrice * 1.1);
      }
    }

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
