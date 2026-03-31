// notifications.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: ['https://admin.encontrarshopping.com', 'https://encontrarshopping.com', 'http://localhost:4200', 'http://localhost:3000'],
        credentials: true,
    },
})
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private clients: Map<number, string> = new Map(); // userId -> socket.id

    afterInit(server: Server) {
        console.log('WebSocket server initialized for notifications');
    }

    handleConnection(client: Socket) {
        const userId = Number(client.handshake.query.userId);
        if (userId && !isNaN(userId)) {
            this.clients.set(userId, client.id);
            console.log(`User ${userId} connected with socket ${client.id}`);
        } else {
            console.warn('Connection attempt without valid userId');
        }
    }

    handleDisconnect(client: Socket) {
        const userId = [...this.clients.entries()].find(([, id]) => id === client.id)?.[0];
        if (userId) {
            this.clients.delete(userId);
            console.log(`User ${userId} disconnected`);
        }
    }

    sendNotificationToUser(userId: number, notification: any) {
        const socketId = this.clients.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('notification', notification);
            console.log(`Notification sent to user ${userId}`);
        } else {
            console.log(`User ${userId} not connected, notification not sent in real-time`);
        }
    }

    sendNotificationToRole(role: string, payload: any) {
        this.server.to(`role_${role}`).emit('notification', payload);
    }

    @SubscribeMessage('joinRole')
    handleJoinRole(client: Socket, role: string) {
        client.join(`role_${role}`);
    }
}
