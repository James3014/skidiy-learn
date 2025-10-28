import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import * as fs from 'fs';
import * as path from 'path';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });
    app.setGlobalPrefix('api');
    const config = new DocumentBuilder()
        .setTitle('DIY Ski Evaluation API')
        .setDescription('Ski instructor teaching evaluation and record management system')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header'
    }, 'JWT-auth')
        .addTag('lessons', 'Lesson management endpoints')
        .addTag('invitations', 'Seat invitation and claiming')
        .addTag('lesson-records', 'Teaching records and evaluations')
        .addTag('sharing', 'Record sharing and visibility')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    const outputPath = path.join(process.cwd(), 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`OpenAPI specification written to: ${outputPath}`);
    SwaggerModule.setup('api-docs', app, document, {
        jsonDocumentUrl: '/api-docs-json'
    });
    await app.listen(process.env.PORT ?? 3001);
}
bootstrap().catch((error) => {
    console.error('Nest startup failed', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map