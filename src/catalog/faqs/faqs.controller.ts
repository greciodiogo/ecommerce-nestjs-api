import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { Faq } from './models/faq.entity';
import { Role } from '../../users/models/role.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FaqCreateDto } from './dto/faq-create.dto';
import { FaqUpdateDto } from './dto/faq-update.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ReqUser } from '../../auth/decorators/user.decorator';
import { User } from '../../users/models/user.entity';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private faqsService: FaqsService) {}

  @Get()
  @ApiOkResponse({ type: [Faq], description: 'List of all Faqs' })
  getFaqs(@ReqUser() user?: User): Promise<Faq[]> {
    if (user && [Role.Admin, Role.Manager, Role.Sales, Role.Shoper].includes(user?.role)) {
      return this.faqsService.getFaqs(true);
    }
    return this.faqsService.getFaqs();
  }

  @Get('/:id')
  @ApiNotFoundResponse({ description: 'Faq not found' })
  @ApiOkResponse({ type: Faq, description: 'Faq with given id' })
  async getFaq(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user?: User,
  ): Promise<Faq> {
    if (user && [Role.Admin, Role.Manager, Role.Sales].includes(user.role)) {
      return this.faqsService.getFaq(id, true);
    }
    return await this.faqsService.getFaq(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiCreatedResponse({ type: Faq, description: 'Faq created' })
  @ApiBadRequestResponse({ description: 'Invalid Faq data' })
  createFaq(@Body() Faq: FaqCreateDto): Promise<Faq> {
    return this.faqsService.createFaq(Faq);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Faq, description: 'Faq updated' })
  @ApiBadRequestResponse({ description: 'Invalid Faq data' })
  @ApiNotFoundResponse({ description: 'Faq not found' })
  async updateFaq(
    @Param('id', ParseIntPipe) id: number,
    @Body() Faq: FaqUpdateDto,
  ): Promise<Faq> {
    return await this.faqsService.updateFaq(id, Faq);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Faq not found' })
  @ApiOkResponse({ description: 'Faq deleted' })
  async deleteFaq(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.faqsService.deleteFaq(id);
  }
}
