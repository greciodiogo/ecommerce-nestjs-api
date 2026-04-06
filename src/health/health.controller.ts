import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      socketio: 'enabled',
    };
  }

  @Get('socket')
  @Public()
  socketCheck() {
    return {
      status: 'ok',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      message: 'Socket.IO is configured and ready',
    };
  }
}
