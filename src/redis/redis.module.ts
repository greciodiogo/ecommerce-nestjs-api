import { Module, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import * as Redis from 'redis';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        
        const client = Redis.createClient({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          auth_pass: configService.get<string>('redis.password'),
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              logger.error('Redis connection refused');
              return new Error('Redis connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              logger.error('Redis retry time exhausted');
              return new Error('Redis retry time exhausted');
            }
            if (options.attempt > 10) {
              logger.error('Redis max retry attempts exceeded');
              return undefined;
            }
            const delay = Math.min(options.attempt * 100, 3000);
            logger.warn(`Redis reconnecting in ${delay}ms (attempt ${options.attempt})`);
            return delay;
          },
        });

        // Error handler - prevents unhandled errors from crashing the app
        client.on('error', (err) => {
          logger.error(`Redis error: ${err.message}`, err.stack);
        });

        // Connection event handlers for monitoring
        client.on('connect', () => {
          logger.log('Redis connected');
        });

        client.on('reconnecting', () => {
          logger.warn('Redis reconnecting...');
        });

        client.on('ready', () => {
          logger.log('Redis ready');
        });

        client.on('end', () => {
          logger.warn('Redis connection ended');
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}