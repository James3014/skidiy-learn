import { PracticeDrill, Skill } from '@prisma/client';

export interface SkillResponseDto {
  id: number;
  name: string;
  nameEn: string | null;
  sportType: string;
  description: string | null;
  displayOrder: number;
  drills: PracticeDrillResponseDto[];
}

export interface PracticeDrillResponseDto {
  id: number;
  skillId: number | null;
  name: string;
  nameEn: string | null;
  description: string | null;
  sportType: string;
  displayOrder: number;
}

export function mapSkill(skill: Skill, drills: PracticeDrill[]): SkillResponseDto {
  return {
    id: skill.id,
    name: skill.name,
    nameEn: skill.nameEn ?? null,
    sportType: skill.sportType,
    description: skill.description ?? null,
    displayOrder: skill.displayOrder,
    drills: drills.map(mapDrill)
  };
}

export function mapDrill(drill: PracticeDrill): PracticeDrillResponseDto {
  return {
    id: drill.id,
    skillId: drill.skillId,
    name: drill.name,
    nameEn: drill.nameEn ?? null,
    description: drill.description ?? null,
    sportType: drill.sportType,
    displayOrder: drill.displayOrder
  };
}
