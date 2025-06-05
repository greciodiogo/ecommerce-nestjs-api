import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Shop } from './models/shop.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ShopCreateDto } from './dto/shop-create.dto';
import { UsersService } from '../../users/users.service';
import { ProductsService } from '../../catalog/products/products.service';
import { ShopUpdateDto } from './dto/shop-update.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { Role } from '../../users/models/role.enum';
import { ShopItemDto } from './dto/shop-item.dto';
import { ShopItem } from './models/shop-item.entity'; 
import * as argon2 from 'argon2';
import { User } from 'src/users/models/user.entity';


@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopsRepository: Repository<Shop>,

    private readonly usersService: UsersService,

    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}


  async getShops(withUser = false, withProducts = false): Promise<Shop[]> {
    return this.shopsRepository.find({
      relations: [
        ...(withUser ? ['user'] : []),
        'products',
        ...(withProducts ? ['products.product'] : []),
      ],
    });
  }

  async getUserShops(userId: number): Promise<Shop[]> {
    return this.shopsRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'products',
        'products.product',
      ],
    });
  }

   async getShop(id: number): Promise<Shop> {
     const shop = await this.shopsRepository.findOne({
       where: { id },
     });
     if (!shop) {
       throw new NotFoundError('shop', 'id', id.toString());
     }
     return shop;
   }

  async createShop(
    shopData: ShopCreateDto,
  ): Promise<any> {
    const shop = new Shop();

    shop.products = await this.getItems(shop, shopData.products);
    shop.shopName = shopData.shopName;
    shop.alvara = shopData.alvara;
    shop.contactPhone = shopData.contactPhone;
    shop.nif = shopData.nif;
    shop.address = shopData.address;
    
    const savedShop = await this.shopsRepository.save(shop);

    const hashedPassword = await argon2.hash(shopData.password);
    const userResponse = await this.usersService.addUser(
      shopData.email,
      hashedPassword,
      shop.shopName,
      '',
      Role.Sales // ou 'sales' dependendo de como defines os enums
    );

    await this.updateShop(savedShop.id, { userId: userResponse.id });

    return savedShop;
  }

  private async getItems(shop: Shop, items: ShopItemDto[]) {
    const res = [];
    for (const item of items) {
      const product = await this.productsService.getProduct(
        item.productId,
        shop.user &&
          [Role.Admin, Role.Manager, Role.Sales].includes(shop.user.role),
      );
      res.push({
        product,
      } as ShopItem);
    }
    return res;
  }

  async updateShop(
    id: number,
    shopData: ShopUpdateDto,
  ): Promise<Shop> {
    const shop = await this.getShop(id);
    if (shopData.products) {
      shop.products = await this.getItems(shop, shopData.products);
    }

    if (shopData.userId) {
      const user = await this.usersService.getUser(shopData.userId);

      if (!user) {
        throw new NotFoundException(`User with ID ${shopData.userId} not found`);
      }

      shop.user = user;
    }

    const { products, userId, ...rest } = shopData;
    Object.assign(shop, rest);

    return this.shopsRepository.save(shop);
  }

  async deleteShop(id: number): Promise<void> {
    await this.getShop(id);
    await this.shopsRepository.delete({ id });
    return;
  }

  async getShopIdsByUser(user: User): Promise<number[]> {
    const shops = await this.shopsRepository.find({
      where: { user: { id: user.id } },
      select: ['id'],
    });
    return shops.map((shop) => shop.id);
  }
    
}
