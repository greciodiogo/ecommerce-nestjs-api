import { Module } from '@nestjs/common';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faq } from './models/faq.entity';
import { FaqsExporter } from './faqs.exporter';
import { FaqsImporter } from './faqs.importer';

@Module({
  imports: [TypeOrmModule.forFeature([Faq])],
  controllers: [FaqsController],
  providers: [FaqsService, FaqsExporter, FaqsImporter],
  exports: [FaqsService, FaqsExporter, FaqsImporter],
})
export class FaqsModule {}
