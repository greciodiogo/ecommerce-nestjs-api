import {
  Inject,
  MiddlewareConsumer,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import passport from 'passport';
import createRedisStore from 'connect-redis';
import { RedisClient } from 'redis';
import { RedisModule, REDIS_CLIENT } from './redis';
import { RolesGuard } from './auth/guards/roles.guard';
import { LocalFilesModule } from './local-files/local-files.module';
import { ServiceErrorInterceptor } from './errors/service-error.interceptor';
import { WishlistsModule } from './wishlists/wishlists.module';
import { SettingsModule } from './settings/settings.module';
import { schema } from './config/configuration.schema';
import { CatalogModule } from './catalog/catalog.module';
import { SalesModule } from './sales/sales.module';
import { FeaturesEnabledGuard } from './settings/guards/features-enabled.guard';
import { ImportExportModule } from './import-export/import-export.module';
import { PagesModule } from './pages/pages.module';
import { CartsModule } from './carts/carts.module';
import { DashboardModule } from './utilitarios/dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notification.module';
import { AddressModule } from './address/address.module';
import { FeedbackModule } from './feedback/feedback.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      validationSchema: schema,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('postgres.host'),
        port: configService.get<number>('postgres.port'),
        username: configService.get<string>('postgres.username'),
        password: configService.get<string>('postgres.password'),
        database: configService.get<string>('postgres.database'),
        entities: [],
        synchronize: true,
        autoLoadEntities: true,
        keepConnectionAlive: true,
        dropSchema: false,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    LocalFilesModule,
    CatalogModule,
    SalesModule,
    DashboardModule,
    WishlistsModule,
    ImportExportModule,
    PagesModule,
    CartsModule,
    NotificationsModule,
    AddressModule,
    FeedbackModule,
    OperationLogsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeaturesEnabledGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ServiceErrorInterceptor,
    },
  ],
})
export class AppModule {
  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const session = require('express-session');
    const RedisStore = createRedisStore(session);

    const sessionMiddleware = (req, res, next) => {
      const isAdmin = req.headers.origin?.includes('admin') || req.headers.referer?.includes('admin') || req.headers.referer?.includes('5000');
      req.isAdmin = isAdmin;
      const nodeEnv = this.configService.get<string>('nodeEnv');
      const sessionDomain = this.configService.get<string>('session.domain');
      
      session({
        store: new RedisStore({ client: this.redisClient }),
        secret: this.configService.get<string>('session.secret', ''),
        resave: false,
        saveUninitialized: false,
        name: isAdmin ? 'admin.sid' : 'store.sid',
        cookie: {
          httpOnly: true,
          secure: nodeEnv === 'production',
          sameSite: nodeEnv === 'production' ? 'none' : 'lax',
          maxAge: this.configService.get<number>('session.maxAge'),
          path: '/',
          domain: nodeEnv === 'production' ? '.encontrarshopping.com' : sessionDomain,
        },
      })(req, res, next);

      // Debug logging for production
      if (nodeEnv === 'production') {
        // console.log('Session Debug:', {
        //   origin: req.headers.origin,
        //   referer: req.headers.referer,
        //   host: req.headers.host,
        //   isAdmin,
        //   sessionDomain,
        //   secure: nodeEnv === 'production',
        //   sameSite: nodeEnv === 'production' ? 'none' : 'lax',
        //   domain: nodeEnv === 'production' ? '.encontrarshopping.com' : sessionDomain,
        // });
      }
    };

    consumer
      .apply(sessionMiddleware, passport.initialize(), passport.session())
      .forRoutes('*');
  }
}
