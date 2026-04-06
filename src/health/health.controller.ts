import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      socketio: 'enabled',
    };
  }

  @Get('socket')
  socketCheck() {
    return {
      status: 'ok',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      message: 'Socket.IO is configured and ready',
    };
  }
}
