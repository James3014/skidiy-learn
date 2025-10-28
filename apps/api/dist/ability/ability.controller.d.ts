import { AbilityService } from './ability.service.js';
import { AbilityResponseDto } from './dto/ability-response.dto.js';
export declare class AbilityController {
    private readonly abilityService;
    constructor(abilityService: AbilityService);
    getAll(): Promise<AbilityResponseDto[]>;
}
