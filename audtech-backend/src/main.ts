import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('api/v1');

  // Validação automática de todos os DTOs com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // remove campos não declarados no DTO
      forbidNonWhitelisted: true,
      transform: true,         // converte tipos automaticamente (string -> number, etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS liberado para o Angular em dev; ajustar origin em produção
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    credentials: true,
  });

  // const port = process.env.PORT ?? 3000;
  // await app.listen(port);
  // console.log(`AUDTECH Backend rodando em http://localhost:${port}/api/v1`);

  // Mude de app.listen(3000) para:
  await app.listen(3000, '0.0.0.0');
  console.log(`Aplicação rodando na URL: ${await app.getUrl()}`);
}

bootstrap();
