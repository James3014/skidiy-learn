var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
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
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map