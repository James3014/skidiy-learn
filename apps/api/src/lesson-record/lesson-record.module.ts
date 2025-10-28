import { Module } from '@nestjs/common';
import { LessonRecordService } from './lesson-record.service.js';
import { LessonRecordController } from './lesson-record.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { RateLimiterModule } from '../rate-limiter/rate-limiter.module.js';

@Module({
  imports: [PrismaModule, AuditModule, RateLimiterModule],
  controllers: [LessonRecordController],
  providers: [LessonRecordService],
  exports: [LessonRecordService]
})
export class LessonRecordModule {}
