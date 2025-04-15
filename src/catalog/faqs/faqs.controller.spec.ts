import { Test, TestingModule } from '@nestjs/testing';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Faq } from './models/faq.entity';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { FaqCreateDto } from './dto/faq-create.dto';
import { FaqUpdateDto } from './dto/faq-update.dto';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { NotFoundError } from '../../errors/not-found.error';
import { AttributeType } from '../attribute-types/models/attribute-type.entity';
import { AttributeTypesService } from '../attribute-types/attribute-types.service';

describe('FaqsController', () => {
  let controller: FaqsController;
  let generate: DtoGeneratorService['generate'];
  let mockFaqsRepository: RepositoryMockService<Faq>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaqsController],
      providers: [
        FaqsService,
        AttributeTypesService,
        RepositoryMockService.getProvider(Faq),
        RepositoryMockService.getProvider(AttributeType),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<FaqsController>(FaqsController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockFaqsRepository = module.get(getRepositoryToken(Faq));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFaqs', () => {
    it('should return all products', async () => {
      expect(await controller.getFaqs()).toEqual(mockFaqsRepository.entities);
    });
  });

  describe('getFaq', () => {
    it('should return a product with given id', async () => {
      const product = {
        ...generate(FaqCreateDto, true),
        id: 1,
        attributes: [],
        visible: true,
      };
      mockFaqsRepository.save(product);
      expect(await controller.getFaq(1)).toEqual({
        ...product,
        photos: [],
        created: expect.any(Date),
        updated: expect.any(Date),
        ratings: [],
        photosOrder: '',
      });
    });

    it('should throw error if product not found', async () => {
      await expect(controller.getFaq(12345)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createFaq', () => {
    it('should create a product', async () => {
      const createData = generate(FaqCreateDto, true);
      const created = await controller.createFaq(createData);
      expect(created).toEqual({
        ...createData,
        id: expect.any(Number),
        attributes: [],
        photos: [],
        ratings: [],
        created: expect.any(Date),
        updated: expect.any(Date),
        photosOrder: '',
      });
    });
  });

  describe('updateFaq', () => {
    it('should update a product', async () => {
      const createData = generate(FaqCreateDto, true);
      const { id } = await controller.createFaq(createData);
      const updateData = generate(FaqUpdateDto, true);
      const updated = await controller.updateFaq(id, updateData);
      expect(updated).toEqual({
        ...updateData,
        id: expect.any(Number),
        attributes: [],
        photos: [],
        ratings: [],
        created: expect.any(Date),
        updated: expect.any(Date),
        photosOrder: '',
      });
    });

    it('should throw error when product not found', async () => {
      await expect(controller.updateFaq(12345, {})).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteFaq', () => {
    it('should delete a product', async () => {
      const createData = generate(FaqCreateDto);
      const { id } = await controller.createFaq(createData);
      await controller.deleteFaq(id);
      expect(
        mockFaqsRepository.entities.find((p) => p.id === id),
      ).toBeUndefined();
    });

    it('should throw error when product not found', async () => {
      await expect(controller.deleteFaq(12345)).rejects.toThrow(NotFoundError);
    });
  });
});
