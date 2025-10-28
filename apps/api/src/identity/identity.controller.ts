import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IdentityService } from './identity.service.js';
import { SeatIdentityFormResponse } from './dto/seat-identity.dto.js';
import { SeatInvitationResponse } from './dto/seat-invitation.dto.js';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('seats/:seatId/invitation')
  async generateInvitation(@Param('seatId') seatId: string): Promise<SeatInvitationResponse> {
    return this.identityService.generateInvitation(seatId);
  }

  @Get('seats/:seatId/form')
  async getIdentity(@Param('seatId') seatId: string): Promise<SeatIdentityFormResponse | null> {
    return this.identityService.getIdentityForm(seatId);
  }

  @Patch('seats/:seatId/form')
  async submitIdentity(
    @Param('seatId') seatId: string,
    @Body() payload: Partial<SeatIdentityFormResponse>
  ): Promise<SeatIdentityFormResponse> {
    return this.identityService.submitIdentityForm(seatId, payload);
  }

  @Post('seats/:seatId/confirm')
  async confirmSeat(@Param('seatId') seatId: string): Promise<SeatIdentityFormResponse> {
    return this.identityService.confirmSeatClaim(seatId);
  }
}
