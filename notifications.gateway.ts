// notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

// @WebSocketGateway({
//   cors: {
//     origin: '*', // Configure corretamente em produção
//   },
// })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('Client connected: ', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected: ', client.id);
  }

  sendPurchaseNotification(data: any) {
    this.server.emit('new-purchase', data);
  }
}
