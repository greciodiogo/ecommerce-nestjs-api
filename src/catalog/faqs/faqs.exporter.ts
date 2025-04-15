import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { Faq } from './models/faq.entity';
import { FaqsService } from './faqs.service';

@Injectable()
export class FaqsExporter implements Exporter<Faq> {
  constructor(private faqsService: FaqsService) {}

  async export(): Promise<Faq[]> {
    const faqs = await this.faqsService.getFaqs(true);
    const preparedFaqs: Faq[] = [];
    for (const faq of faqs) {
      preparedFaqs.push(this.prepareFaq(faq));
    }
    return preparedFaqs;
  }

  private prepareFaq(faq: Faq) {
    const preparedFaq = new Faq();
    preparedFaq.id = faq.id;
    preparedFaq.question = faq.question;
    preparedFaq.answer = faq.answer;
    preparedFaq.visible = faq.visible;
    return preparedFaq;
  }
}
