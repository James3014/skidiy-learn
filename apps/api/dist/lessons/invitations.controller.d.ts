import { InvitationsService } from './invitations.service.js';
import { ClaimInvitationDto } from './dto/claim-invitation.dto.js';
import { InvitationResponseDto } from './dto/invitation-response.dto.js';
export declare class InvitationsController {
    private readonly invitationsService;
    constructor(invitationsService: InvitationsService);
    verifyCode(code: string): Promise<InvitationResponseDto>;
    claimSeat(dto: ClaimInvitationDto): Promise<{
        seatId: string;
        mappingId: string;
        message: string;
    }>;
    submitIdentityForm(code: string, data: {
        studentName: string;
        studentEnglish?: string;
        birthDate?: string;
        contactEmail?: string;
        guardianEmail?: string;
        contactPhone?: string;
        isMinor?: boolean;
        hasExternalInsurance?: boolean;
        insuranceProvider?: string;
        note?: string;
    }): Promise<{
        id: string;
        seatId: string;
        status: import("@prisma/client").$Enums.SeatIdentityStatus;
        studentName: string | null;
        studentEnglish: string | null;
        birthDate: Date | null;
        contactEmail: string | null;
        guardianEmail: string | null;
        contactPhone: string | null;
        isMinor: boolean;
        hasExternalInsurance: boolean;
        insuranceProvider: string | null;
        note: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
