import { IsString, IsOptional, IsEmail, IsDateString, IsBoolean } from 'class-validator';

export class ClaimInvitationDto {
  @IsString()
  code!: string;

  @IsString()
  studentName!: string;

  @IsOptional()
  @IsString()
  studentEnglish?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  isMinor?: boolean;

  @IsOptional()
  @IsBoolean()
  hasExternalInsurance?: boolean;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
