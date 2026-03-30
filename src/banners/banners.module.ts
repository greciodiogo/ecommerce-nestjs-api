import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './models/banner.entity';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { LocalFilesModule } from '../local-files/local-files.module';

@Module({
  imports: [TypeOrmModule.forFeature([Banner]), LocalFilesModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
