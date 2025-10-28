import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import * as fs from 'fs';
import * as path from 'path';

function resolveCorsOrigin(envValue: string | undefined): true | string[] {
  if (!envValue) return true;

  const origins = envValue
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return origins.length === 0 ? true : origins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const corsOrigin = resolveCorsOrigin(process.env.CORS_ORIGINS);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('DIY Ski Evaluation API')
    .setDescription('Ski instructor teaching evaluation and record management system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header'
      },
      'JWT-auth'
    )
    .addTag('lessons', 'Lesson management endpoints')
    .addTag('invitations', 'Seat invitation and claiming')
    .addTag('lesson-records', 'Teaching records and evaluations')
    .addTag('sharing', 'Record sharing and visibility')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Write OpenAPI JSON file
  const outputPath = path.join(process.cwd(), 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI specification written to: ${outputPath}`);

  // Serve Swagger UI at /api-docs
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: '/api-docs-json'
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap().catch((error) => {
  console.error('Nest startup failed', error);
  process.exit(1);
});
