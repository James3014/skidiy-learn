import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AbilityResponseDto, toAbilityResponse } from './dto/ability-response.dto.js';

@Injectable()
export class AbilityService {
  constructor(private readonly prisma: PrismaService) {}

  async listAbilities(): Promise<AbilityResponseDto[]> {
    const abilities = await this.prisma.abilityCatalog.findMany({
      orderBy: [
        { sportType: 'asc' },
        { skillLevel: 'asc' },
        { sequenceInLevel: 'asc' }
      ]
    });
    return abilities.map(toAbilityResponse);
  }
}
