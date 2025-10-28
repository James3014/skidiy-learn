import { SeatInvitation } from '@prisma/client';
export type InvitationResponseDto = {
    code: string;
    seatId: string;
    expiresAt: string;
    claimedAt: string | null;
    claimedBy: string | null;
    isExpired: boolean;
    isClaimed: boolean;
};
export declare function toInvitationResponse(model: SeatInvitation): InvitationResponseDto;
