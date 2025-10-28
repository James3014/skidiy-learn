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
export declare function mapSkill(skill: Skill, drills: PracticeDrill[]): SkillResponseDto;
export declare function mapDrill(drill: PracticeDrill): PracticeDrillResponseDto;
