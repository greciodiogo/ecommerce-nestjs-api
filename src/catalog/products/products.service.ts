import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './models/product.entity';
import { In, LessThan, Repository } from 'typeorm';
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

  async getProducts(user?: User, onlyVisible?: boolean): Promise<Product[]> {
    let shopIds: number[] = [];

    if (user) {
      const shops = await this.shopsRepository.find({
        where: { user: { id: user.id } }, // pegando id do objeto User
        select: ['id'],
      });
      shopIds = shops.map((shop) => shop.id);
    }
    const whereCondition: any = {};

      // ✅ Aplica o filtro só se foi explicitamente solicitado
    if (onlyVisible || onlyVisible === undefined) {
      whereCondition.visible = true;
    }
  
    if (shopIds.length > 0) {
      whereCondition.shop = { id: In(shopIds) };
    }
  
    const products = await this.productsRepository.find({
      where: whereCondition,
      relations: ['shop'],
    });

    // ✅ Se price for nulo, define como price + 10%
    for (const product of products) {
      if (product.price == null) {
        product.price = product.purchasePrice * 1.1;
      }
    }

    return products;
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
      product.price = product.purchasePrice * 1.1;
    }

    return product;
  }
  

  async createProduct(productData: ProductCreateDto, user?: User): Promise<Product> {
    const product = new Product();
  
    product.name = productData.name;
    product.purchasePrice = productData.purchasePrice;
    product.price = productData.purchasePrice * 1.1;
    const calculatedSalesPrice = productData.purchasePrice * 1.1;

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
      product.price = productData.purchasePrice * 1.1;
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

  async getLowStockProductsCount(quantity): Promise<number> {
    const lowStockProducts = await this.productsRepository.count({
      where: {
        stock: LessThan(quantity), // Usando LessThan ao invés de lt
      },
    });

    return lowStockProducts;
  }
}
