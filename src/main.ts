import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomCorsMiddleware } from './commons/middlewares/custom-cors.middleware';
import { TransformInterceptor } from './commons/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './commons/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express'; // Import express
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Supaya IP client valid dari header x-forwarded-for
  app.set('trust proxy', true);

  // Enable CORS
  app.use(CustomCorsMiddleware);

  app.setGlobalPrefix('api');

  const staticDir = join(process.cwd(), 'download-temps');
  app.use(
    '/dl',
    // secureDownloadMiddleware(app.get(DataSource)),
    express.static(staticDir, {
      setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'public, max-age=2147483647, immutable');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="' + path.split('/').pop() + '"',
        );
      },
    }),
  );

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'upload',
      protoPath: join(process.cwd(), 'proto/upload.proto'),
      url: '0.0.0.0:50051', // ini bikin server di port 50051
    },
  });

  // Start gRPC microservice
  await app.startAllMicroservices();

  await app.init();

  // Start HTTP server
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`server berjalan di port ${process.env.PORT ?? 3000}`);
}
bootstrap();
