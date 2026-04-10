import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from 'src/notifications.gateway';
import { NotificationsService } from 'src/notifications/notification.service';
import { OrderNotificationDto } from './dto/order-notification.dto';
import { Role } from 'src/users/models/role.enum';
import { NotificationType } from 'src/notifications/models/notification.entity';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Processa notificação de pedido recebida via webhook
   * Envia notificação em tempo real para admins/managers via Socket.io
   */
  async processOrderNotification(data: OrderNotificationDto): Promise<void> {
    try {
      // Preparar mensagem de notificação
      const notificationMessage = this.buildNotificationMessage(data);

      // 1. Enviar notificação em tempo real via Socket.io para admins/managers
      this.notificationsGateway.sendNotificationToRole('admin', {
        type: data.type,
        title: data.title,
        message: notificationMessage,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        orderStatus: data.orderStatus,
        totalAmount: data.totalAmount,
        source: data.source || 'external',
        createdAt: data.createdAt || new Date().toISOString(),
        metadata: data.metadata,
      });

      this.notificationsGateway.sendNotificationToRole('manager', {
        type: data.type,
        title: data.title,
        message: notificationMessage,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        orderStatus: data.orderStatus,
        totalAmount: data.totalAmount,
        source: data.source || 'external',
        createdAt: data.createdAt || new Date().toISOString(),
        metadata: data.metadata,
      });

      console.log(`✅ Notification broadcasted to admins/managers for order #${data.orderNumber}`);

      // 2. Salvar notificação no banco de dados para todos os admins/managers
      await this.notificationsService.notifyUsersByRole({
        role: Role.Admin,
        title: data.title,
        message: notificationMessage,
        type: this.mapNotificationType(data.type),
        relatedEntityId: data.orderId, // Número, não string
        actionUrl: `/orders/${data.orderId}`,
      });

      await this.notificationsService.notifyUsersByRole({
        role: Role.Manager,
        title: data.title,
        message: notificationMessage,
        type: this.mapNotificationType(data.type),
        relatedEntityId: data.orderId, // Número, não string
        actionUrl: `/orders/${data.orderId}`,
      });

      console.log(`✅ Notifications saved to database for admins/managers`);

    } catch (error) {
      console.error('❌ Error processing order notification:', error.message);
      // Não lançar erro para não quebrar o webhook
    }
  }

  /**
   * Constrói mensagem de notificação baseada no tipo
   */
  private buildNotificationMessage(data: OrderNotificationDto): string {
    const orderNumber = data.orderNumber || data.orderId;
    const amount = data.totalAmount ? ` no valor de ${data.totalAmount} MZN` : '';
    
    switch (data.type) {
      case 'new_order':
        return data.message || `Novo pedido #${orderNumber} recebido${amount}`;
      case 'order_status_update':
        return data.message || `Pedido #${orderNumber} atualizado para ${data.orderStatus}`;
      default:
        return data.message || `Notificação sobre pedido #${orderNumber}`;
    }
  }

  /**
   * Mapeia tipo de notificação do webhook para o tipo do sistema
   */
  private mapNotificationType(type: string): NotificationType {
    switch (type) {
      case 'new_order':
        return NotificationType.ORDER;
      case 'order_status_update':
        return NotificationType.ORDER;
      default:
        return NotificationType.GENERAL;
    }
  }
}
