import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body
} from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { InvitationsService } from './invitations.service.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { InvitationResponseDto } from './dto/invitation-response.dto.js';

@Controller('api/v1/seats')
export class SeatsController {
  constructor(
    private readonly seatsService: SeatsService,
    private readonly invitationsService: InvitationsService
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SeatResponseDto> {
    return this.seatsService.findBySeatId(id);
  }

  @Post(':id/invitations')
  async generateInvitation(
    @Param('id') id: string,
    @Body() dto?: CreateInvitationDto
  ): Promise<InvitationResponseDto> {
    const expiresInDays = dto?.expiresInDays ?? 7;
    return this.invitationsService.generateInvitation(id, expiresInDays);
  }

  @Get(':id/identity-form')
  async getIdentityForm(@Param('id') id: string) {
    return this.seatsService.getSeatIdentityForm(id);
  }

  @Put(':id/identity-form')
  async updateIdentityForm(
    @Param('id') id: string,
    @Body() data: {
      studentName?: string;
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
    return this.seatsService.updateSeatIdentityForm(id, data);
  }
}
