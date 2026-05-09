import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SplashConfigController } from './splash-config.controller';
import { ThemeConfigController } from './theme-config.controller';
import { Setting } from '../settings/models/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SplashConfigController, ThemeConfigController],
})
export class ConfigAppModule {}
