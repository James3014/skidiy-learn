import { SeatInvitation } from '@prisma/client';

export interface SeatInvitationResponse {
  code: string;
  seatId: string;
  expiresAt: string;
  claimedAt: string | null;
  claimedBy: string | null;
}

export function mapInvitation(invitation: SeatInvitation): SeatInvitationResponse {
  return {
    code: invitation.code,
    seatId: invitation.seatId,
    expiresAt: invitation.expiresAt.toISOString(),
    claimedAt: invitation.claimedAt ? invitation.claimedAt.toISOString() : null,
    claimedBy: invitation.claimedBy
  };
}
