import { AbilityCatalog } from '@prisma/client';
export type AbilityResponseDto = {
    id: number;
    name: string;
    category: string;
    sportType: string;
    skillLevel: number;
    sequenceInLevel: number;
    description: string | null;
};
export declare function toAbilityResponse(model: AbilityCatalog): AbilityResponseDto;
