export function mapInvitation(invitation) {
    return {
        code: invitation.code,
        seatId: invitation.seatId,
        expiresAt: invitation.expiresAt.toISOString(),
        claimedAt: invitation.claimedAt ? invitation.claimedAt.toISOString() : null,
        claimedBy: invitation.claimedBy
    };
}
//# sourceMappingURL=seat-invitation.dto.js.map