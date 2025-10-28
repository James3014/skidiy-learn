import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SkillResponseDto, mapSkill } from './dto/skill-response.dto.js';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async listSkills(): Promise<SkillResponseDto[]> {
    const skills = await this.prisma.skill.findMany({
      orderBy: [{ sportType: 'asc' }, { displayOrder: 'asc' }]
    });

    const drills = await this.prisma.practiceDrill.findMany({
      orderBy: [{ sportType: 'asc' }, { displayOrder: 'asc' }]
    });

    const drillMap = new Map<number, typeof drills>();
    for (const drill of drills) {
      if (drill.skillId == null) continue;
      if (!drillMap.has(drill.skillId)) {
        drillMap.set(drill.skillId, []);
      }
      drillMap.get(drill.skillId)!.push(drill);
    }

    return skills.map((skill) => mapSkill(skill, drillMap.get(skill.id) ?? []));
  }
}
