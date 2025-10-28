import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  seatId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number = 7;
}
