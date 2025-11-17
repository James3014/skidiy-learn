import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { INVITATION } from '../config/constants.js';

export class CreateInvitationDto {
  @IsString()
  seatId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number = INVITATION.DEFAULT_EXPIRY_DAYS;
}
