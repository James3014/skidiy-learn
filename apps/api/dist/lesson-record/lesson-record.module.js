var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { LessonRecordService } from './lesson-record.service.js';
import { LessonRecordController } from './lesson-record.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { RateLimiterModule } from '../rate-limiter/rate-limiter.module.js';
let LessonRecordModule = class LessonRecordModule {
};
LessonRecordModule = __decorate([
    Module({
        imports: [PrismaModule, AuditModule, RateLimiterModule],
        controllers: [LessonRecordController],
        providers: [LessonRecordService],
        exports: [LessonRecordService]
    })
], LessonRecordModule);
export { LessonRecordModule };
//# sourceMappingURL=lesson-record.module.js.map