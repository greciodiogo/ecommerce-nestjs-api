import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopsRepository: Repository<Shop>,
    private readonly usersService: UsersService,
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
  ): Promise<Shop> {
    const shop = new Shop();

    shop.products = await this.getItems(shop, shopData.products);
    shop.shopName = shopData.shopName;
    shop.alvara = shopData.alvara;
    shop.contactPhone = shopData.contactPhone;
    shop.nif = shopData.nif;
    shop.address = shopData.address;
    return this.shopsRepository.save(shop);
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
    const { products, ...toAssign } = shopData;
    Object.assign(shop, toAssign);
    return this.shopsRepository.save(shop);
  }

  async deleteShop(id: number): Promise<void> {
    await this.getShop(id);
    await this.shopsRepository.delete({ id });
    return;
  }
}
