// notifications.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: ['https://admin.encontrarshopping.com', 'https://encontrarshopping.com'],
        // origin: ['http://localhost:3000', 'http://localhost:4200'], // Next.js e Angular
        credentials: true,
    },
})
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private clients: Map<number, string> = new Map(); // userId -> socket.id

    afterInit(server: Server) {
        console.log('Socket server initialized');
    }

    handleConnection(client: Socket) {
        const userId = Number(client.handshake.query.userId);
        if (userId) {
            this.clients.set(userId, client.id);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = [...this.clients.entries()].find(([, id]) => id === client.id)?.[0];
        if (userId) {
            this.clients.delete(userId);
        }
    }

    sendNotificationToUser(userId: number, notification: any) {
        const socketId = this.clients.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('notification', notification);
        }
    }

    sendNotificationToRole(role: string, payload: any) {
        this.server.to(`role_${role}`).emit('notification', payload);
    }
}
