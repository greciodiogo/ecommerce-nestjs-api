import { Injectable, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductPhoto } from './models/product-photo.entity';
import { Repository } from 'typeorm';
import { LocalFilesService } from '../../../local-files/local-files.service';
import { NotFoundError } from '../../../errors/not-found.error';
import { Product } from '../models/product.entity';
import { FileDTO } from 'src/local-files/upload.dto';

@Injectable()
export class ProductPhotosService {
  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    @InjectRepository(ProductPhoto)
    private productPhotosRepository: Repository<ProductPhoto>,
    private localFilesService: LocalFilesService,
  ) {}

  async getProductPhotos(): Promise<ProductPhoto[]> {
    return this.productPhotosRepository.find({
      relations: ['product'],
    });
  }

 async getProductPhoto(
    productId: number,
    photoId: number,
    thumbnail: boolean,
  ) {
    const productPhoto = await this.productPhotosRepository.findOne({
      where: { id: photoId, product: { id: productId } },
    });

    if (!productPhoto) {
      throw new NotFoundError('product photo', 'id', photoId.toString());
    }

    const path = thumbnail ? productPhoto.thumbnailPath : productPhoto.path;
    const mimeType = productPhoto.mimeType;

    const file = await this.localFilesService.getPhoto(path);
    if (!file) {
      throw new NotFoundError('product photo', 'file', path);
    }

    return await file;
  }

  async createProductPhoto(
    id: number,
    file: FileDTO,
    mimeType: string,
  ): Promise<ProductPhoto> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    const photo = new ProductPhoto();
    
    let extension = file.originalname.split('.').pop();
    const filePath = `originals/${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}.${extension}`;
    photo.path = filePath;
    photo.mimeType = mimeType;
    photo.thumbnailPath = await this.localFilesService.createPhotoThumbnail(
      file,
    );
    photo.placeholderBase64 =
      await this.localFilesService.createPhotoPlaceholder(file);
    product.photos.push(photo);
    await this.productsRepository.save(product);
    if (product.photosOrder) {
      product.photosOrder = [...product.photosOrder.split(','), photo.id].join(
        ',',
      );
    } else {
      product.photosOrder = photo.id?.toString();
    }
    await this.productsRepository.save(product);
    return photo;
  }

  async addProductPhoto(id: number, file: FileDTO): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id }, relations: ['photos'] });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }

    const photo = new ProductPhoto();
    const { path, mimeType } = await this.localFilesService.savePhoto(file);
    photo.path = path;
    photo.mimeType = mimeType;
    photo.thumbnailPath = await this.localFilesService.createPhotoThumbnail(file);

    product.photos.push(photo);

    await this.productsRepository.save(product);

    product.photosOrder = product.photosOrder
      ? [...product.photosOrder.split(','), photo.id].join(',')
      : photo.id.toString();

    return this.productsRepository.save(product);
  }

  async deleteProductPhoto(id: number, photoId: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    product.photos = product.photos.filter((p) => p.id !== photoId);
    await this.productsRepository.save(product);
    if (product.photosOrder) {
      product.photosOrder = product.photosOrder
        .split(',')
        .filter((p) => p !== photoId.toString())
        .join(',');
    }
    return this.productsRepository.save(product);
  }
}
