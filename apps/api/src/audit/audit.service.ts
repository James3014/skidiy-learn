import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

interface AuditLogPayload {
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  scope?: string | null;
  metadata?: Record<string, unknown>;
  count?: number | null;
  reason?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(payload: AuditLogPayload): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: payload.actorId ?? null,
        action: payload.action,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        scope: payload.scope ?? null,
        filters: payload.metadata ? (payload.metadata as Prisma.JsonObject) : undefined,
        count: payload.count ?? null,
        reason: payload.reason ?? null,
        performedAt: new Date()
      }
    });
  }
}
