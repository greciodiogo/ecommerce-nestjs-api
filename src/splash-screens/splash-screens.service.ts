import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SplashScreen } from './models/splash-screen.entity';
import { SplashScreenCreateDto } from './dto/splash-screen-create.dto';
import { SplashScreenUpdateDto } from './dto/splash-screen-update.dto';
import { NotFoundError } from '../errors/not-found.error';
import { LocalFilesService } from '../local-files/local-files.service';
import { FileDTO } from '../local-files/upload.dto';

@Injectable()
export class SplashScreensService {
  constructor(
    @InjectRepository(SplashScreen)
    private splashScreensRepository: Repository<SplashScreen>,
    private localFilesService: LocalFilesService,
  ) {}

  async findAll() {
    return this.splashScreensRepository.find({
      order: { order: 'ASC', id: 'ASC' },
    });
  }

  async findActive() {
    return this.splashScreensRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const splashScreen = await this.splashScreensRepository.findOne({
      where: { id },
    });
    if (!splashScreen) {
      throw new NotFoundError('splash screen', 'id', id.toString());
    }
    return splashScreen;
  }

  async create(data: SplashScreenCreateDto, file?: FileDTO) {
    const splashScreen = this.splashScreensRepository.create(data);

    if (file) {
      const { path } = await this.localFilesService.savePhoto(file);
      splashScreen.imageUrl = path;
    }

    return this.splashScreensRepository.save(splashScreen);
  }

  async update(id: number, data: SplashScreenUpdateDto, file?: FileDTO) {
    const splashScreen = await this.findOne(id);
    const oldImageUrl = splashScreen.imageUrl;

    Object.assign(splashScreen, data);

    if (file) {
      const { path } = await this.localFilesService.savePhoto(file);
      splashScreen.imageUrl = path;

      // Deletar imagem antiga se existir e for diferente da nova
      if (oldImageUrl && oldImageUrl !== path) {
        await this.localFilesService.deletePhoto(oldImageUrl);
      }
    }

    return this.splashScreensRepository.save(splashScreen);
  }

  async remove(id: number) {
    const splashScreen = await this.findOne(id);

    // Deletar imagem do Supabase
    if (splashScreen.imageUrl) {
      await this.localFilesService.deletePhoto(splashScreen.imageUrl);
    }

    await this.splashScreensRepository.delete({ id });
    return true;
  }

  async deleteImage(id: number) {
    const splashScreen = await this.findOne(id);

    if (splashScreen.imageUrl) {
      await this.localFilesService.deletePhoto(splashScreen.imageUrl);
      splashScreen.imageUrl = null;
    }

    return this.splashScreensRepository.save(splashScreen);
  }

  async reorder(ids: number[]) {
    const splashScreens = await this.splashScreensRepository.findByIds(ids);
    
    for (let i = 0; i < ids.length; i++) {
      const splashScreen = splashScreens.find(s => s.id === ids[i]);
      if (splashScreen) {
        splashScreen.order = i;
        await this.splashScreensRepository.save(splashScreen);
      }
    }
    
    return this.findAll();
  }
}
