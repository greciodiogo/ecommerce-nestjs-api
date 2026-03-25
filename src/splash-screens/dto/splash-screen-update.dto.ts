import { PartialType } from '@nestjs/swagger';
import { SplashScreenCreateDto } from './splash-screen-create.dto';

export class SplashScreenUpdateDto extends PartialType(SplashScreenCreateDto) {}
