import { SeatInvitation } from '@prisma/client';
export interface SeatInvitationResponse {
    code: string;
    seatId: string;
    expiresAt: string;
    claimedAt: string | null;
    claimedBy: string | null;
}
export declare function mapInvitation(invitation: SeatInvitation): SeatInvitationResponse;
