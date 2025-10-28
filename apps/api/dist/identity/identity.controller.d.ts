import { IdentityService } from './identity.service.js';
import { SeatIdentityFormResponse } from './dto/seat-identity.dto.js';
import { SeatInvitationResponse } from './dto/seat-invitation.dto.js';
export declare class IdentityController {
    private readonly identityService;
    constructor(identityService: IdentityService);
    generateInvitation(seatId: string): Promise<SeatInvitationResponse>;
    getIdentity(seatId: string): Promise<SeatIdentityFormResponse | null>;
    submitIdentity(seatId: string, payload: Partial<SeatIdentityFormResponse>): Promise<SeatIdentityFormResponse>;
    confirmSeat(seatId: string): Promise<SeatIdentityFormResponse>;
}
