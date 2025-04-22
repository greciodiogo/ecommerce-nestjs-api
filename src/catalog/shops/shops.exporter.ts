import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { Shop } from './models/shop.entity';
import { ShopsService } from './shops.service';
import { ShopItem } from './models/shop-item.entity';

@Injectable()
export class ShopsExporter implements Exporter<Shop> {
  constructor(private shopsService: ShopsService) {}

  async export(): Promise<Shop[]> {
    const shops = await this.shopsService.getShops(true, true);
    const preparedShops: Shop[] = [];
    for (const shop of shops) {
      preparedShops.push(this.prepareShop(shop));
    }
    return preparedShops;
  }

  private prepareShop(shop: Shop) {
    const preparedShop = new Shop() as any;
    preparedShop.id = shop.id;
    preparedShop.created = shop.created;
    preparedShop.updated = shop.updated;
    preparedShop.userId = shop.user?.id ?? null;
    preparedShop.shopName = shop.shopName;
    preparedShop.alvara = shop.alvara;
    preparedShop.contactPhone = shop.contactPhone;
    preparedShop.nif = shop.nif;
    preparedShop.address = shop.address;
    preparedShop.items = shop.products.map((item) =>
      this.prepareShopItem(item),
    );
    return preparedShop;
  }


  private prepareShopItem(item: ShopItem) {
    const preparedItem = new ShopItem() as any;
    preparedItem.productId = item.product.id;
    return preparedItem;
  }
}
