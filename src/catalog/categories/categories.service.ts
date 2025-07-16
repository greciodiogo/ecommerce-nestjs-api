import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './models/category.entity';
import { Repository } from 'typeorm';
import { Product } from '../products/models/product.entity';
import { CategoryCreateDto } from './dto/category-create.dto';
import { CategoryUpdateDto } from './dto/category-update.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { NotRelatedError } from '../../errors/not-related.error';
import { CategoryGroup } from './models/category-group.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(CategoryGroup)
    private categoryGroupsRepository: Repository<CategoryGroup>,
    private productsService: ProductsService,
  ) {}

  async getCategories(withProducts = false): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: ['parentCategory', ...(withProducts ? ['products'] : [])],
    });
  }

  async getCategory(
    id: number,
    children = true,
    products = false,
  ): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      order: {
        id: 'DESC', //g ou 'DESC' se quiser mas recentes primeiro
    },
      relations: [
        'parentCategory',
        ...(children ? ['childCategories'] : []),
        ...(products
          ? ['products', 'products.attributes', 'products.attributes.type']
          : []),
      ],
    });
    if (!category) {
      throw new NotFoundError('category', 'id', id.toString());
    }
    return category;
  }

  async getCategoryBySlug(
    slug: string,
    children = true,
    products = false,
  ): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
      relations: [
        'parentCategory',
        ...(children ? ['childCategories'] : []),
        ...(products
          ? ['products', 'products.attributes', 'products.attributes.type']
          : []),
      ],
    });
    if (!category) {
      throw new NotFoundError('category', 'slug', slug);
    }
    return category;
  }

  async getCategoryGroups(): Promise<CategoryGroup[]> {
    return await this.categoryGroupsRepository.find({
      relations: ['categories'],
    });
  }

  async createCategory(categoryData: CategoryCreateDto): Promise<Category> {
    const category = new Category();
    Object.assign(category, categoryData);
    if (categoryData.parentCategoryId) {
      await this.updateParentCategory(category, categoryData.parentCategoryId);
    }
    return this.categoriesRepository.save(category);
  }

  async updateCategory(
    id: number,
    categoryData: CategoryUpdateDto,
  ): Promise<Category> {
    const category = await this.getCategory(id, false);
    Object.assign(category, categoryData);
    if (categoryData.parentCategoryId) {
      await this.updateParentCategory(category, categoryData.parentCategoryId);
    }
    if (categoryData.groups) {
      category.groups = [];
      for (const groupData of categoryData.groups) {
        let group = await this.categoryGroupsRepository.findOne({
          where: { name: groupData.name },
        });
        if (!group) {
          group = new CategoryGroup();
          group.name = groupData.name;
          group = await this.categoryGroupsRepository.save(group);
        }
        category.groups.push(group);
      }
    }
    return this.categoriesRepository.save(category);
  }

  private async updateParentCategory(
    category: Category,
    parentCategoryId: number,
  ): Promise<boolean> {
    category.parentCategory = await this.getCategory(parentCategoryId, false);
    return true;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await this.getCategory(id, false);
    await this.categoriesRepository.delete({ id });
    return true;
  }

  async getCategoryProducts(
    id: number,
    withHidden?: boolean,
  ): Promise<Product[]> {
    const category = await this.getCategory(id, false, true);
    if (!withHidden) {
      return category.products.filter((product) => product.visible);
    }
    return category.products;
  }

  async getCategoryProductsBySlug(
    slug: string,
    withHidden?: boolean,
  ): Promise<Product[]> {
    const category = await this.getCategoryBySlug(slug, false, true);
    if (!withHidden) {
      return category.products.filter((product) => product.visible);
    }
    return category.products;
  }

  async addCategoryProduct(id: number, productId: number): Promise<Product> {
    const product = await this.productsService.getProduct(productId, true);
    const category = await this.getCategory(id, false, true);
    category.products.push(product);
    await this.categoriesRepository.save(category);
    return product;
  }

  async deleteCategoryProduct(id: number, productId: number): Promise<boolean> {
    const product = await this.productsService.getProduct(productId, true);
    const category = await this.getCategory(id, false, true);
    if (!category.products.some((p) => p.id === product.id)) {
      throw new NotRelatedError('category', 'product');
    }
    category.products = category.products.filter((p) => p.id !== product.id);
    await this.categoriesRepository.save(category);
    return true;
  }

  async getCategoryProductsPaginated(
    id: number,
    page: number,
    limit: number,
    withHidden?: boolean,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const category = await this.getCategory(id, false, true);
    let products = withHidden ? category.products : category.products.filter((product) => product.visible);
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = products.slice(start, end);
    return { data, total, page, limit, totalPages };
  }
}
