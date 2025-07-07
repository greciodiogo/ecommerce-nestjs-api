import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { RedocModule } from 'nestjs-redoc';
import * as crypto from 'crypto';
if (!(global as any).crypto) {
  (global as any).crypto = crypto;
}
if (!(global as any).crypto.randomUUID) {
  (global as any).crypto.randomUUID = () => crypto.randomBytes(16).toString('hex');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('nodeEnv');

  // Trust proxy for production (important for cookies behind reverse proxy)
  if (nodeEnv === 'production') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Configure CORS based on environment
  if (nodeEnv === 'production') {
    app.enableCors({
      origin: [
        'https://admin.encontrarshopping.com',
        'https://encontrarshopping.com',
        'https://www.encontrarshopping.com',
        'https://www.admin.encontrarshopping.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
  } else {
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }
  

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce platform API')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  await RedocModule.setup('docs', app, document, {});

  const port = configService.get('port');
  await app.listen(port);

  console.log(`App running on port ${port}`);
}
bootstrap();
