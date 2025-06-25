import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MailService } from '../mail/mail.service';
import { FeedbackDto } from '../mail/dto/feedback.dto';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envia um e-mail de feedback ou reclamação.' })
  @ApiResponse({ status: 200, description: 'Feedback enviado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async sendFeedback(@Body() feedbackDto: FeedbackDto) {
    return this.mailService.sendFeedbackEmail(feedbackDto);
  }
} 