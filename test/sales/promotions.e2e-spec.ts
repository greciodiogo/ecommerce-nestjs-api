import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Promotion } from '../../src/sales/promotions/models/promotion.entity';
import { Category } from '../../src/catalog/categories/models/category.entity';
import { Role } from '../../src/users/models/role.enum';
import { setupTestUsers } from '../utils/setup-rbac-tests';

describe('Promotions (e2e)', () => {
  let app: INestApplication;
  let promotionsRepository: Repository<Promotion>;
  let categoriesRepository: Repository<Category>;
  let adminToken: string;
  let managerToken: string;
  let customerToken: string;
  let testCategory: Category;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    promotionsRepository = moduleFixture.get<Repository<Promotion>>(
      getRepositoryToken(Promotion),
    );
    categoriesRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );

    // Setup test users
    const tokens = await setupTestUsers(app);
    adminToken = tokens.adminToken;
    managerToken = tokens.managerToken;
    customerToken = tokens.customerToken;

    // Create a test category
    testCategory = categoriesRepository.create({
      name: 'Test Category',
      description: 'Test Category Description',
      slug: 'test-category',
    });
    await categoriesRepository.save(testCategory);
  });

  afterAll(async () => {
    await promotionsRepository.clear();
    await categoriesRepository.clear();
    await app.close();
  });

  beforeEach(async () => {
    await promotionsRepository.clear();
  });

  describe('POST /promotions', () => {
    it('should create a promotion (Admin)', () => {
      const promotionData = {
        name: 'Summer Sale',
        description: 'Summer sale with 20% discount',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        discount: 20,
        categoryIds: [testCategory.id],
        isActive: true,
      };

      return request(app.getHttpServer())
        .post('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(promotionData)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(promotionData.name);
          expect(res.body.description).toBe(promotionData.description);
          expect(res.body.discount).toBe(promotionData.discount);
          expect(res.body.isActive).toBe(promotionData.isActive);
          expect(res.body.categories).toHaveLength(1);
          expect(res.body.categories[0].id).toBe(testCategory.id);
        });
    });

    it('should create a promotion (Manager)', () => {
      const promotionData = {
        name: 'Winter Sale',
        description: 'Winter sale with 15% discount',
        startDate: '2024-12-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.000Z',
        discount: 15,
        categoryIds: [testCategory.id],
        isActive: true,
      };

      return request(app.getHttpServer())
        .post('/promotions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(promotionData)
        .expect(201);
    });

    it('should not create a promotion (Customer)', () => {
      const promotionData = {
        name: 'Customer Sale',
        description: 'Customer sale',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        discount: 10,
        categoryIds: [testCategory.id],
      };

      return request(app.getHttpServer())
        .post('/promotions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(promotionData)
        .expect(403);
    });

    it('should not create a promotion with invalid dates', () => {
      const promotionData = {
        name: 'Invalid Sale',
        description: 'Invalid sale',
        startDate: '2024-08-31T23:59:59.000Z',
        endDate: '2024-06-01T00:00:00.000Z', // End date before start date
        discount: 10,
        categoryIds: [testCategory.id],
      };

      return request(app.getHttpServer())
        .post('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(promotionData)
        .expect(400);
    });

    it('should not create a promotion with invalid discount', () => {
      const promotionData = {
        name: 'Invalid Sale',
        description: 'Invalid sale',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        discount: 150, // More than 100%
        categoryIds: [testCategory.id],
      };

      return request(app.getHttpServer())
        .post('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(promotionData)
        .expect(400);
    });
  });

  describe('GET /promotions', () => {
    it('should get all promotions', async () => {
      // Create a test promotion
      const promotion = promotionsRepository.create({
        name: 'Test Promotion',
        description: 'Test Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      await promotionsRepository.save(promotion);

      return request(app.getHttpServer())
        .get('/promotions')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].name).toBe('Test Promotion');
        });
    });
  });

  describe('GET /promotions/active', () => {
    it('should get only active promotions', async () => {
      // Create active promotion
      const activePromotion = promotionsRepository.create({
        name: 'Active Promotion',
        description: 'Active Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      await promotionsRepository.save(activePromotion);

      // Create inactive promotion
      const inactivePromotion = promotionsRepository.create({
        name: 'Inactive Promotion',
        description: 'Inactive Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 15,
        isActive: false,
        categories: [testCategory],
      });
      await promotionsRepository.save(inactivePromotion);

      return request(app.getHttpServer())
        .get('/promotions/active')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const activePromotions = res.body.filter((p: any) => p.isActive);
          expect(activePromotions.length).toBeGreaterThan(0);
          expect(activePromotions.every((p: any) => p.isActive)).toBe(true);
        });
    });
  });

  describe('GET /promotions/category/:categoryId', () => {
    it('should get promotions for a specific category', async () => {
      // Create a promotion for the test category
      const promotion = promotionsRepository.create({
        name: 'Category Promotion',
        description: 'Category Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        discount: 25,
        isActive: true,
        categories: [testCategory],
      });
      await promotionsRepository.save(promotion);

      return request(app.getHttpServer())
        .get(`/promotions/category/${testCategory.id}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].name).toBe('Category Promotion');
        });
    });
  });

  describe('GET /promotions/:id', () => {
    it('should get a specific promotion', async () => {
      const promotion = promotionsRepository.create({
        name: 'Specific Promotion',
        description: 'Specific Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 30,
        isActive: true,
        categories: [testCategory],
      });
      const savedPromotion = await promotionsRepository.save(promotion);

      return request(app.getHttpServer())
        .get(`/promotions/${savedPromotion.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(savedPromotion.id);
          expect(res.body.name).toBe('Specific Promotion');
        });
    });

    it('should return 404 for non-existent promotion', () => {
      return request(app.getHttpServer())
        .get('/promotions/99999')
        .expect(404);
    });
  });

  describe('PATCH /promotions/:id', () => {
    it('should update a promotion (Admin)', async () => {
      const promotion = promotionsRepository.create({
        name: 'Original Name',
        description: 'Original Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      const savedPromotion = await promotionsRepository.save(promotion);

      const updateData = {
        name: 'Updated Name',
        discount: 25,
      };

      return request(app.getHttpServer())
        .patch(`/promotions/${savedPromotion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.discount).toBe(25);
          expect(res.body.description).toBe('Original Description'); // Should remain unchanged
        });
    });

    it('should not update a promotion (Customer)', async () => {
      const promotion = promotionsRepository.create({
        name: 'Test Promotion',
        description: 'Test Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      const savedPromotion = await promotionsRepository.save(promotion);

      const updateData = {
        name: 'Updated Name',
      };

      return request(app.getHttpServer())
        .patch(`/promotions/${savedPromotion.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('PATCH /promotions/:id/toggle', () => {
    it('should toggle promotion status (Admin)', async () => {
      const promotion = promotionsRepository.create({
        name: 'Toggle Test',
        description: 'Toggle Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      const savedPromotion = await promotionsRepository.save(promotion);

      return request(app.getHttpServer())
        .patch(`/promotions/${savedPromotion.id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(false);
        });
    });

    it('should not toggle promotion status (Customer)', async () => {
      const promotion = promotionsRepository.create({
        name: 'Toggle Test',
        description: 'Toggle Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      const savedPromotion = await promotionsRepository.save(promotion);

      return request(app.getHttpServer())
        .patch(`/promotions/${savedPromotion.id}/toggle`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('DELETE /promotions/:id', () => {
    it('should delete a promotion (Admin)', async () => {
      const promotion = promotionsRepository.create({
        name: 'Delete Test',
        description: 'Delete Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      const savedPromotion = await promotionsRepository.save(promotion);

      return request(app.getHttpServer())
        .delete(`/promotions/${savedPromotion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should not delete a promotion (Customer)', async () => {
      const promotion = promotionsRepository.create({
        name: 'Delete Test',
        description: 'Delete Description',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        discount: 20,
        isActive: true,
        categories: [testCategory],
      });
      const savedPromotion = await promotionsRepository.save(promotion);

      return request(app.getHttpServer())
        .delete(`/promotions/${savedPromotion.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
}); 