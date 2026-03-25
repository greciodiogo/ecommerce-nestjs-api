import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SplashScreen } from './models/splash-screen.entity';
import { SplashScreenCreateDto } from './dto/splash-screen-create.dto';
import { SplashScreenUpdateDto } from './dto/splash-screen-update.dto';
import { NotFoundError } from '../errors/not-found.error';

@Injectable()
export class SplashScreensService {
  constructor(
    @InjectRepository(SplashScreen)
    private splashScreensRepository: Repository<SplashScreen>,
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

  async create(data: SplashScreenCreateDto) {
    const splashScreen = this.splashScreensRepository.create(data);
    return this.splashScreensRepository.save(splashScreen);
  }

  async update(id: number, data: SplashScreenUpdateDto) {
    const splashScreen = await this.findOne(id);
    Object.assign(splashScreen, data);
    return this.splashScreensRepository.save(splashScreen);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.splashScreensRepository.delete({ id });
    return true;
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
