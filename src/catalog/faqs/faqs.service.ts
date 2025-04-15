import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Faq } from './models/faq.entity';
import { Repository } from 'typeorm';
import { FaqCreateDto } from './dto/faq-create.dto';
import { FaqUpdateDto } from './dto/faq-update.dto';
import { NotFoundError } from '../../errors/not-found.error';

@Injectable()
export class FaqsService {
  constructor(@InjectRepository(Faq) private faqsRepository: Repository<Faq>) {}

  async getFaqs(withHidden?: boolean): Promise<Faq[]> {
    return this.faqsRepository.find({
      where: { visible: !withHidden ? true : undefined },
    });
  }

  async getFaq(id: number, withHidden?: boolean): Promise<Faq> {
    const faq = await this.faqsRepository.findOne({
      where: { id, visible: !withHidden ? true : undefined },
    });
    if (!faq) {
      throw new NotFoundError('faq', 'id', id.toString());
    }
    return faq;
  }

  async createFaq(faqData: FaqCreateDto): Promise<Faq> {
    const faq = new Faq();
    Object.assign(faq, faqData);
    return this.faqsRepository.save(faq);
  }

  async updateFaq(id: number, faqData: FaqUpdateDto): Promise<Faq> {
    const faq = await this.getFaq(id, true);
    Object.assign(faq, faqData);
    return this.faqsRepository.save(faq);
  }

  async deleteFaq(id: number): Promise<boolean> {
    await this.getFaq(id, true);
    await this.faqsRepository.delete({ id });
    return true;
  }
}
