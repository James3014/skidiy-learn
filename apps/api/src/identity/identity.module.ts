import { Module } from '@nestjs/common';
import { IdentityService } from './identity.service.js';
import { IdentityController } from './identity.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [IdentityController],
  providers: [IdentityService]
})
export class IdentityModule {}
