import { Module } from '@nestjs/common';
import { CodesController } from './codes.controller';
import { CodesService } from './codes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Code } from './models/code.entity';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([Code])],
  controllers: [CodesController],
  providers: [CodesService, MailService],
  exports: [CodesService, MailService],
})
export class CodesModule {}
