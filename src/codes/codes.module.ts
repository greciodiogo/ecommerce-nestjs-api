import { Module } from '@nestjs/common';
import { CodesController } from './codes.controller';
import { CodesService } from './codes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Code } from './models/code.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Code]), MailModule],
  controllers: [CodesController],
  providers: [CodesService],
  exports: [CodesService],
})
export class CodesModule {}
