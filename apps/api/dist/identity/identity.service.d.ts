import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { SeatIdentityFormResponse } from './dto/seat-identity.dto.js';
import { SeatInvitationResponse } from './dto/seat-invitation.dto.js';
export declare class IdentityService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    generateInvitation(seatId: string): Promise<SeatInvitationResponse>;
    getIdentityForm(seatId: string): Promise<SeatIdentityFormResponse | null>;
    submitIdentityForm(seatId: string, payload: Partial<SeatIdentityFormResponse>): Promise<SeatIdentityFormResponse>;
    confirmSeatClaim(seatId: string): Promise<SeatIdentityFormResponse>;
}
