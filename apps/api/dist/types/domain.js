export function isValidInvitationCode(code) {
    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code);
}
export function isValidResortId(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
export function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
//# sourceMappingURL=domain.js.map