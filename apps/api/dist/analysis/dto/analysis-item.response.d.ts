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
export declare function mapGroup(group: AnalysisGroup, items: AnalysisItem[]): AnalysisGroupResponse;
export declare function mapItem(item: AnalysisItem): AnalysisItemResponse;
