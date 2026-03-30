import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './models/banner.entity';
import { BannerCreateDto } from './dto/banner-create.dto';
import { BannerUpdateDto } from './dto/banner-update.dto';
import { NotFoundError } from '../errors/not-found.error';
import { LocalFilesService } from '../local-files/local-files.service';
import { FileDTO } from '../local-files/upload.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
    private localFilesService: LocalFilesService,
  ) {}

  async findAll() {
    return this.bannersRepository.find({
      order: { order: 'ASC', id: 'ASC' },
    });
  }

  async findActive() {
    return this.bannersRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const banner = await this.bannersRepository.findOne({
      where: { id },
    });
    if (!banner) {
      throw new NotFoundError('banner', 'id', id.toString());
    }
    return banner;
  }

  async create(
    data: BannerCreateDto,
    imagePt?: FileDTO,
    imageEn?: FileDTO,
  ) {
    const banner = this.bannersRepository.create(data);

    // Upload imagem PT
    if (imagePt) {
      const { path } = await this.localFilesService.savePhoto(imagePt);
      banner.imageUrlPt = path;
    }

    // Upload imagem EN
    if (imageEn) {
      const { path } = await this.localFilesService.savePhoto(imageEn);
      banner.imageUrlEn = path;
    }

    return this.bannersRepository.save(banner);
  }

  async update(
    id: number,
    data: BannerUpdateDto,
    imagePt?: FileDTO,
    imageEn?: FileDTO,
  ) {
    const banner = await this.findOne(id);
    
    // Armazenar caminhos antigos para deletar depois
    const oldImagePt = banner.imageUrlPt;
    const oldImageEn = banner.imageUrlEn;

    Object.assign(banner, data);

    // Upload nova imagem PT (se fornecida) e deletar antiga
    if (imagePt) {
      const { path } = await this.localFilesService.savePhoto(imagePt);
      banner.imageUrlPt = path;
      
      // Deletar imagem antiga se existir e for diferente da nova
      if (oldImagePt && oldImagePt !== path) {
        await this.localFilesService.deletePhoto(oldImagePt);
      }
    }

    // Upload nova imagem EN (se fornecida) e deletar antiga
    if (imageEn) {
      const { path } = await this.localFilesService.savePhoto(imageEn);
      banner.imageUrlEn = path;
      
      // Deletar imagem antiga se existir e for diferente da nova
      if (oldImageEn && oldImageEn !== path) {
        await this.localFilesService.deletePhoto(oldImageEn);
      }
    }

    return this.bannersRepository.save(banner);
  }

  async remove(id: number) {
    const banner = await this.findOne(id);
    
    // Coletar caminhos das imagens para deletar
    const imagesToDelete: string[] = [];
    if (banner.imageUrlPt) imagesToDelete.push(banner.imageUrlPt);
    if (banner.imageUrlEn) imagesToDelete.push(banner.imageUrlEn);
    
    // Deletar banner do banco
    await this.bannersRepository.delete({ id });
    
    // Deletar imagens do Supabase
    if (imagesToDelete.length > 0) {
      await this.localFilesService.deletePhotos(imagesToDelete);
    }
    
    return true;
  }

  async toggleActive(id: number) {
    const banner = await this.findOne(id);
    banner.isActive = !banner.isActive;
    return this.bannersRepository.save(banner);
  }

  async reorder(ids: number[]) {
    const banners = await this.bannersRepository.findByIds(ids);
    
    for (let i = 0; i < ids.length; i++) {
      const banner = banners.find(b => b.id === ids[i]);
      if (banner) {
        banner.order = i;
        await this.bannersRepository.save(banner);
      }
    }
    
    return this.findAll();
  }

  async deleteImage(id: number, lang: 'pt' | 'en') {
    const banner = await this.findOne(id);
    
    if (lang === 'pt' && banner.imageUrlPt) {
      await this.localFilesService.deletePhoto(banner.imageUrlPt);
      banner.imageUrlPt = null;
    } else if (lang === 'en' && banner.imageUrlEn) {
      await this.localFilesService.deletePhoto(banner.imageUrlEn);
      banner.imageUrlEn = null;
    }
    
    return this.bannersRepository.save(banner);
  }
}
