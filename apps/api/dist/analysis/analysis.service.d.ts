import { PrismaService } from '../prisma/prisma.service.js';
import { AnalysisGroupResponse } from './dto/analysis-item.response.js';
export declare class AnalysisService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listGroups(): Promise<AnalysisGroupResponse[]>;
}
