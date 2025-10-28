import { Module } from '@nestjs/common';
import { SharingService } from './sharing.service.js';
import { SharingController } from './sharing.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SharingController],
  providers: [SharingService]
})
export class SharingModule {}
