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

export function toInvitationResponse(model: SeatInvitation): InvitationResponseDto {
  const now = new Date();
  const isExpired = model.expiresAt < now;
  const isClaimed = !!model.claimedAt;

  return {
    code: model.code,
    seatId: model.seatId,
    expiresAt: model.expiresAt.toISOString(),
    claimedAt: model.claimedAt?.toISOString() ?? null,
    claimedBy: model.claimedBy,
    isExpired,
    isClaimed
  };
}
