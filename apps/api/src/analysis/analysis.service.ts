import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AnalysisGroupResponse, mapGroup } from './dto/analysis-item.response.js';

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async listGroups(): Promise<AnalysisGroupResponse[]> {
    const groups = await this.prisma.analysisGroup.findMany({
      orderBy: [{ sportType: 'asc' }, { displayOrder: 'asc' }]
    });

    const items = await this.prisma.analysisItem.findMany({
      orderBy: [{ sportType: 'asc' }, { displayOrder: 'asc' }]
    });

    const itemsByGroup = new Map<number, typeof items>();
    for (const item of items) {
      if (!itemsByGroup.has(item.groupId)) {
        itemsByGroup.set(item.groupId, []);
      }
      itemsByGroup.get(item.groupId)!.push(item);
    }

    return groups.map((group) => mapGroup(group, itemsByGroup.get(group.id) ?? []));
  }
}
