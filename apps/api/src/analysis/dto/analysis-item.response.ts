import { AnalysisGroup, AnalysisItem } from '@prisma/client';

export interface AnalysisGroupResponse {
  id: number;
  name: string;
  sportType: string;
  description: string | null;
  displayOrder: number;
  items: AnalysisItemResponse[];
}

export interface AnalysisItemResponse {
  id: number;
  groupId: number;
  name: string;
  description: string | null;
  sportType: string;
  displayOrder: number;
}

export function mapGroup(group: AnalysisGroup, items: AnalysisItem[]): AnalysisGroupResponse {
  return {
    id: group.id,
    name: group.name,
    sportType: group.sportType,
    description: group.description,
    displayOrder: group.displayOrder,
    items: items.map(mapItem)
  };
}

export function mapItem(item: AnalysisItem): AnalysisItemResponse {
  return {
    id: item.id,
    groupId: item.groupId,
    name: item.name,
    description: item.description,
    sportType: item.sportType,
    displayOrder: item.displayOrder
  };
}
