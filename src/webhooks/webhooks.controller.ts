import { Body, Controller, Post, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { OrderNotificationDto } from './dto/order-notification.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('order-notification')
  @ApiOperation({ 
    summary: 'Receive order notifications from external systems (encontrarCore)',
    description: 'Webhook endpoint to receive order notifications from encontrarCore API and broadcast to admin dashboard via Socket.io'
  })
  @ApiCreatedResponse({ description: 'Notification received and broadcasted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid notification data' })
  async receiveOrderNotification(
    @Body() notificationData: OrderNotificationDto,
    @Headers('x-webhook-source') webhookSource?: string,
  ): Promise<{ success: boolean; message: string }> {
    
    // Validação básica
    if (!notificationData.orderId || !notificationData.type) {
      throw new BadRequestException('Missing required fields: orderId and type');
    }

    // Log para debug
    console.log('📥 Webhook received from:', webhookSource || 'unknown');
    console.log('📦 Order notification:', {
      type: notificationData.type,
      orderId: notificationData.orderId,
      orderNumber: notificationData.orderNumber,
      source: notificationData.source,
    });

    // Processar a notificação e enviar via Socket.io
    await this.webhooksService.processOrderNotification(notificationData);

    return {
      success: true,
      message: 'Notification received and broadcasted successfully',
    };
  }
}
