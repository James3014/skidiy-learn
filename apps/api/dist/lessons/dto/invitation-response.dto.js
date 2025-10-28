export function toInvitationResponse(model) {
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
//# sourceMappingURL=invitation-response.dto.js.map