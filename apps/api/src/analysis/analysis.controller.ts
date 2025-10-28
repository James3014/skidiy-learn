import { Controller, Get } from '@nestjs/common';
import { AnalysisService } from './analysis.service.js';
import { AnalysisGroupResponse } from './dto/analysis-item.response.js';

@Controller('analysis-groups')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  async getAll(): Promise<AnalysisGroupResponse[]> {
    return this.analysisService.listGroups();
  }
}
