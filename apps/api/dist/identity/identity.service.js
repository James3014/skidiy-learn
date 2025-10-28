var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { mapIdentity } from './dto/seat-identity.dto.js';
import { mapInvitation } from './dto/seat-invitation.dto.js';
let IdentityService = class IdentityService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateInvitation(seatId) {
        const code = randomBytes(6).toString('hex').slice(0, 8).toUpperCase();
        const existing = await this.prisma.seatInvitation.findFirst({ where: { seatId } });
        if (existing) {
            const updated = await this.prisma.seatInvitation.update({
                where: { code: existing.code },
                data: {
                    code,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                }
            });
            await this.audit.log({
                actorId: payloadActorId(),
                action: 'seat_invitation_refresh',
                entityType: 'seat_invitation',
                entityId: updated.code,
                scope: updated.seatId
            });
            return mapInvitation(updated);
        }
        const created = await this.prisma.seatInvitation.create({
            data: {
                code,
                seatId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        await this.audit.log({
            actorId: payloadActorId(),
            action: 'seat_invitation_create',
            entityType: 'seat_invitation',
            entityId: created.code,
            scope: created.seatId
        });
        return mapInvitation(created);
    }
    async getIdentityForm(seatId) {
        const form = await this.prisma.seatIdentityForm.findUnique({ where: { seatId } });
        return form ? mapIdentity(form) : null;
    }
    async submitIdentityForm(seatId, payload) {
        const status = payload.status ?? 'submitted';
        const result = await this.prisma.seatIdentityForm.upsert({
            where: { seatId },
            create: {
                seatId,
                status,
                studentName: payload.studentName ?? null,
                studentEnglish: payload.studentEnglish ?? null,
                birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
                contactEmail: payload.contactEmail ?? null,
                guardianEmail: payload.guardianEmail ?? null,
                contactPhone: payload.contactPhone ?? null,
                isMinor: payload.isMinor ?? false,
                hasExternalInsurance: payload.hasExternalInsurance ?? false,
                insuranceProvider: payload.insuranceProvider ?? null,
                note: payload.note ?? null,
                submittedAt: new Date()
            },
            update: {
                status,
                studentName: payload.studentName ?? null,
                studentEnglish: payload.studentEnglish ?? null,
                birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
                contactEmail: payload.contactEmail ?? null,
                guardianEmail: payload.guardianEmail ?? null,
                contactPhone: payload.contactPhone ?? null,
                isMinor: payload.isMinor ?? false,
                hasExternalInsurance: payload.hasExternalInsurance ?? false,
                insuranceProvider: payload.insuranceProvider ?? null,
                note: payload.note ?? null,
                submittedAt: new Date(),
                updatedAt: new Date()
            }
        });
        await this.audit.log({
            actorId: payloadActorId(),
            action: 'seat_identity_submit',
            entityType: 'seat_identity_form',
            entityId: result.id,
            scope: seatId
        });
        return mapIdentity(result);
    }
    async confirmSeatClaim(seatId) {
        const form = await this.prisma.seatIdentityForm.update({
            where: { seatId },
            data: {
                status: 'confirmed',
                confirmedAt: new Date(),
                updatedAt: new Date()
            }
        });
        await this.prisma.orderSeat.update({
            where: { id: seatId },
            data: {
                status: 'claimed',
                claimedAt: new Date()
            }
        });
        await this.audit.log({
            actorId: payloadActorId(),
            action: 'seat_claim_confirm',
            entityType: 'seat_identity_form',
            entityId: form.id,
            scope: seatId
        });
        return mapIdentity(form);
    }
};
IdentityService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        AuditService])
], IdentityService);
export { IdentityService };
function payloadActorId() {
    return 'system';
}
//# sourceMappingURL=identity.service.js.map