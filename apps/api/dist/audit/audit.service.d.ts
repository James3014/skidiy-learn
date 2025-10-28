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
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(payload: AuditLogPayload): Promise<void>;
}
export {};
