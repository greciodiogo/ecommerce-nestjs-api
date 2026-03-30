import { PartialType } from '@nestjs/swagger';
import { BannerCreateDto } from './banner-create.dto';

export class BannerUpdateDto extends PartialType(BannerCreateDto) {}
