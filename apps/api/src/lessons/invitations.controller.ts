import {
  Controller,
  Get,
  Post,
  Param,
  Body
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service.js';
import { ClaimInvitationDto } from './dto/claim-invitation.dto.js';
import { InvitationResponseDto } from './dto/invitation-response.dto.js';

@ApiTags('invitations')
@Controller('api/v1/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Verify invitation code validity' })
  @ApiParam({ name: 'code', description: '8-character invitation code' })
  async verifyCode(@Param('code') code: string): Promise<InvitationResponseDto> {
    return this.invitationsService.verifyCode(code);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim a seat using invitation code and student information' })
  async claimSeat(@Body() dto: ClaimInvitationDto): Promise<{
    seatId: string;
    mappingId: string;
    message: string;
  }> {
    return this.invitationsService.claimSeat(dto);
  }

  @Post(':code/identity')
  @ApiOperation({ summary: 'Submit or update identity form before claiming seat' })
  @ApiParam({ name: 'code', description: '8-character invitation code' })
  async submitIdentityForm(
    @Param('code') code: string,
    @Body() data: {
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
    }
  ) {
    return this.invitationsService.submitIdentityForm(code, data);
  }
}
