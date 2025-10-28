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

export function toAbilityResponse(model: AbilityCatalog): AbilityResponseDto {
  return {
    id: model.id,
    name: model.name,
    category: model.category,
    sportType: model.sportType,
    skillLevel: model.skillLevel,
    sequenceInLevel: model.sequenceInLevel,
    description: model.description
  };
}
