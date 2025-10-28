import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnvironment } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { AbilityModule } from './ability/ability.module.js';
import { AnalysisModule } from './analysis/analysis.module.js';
import { PracticeModule } from './practice/practice.module.js';
import { LessonRecordModule } from './lesson-record/lesson-record.module.js';
import { IdentityModule } from './identity/identity.module.js';
import { SharingModule } from './sharing/sharing.module.js';
import { AuditModule } from './audit/audit.module.js';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { StudentsModule } from './students/students.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment
    }),
    PrismaModule,
    AuthModule,
    AuditModule,
    RateLimiterModule,
    AbilityModule,
    AnalysisModule,
    PracticeModule,
    LessonsModule,
    StudentsModule,
    LessonRecordModule,
    IdentityModule,
    SharingModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
