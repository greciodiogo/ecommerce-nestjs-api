import { Test, TestingModule } from '@nestjs/testing';
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

describe('FaqsService', () => {
  let service: FaqsService;
  let generate: DtoGeneratorService['generate'];
  let mockFaqsRepository: RepositoryMockService<Faq>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaqsService,
        AttributeTypesService,
        RepositoryMockService.getProvider(Faq),
        RepositoryMockService.getProvider(AttributeType),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<FaqsService>(FaqsService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockFaqsRepository = module.get(getRepositoryToken(Faq));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFaqs', () => {
    it('should return all faqs', async () => {
      const faqs = await service.getFaqs();
      expect(faqs).toEqual(mockFaqsRepository.find());
    });
  });

  describe('getFaq', () => {
    it('should return a product with given id', async () => {
      const createData = generate(FaqCreateDto);
      const { id } = mockFaqsRepository.save(createData);
      const product = await service.getFaq(id);
      expect(product).toEqual({
        ...createData,
        id,
        visible: true,
        created: expect.any(Date),
        updated: expect.any(Date),
      });
    });
  });

  describe('createFaq', () => {
    it('should create a product', async () => {
      const createData = generate(FaqCreateDto);
      const created = await service.createFaq(createData);
      expect(created).toEqual({
        ...createData,
        id: expect.any(Number),
        visible: true,
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockFaqsRepository.entities.some(
          (p) => p.question === createData.question,
        ),
      ).toBeTruthy();
    });
  });

  describe('updateFaq', () => {
    it('should update a product', async () => {
      const createData = generate(FaqCreateDto);
      const { id } = mockFaqsRepository.save(createData);
      const updateData = generate(FaqUpdateDto, true);
      const updated = await service.updateFaq(id, updateData);
      expect(updated).toEqual({
        ...updateData,
        id,
        attributes: [],
        photos: [],
        ratings: [],
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockFaqsRepository.entities.some(
          (p) => p.question === updateData.question,
        ),
      ).toBeTruthy();
    });

    it('should throw error if product not found', async () => {
      await expect(service.updateFaq(12345, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteFaq', () => {
    it('should delete a product', async () => {
      const createData = generate(FaqCreateDto);
      const { id } = mockFaqsRepository.save(createData);
      const deleted = await service.deleteFaq(id);
      expect(deleted).toBe(true);
      expect(
        mockFaqsRepository.entities.find((p) => p.id === id),
      ).toBeUndefined();
    });

    it('should throw error if product not found', async () => {
      await expect(service.deleteFaq(12345)).rejects.toThrow(NotFoundError);
    });
  });
});
