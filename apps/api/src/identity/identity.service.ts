import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  SeatIdentityFormResponse,
  SeatIdentityStatus,
  mapIdentity
} from './dto/seat-identity.dto.js';
import { SeatInvitationResponse, mapInvitation } from './dto/seat-invitation.dto.js';

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async generateInvitation(seatId: string): Promise<SeatInvitationResponse> {
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

  async getIdentityForm(seatId: string): Promise<SeatIdentityFormResponse | null> {
    const form = await this.prisma.seatIdentityForm.findUnique({ where: { seatId } });
    return form ? mapIdentity(form) : null;
  }

  async submitIdentityForm(
    seatId: string,
    payload: Partial<SeatIdentityFormResponse>
  ): Promise<SeatIdentityFormResponse> {
    const status: SeatIdentityStatus = payload.status ?? 'submitted';

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

  async confirmSeatClaim(seatId: string): Promise<SeatIdentityFormResponse> {
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
}

function payloadActorId(): string | null {
  // TODO: 接入身份系統後替換為真實帳號
  return 'system';
}
