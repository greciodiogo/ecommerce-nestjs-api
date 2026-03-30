import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SplashScreen } from './models/splash-screen.entity';
import { SplashScreensController } from './splash-screens.controller';
import { SplashScreensService } from './splash-screens.service';
import { LocalFilesModule } from '../local-files/local-files.module';

@Module({
  imports: [TypeOrmModule.forFeature([SplashScreen]), LocalFilesModule],
  controllers: [SplashScreensController],
  providers: [SplashScreensService],
  exports: [SplashScreensService],
})
export class SplashScreensModule {}
