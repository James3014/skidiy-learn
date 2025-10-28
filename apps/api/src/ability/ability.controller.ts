import { Controller, Get } from '@nestjs/common';
import { AbilityService } from './ability.service.js';
import { AbilityResponseDto } from './dto/ability-response.dto.js';

@Controller('abilities')
export class AbilityController {
  constructor(private readonly abilityService: AbilityService) {}

  @Get()
  async getAll(): Promise<AbilityResponseDto[]> {
    return this.abilityService.listAbilities();
  }
}
