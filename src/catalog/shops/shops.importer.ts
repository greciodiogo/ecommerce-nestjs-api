import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { Shop } from './models/shop.entity';
import { ShopCreateDto } from './dto/shop-create.dto';
import { ShopItemDto } from './dto/shop-item.dto';
import { ShopsService } from './shops.service';

@Injectable()
export class ShopsImporter implements Importer {
  constructor(private shopsService: ShopsService) {}

  async import(
    shops: Collection,
  ): Promise<IdMap> {
    const parsedShops = this.parseShops(shops);
    const idMap: IdMap = {};
    for (const shop of parsedShops) {
      const { id, ...createDto } = shop as any;
      const { id: newId } = await this.shopsService.createShop(createDto);
      idMap[shop.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const shops = await this.shopsService.getShops();
    let deleted = 0;
    for (const shop of shops) {
      await this.shopsService.deleteShop(shop.id);
      deleted += 1;
    }
    return deleted;
  }

  private parseShops(shops: Collection) {
    const parsedShops: Shop[] = [];
    for (const shop of shops) {
      parsedShops.push(this.parseShop(shop));
    }
    return parsedShops;
  }

  private parseShop(shop: Collection[number]) {
    const parsedShop = new ShopCreateDto() as any;
    try {
      parsedShop.id = shop.id as number;
      parsedShop.created = new Date(shop.created as string);
      parsedShop.updated = new Date(shop.updated as string);
      parsedShop.fullName = shop.fullName as string;
      parsedShop.contactPhone = shop.contactPhone as string;
      parsedShop.contactEmail = shop.contactEmail as string;
      parsedShop.message = shop.message as string;
      // parsedShop.user = { id: usersIdMap[shop.userId as number] };

      if (typeof shop.items === 'string') {
        shop.items = JSON.parse(shop.items);
      }
      // parsedShop.items = (shop.items as Collection).map((item) =>
      //   this.parseShopItem(item, productsIdMap),
      // );
    } catch (e) {
      throw new ParseError('shop');
    }
    return parsedShop;
  }

  private parseShopItem(item: Collection[number], productsIdMap: IdMap) {
    const parsedItem = new ShopItemDto() as any;
    try {
      parsedItem.productId = productsIdMap[item.productId as number];
      parsedItem.quantity = item.quantity as number;
      parsedItem.price = item.price as number;
    } catch (e) {
      throw new ParseError('shop item');
    }
    return parsedItem;
  }
}
