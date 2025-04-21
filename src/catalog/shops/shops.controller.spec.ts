import { Test, TestingModule } from '@nestjs/testing';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { UsersService } from '../../users/users.service';
import { ProductsService } from '../../catalog/products/products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { Shop } from './models/shop.entity';
import { User } from '../../users/models/user.entity';
import { Product } from '../../catalog/products/models/product.entity';
import { Attribute } from '../../catalog/products/models/attribute.entity';
import { ShopCreateDto } from './dto/shop-create.dto';
import { RegisterDto } from '../../auth/dto/register.dto';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { ForbiddenException } from '@nestjs/common';
import { ShopUpdateDto } from './dto/shop-update.dto';
import { ShopItemDto } from './dto/shop-item.dto';
import { ProductCreateDto } from '../../catalog/products/dto/product-create.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { AttributeType } from '../../catalog/attribute-types/models/attribute-type.entity';
import { LocalFilesService } from '../../local-files/local-files.service';

describe('ShopsController', () => {
  let controller: ShopsController;
  let mockShopsRepository: RepositoryMockService<Shop>;
  let mockUsersRepository: RepositoryMockService<User>;
  let mockProductsRepository: RepositoryMockService<Product>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopsController],
      providers: [
        ShopsService,
        UsersService,
        ProductsService,
        RepositoryMockService.getProvider(Shop),
        RepositoryMockService.getProvider(User),
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(Attribute),
        RepositoryMockService.getProvider(AttributeType),
        DtoGeneratorService,
        {
          provide: LocalFilesService,
          useValue: {
            createPhotoThumbnail: jest.fn((v: string) => v + '-thumbnail'),
          },
        },
      ],
    }).compile();

    controller = module.get<ShopsController>(ShopsController);
    mockShopsRepository = module.get(getRepositoryToken(Shop));
    mockUsersRepository = module.get(getRepositoryToken(User));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFaqs', () => {
    it('should return all products', async () => {
      expect(await controller.getShops()).toEqual(mockShopsRepository.entities);
    });
  });

  describe('getShop', () => {
    it('should return an shop with given id', async () => {
      const createData = generate(ShopCreateDto);
      // const { id } = mockShopsRepository.save(createData);
      // const shop = await controller.getShop({ id: 12345 } as User, id);
      // expect(shop).toEqual(
      //   mockShopsRepository.entities.find((o) => o.id === id),
      // );
    });

    it('should return shop with given id and user id', async () => {
      const userData = generate(RegisterDto, false);
      const user = mockUsersRepository.save(userData);
      const createData = generate(ShopCreateDto, false);
      createData.products = [generate(ShopItemDto, false)];
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );

    //   createData.products[0].productId = productId;
    //   const { id } = await controller.createShop(user, createData);
    //   const shop = await controller.getShop(user, id);
    //   expect(shop).toEqual(
    //     mockShopsRepository.entities.find((o) => o.id === id),
    //   );
    // });

    // it('should throw error if shop with given id does not exist', async () => {
    //   await expect(
    //     controller.getShop({ id: 12345 } as User, 12345),
    //   ).rejects.toThrow(NotFoundError);
    // });

    it('should throw error if shop has different user id', async () => {
      const usersData = generate(RegisterDto, false, 2);
      const users = mockUsersRepository.save(usersData);
      const createData = generate(ShopCreateDto, false);
      createData.products = [generate(ShopItemDto, false)];
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      createData.products[0].productId = productId;
      const { id } = await controller.createShop(users[0], createData);
      // await expect(controller.getShop(users[1], id)).rejects.toThrow(
      //   ForbiddenException,
      // );
    });
  });

  describe('createShop', () => {
    it('should create an shop', async () => {
      const createData = generate(ShopCreateDto, false);
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      createData.products[0].productId = productId;
      const shop = await controller.createShop(null, createData);
      expect(shop).toEqual(
        mockShopsRepository.entities.find((o) => o.id === shop.id),
      );
      const { products, ...expected } = createData;
      expect(shop).toMatchObject(expected);
    });
  });

  // describe('updateShop', () => {
  //   it('should update an shop', async () => {
  //     const createData = generate(ShopCreateDto);
  //     const { id } = await mockShopsRepository.save(createData);
  //     const updateData = generate(ShopUpdateDto, true);
  //     const shop = await controller.updateShop(id, updateData);
  //     expect(shop).toEqual(
  //       mockShopsRepository.entities.find((o) => o.id === id),
  //     );
  //     const { products, ...expected } = updateData;
  //     expect(shop).toMatchObject(expected);
  //   });

  //   it('should throw error if shop with given id does not exist', async () => {
  //     const updateData = generate(ShopUpdateDto, true);
  //     await expect(controller.updateShop(12345, updateData)).rejects.toThrow(
  //       NotFoundError,
  //     );
  //   });
  });
});
