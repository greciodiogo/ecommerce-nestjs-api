import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { FaqsService } from './faqs.service';
import { Faq } from './models/faq.entity';

@Injectable()
export class FaqsImporter implements Importer {
  constructor(private faqsService: FaqsService) {}

  async import(faqs: Collection): Promise<IdMap> {
    const parsedFaqs = this.parseFaqs(faqs);
    const idMap: IdMap = {};
    for (const faq of parsedFaqs) {
      const { id, ...createDto } = faq;
      const { id: newId } = await this.faqsService.createFaq(createDto);
      idMap[faq.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const faqs = await this.faqsService.getFaqs(true);
    let deleted = 0;
    for (const faq of faqs) {
      await this.faqsService.deleteFaq(faq.id);
      deleted += 1;
    }
    return deleted;
  }

  private parseFaqs(faqs: Collection) {
    const parsedFaqs: Faq[] = [];
    for (const faq of faqs) {
      parsedFaqs.push(this.parseFaq(faq));
    }
    return parsedFaqs;
  }

  private parseFaq(faq: Collection[number]) {
    const parsedFaq = new Faq();
    try {
      parsedFaq.id = faq.id as number;
      parsedFaq.question = faq.question as string;
      parsedFaq.answer = faq.answer as string;
      parsedFaq.visible = faq.visible as boolean;
    } catch (e) {
      throw new ParseError('faq');
    }
    return parsedFaq;
  }
}
