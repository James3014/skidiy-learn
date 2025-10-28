import { AnalysisService } from './analysis.service.js';
import { AnalysisGroupResponse } from './dto/analysis-item.response.js';
export declare class AnalysisController {
    private readonly analysisService;
    constructor(analysisService: AnalysisService);
    getAll(): Promise<AnalysisGroupResponse[]>;
}
