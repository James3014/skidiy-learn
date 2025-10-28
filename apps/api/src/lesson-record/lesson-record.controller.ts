import {
  Body,
  Controller,
  Get,
  Param,
  Post
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { LessonRecordService } from './lesson-record.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  LessonRecordResponse,
  PublicLessonRecordResponse,
  CoachRatingResponse,
  LatestRatingResponse
} from './dto/lesson-record.response.js';
import {
  CreateLessonRecordDto,
  CreateCoachRatingsDto,
  ReorderItemsDto
} from './dto/create-lesson-record.dto.js';

@ApiTags('lesson-records')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/lesson-records')
export class LessonRecordController {
  constructor(private readonly lessonRecordService: LessonRecordService) {}

  @Roles('instructor', 'admin')
  @Get('private')
  @ApiOperation({ summary: 'List private lesson records for authenticated instructor' })
  async listPrivate(@CurrentUser('accountId') accountId: string): Promise<LessonRecordResponse[]> {
    return this.lessonRecordService.listPrivateRecords(accountId);
  }

  @Roles('instructor', 'admin')
  @Get('shared')
  @ApiOperation({ summary: 'List shared lesson records accessible to instructor' })
  async listShared(@CurrentUser('accountId') accountId: string): Promise<PublicLessonRecordResponse[]> {
    return this.lessonRecordService.listSharedRecords(accountId);
  }

  @Roles('instructor')
  @Post()
  @ApiOperation({ summary: 'Create a new lesson record with analyses and practices' })
  async create(@Body() dto: CreateLessonRecordDto): Promise<LessonRecordResponse> {
    return this.lessonRecordService.createLessonRecord(dto);
  }

  @Roles('instructor')
  @Post(':detailId/analyses/reorder')
  @ApiOperation({ summary: 'Reorder analysis items for a lesson detail' })
  @ApiParam({ name: 'detailId', description: 'Lesson record detail ID' })
  async reorderAnalyses(
    @Param('detailId') detailId: string,
    @Body() dto: ReorderItemsDto
  ): Promise<void> {
    await this.lessonRecordService.reorderAnalyses(detailId, dto);
  }

  @Roles('instructor')
  @Post(':detailId/practices/reorder')
  @ApiOperation({ summary: 'Reorder practice items for a lesson detail' })
  @ApiParam({ name: 'detailId', description: 'Lesson record detail ID' })
  async reorderPractices(
    @Param('detailId') detailId: string,
    @Body() dto: ReorderItemsDto
  ): Promise<void> {
    await this.lessonRecordService.reorderPractices(detailId, dto);
  }

  @Roles('instructor')
  @Post('ratings')
  @ApiOperation({ summary: 'Create coach ability ratings for students' })
  async createRatings(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: CreateCoachRatingsDto
  ): Promise<CoachRatingResponse[]> {
    return this.lessonRecordService.createCoachRatings(accountId, dto);
  }

  @Get('students/:mappingId/latest-ratings')
  @ApiOperation({ summary: 'Get latest ability ratings for a student' })
  @ApiParam({ name: 'mappingId', description: 'Student mapping ID' })
  async getLatestRatings(@Param('mappingId') mappingId: string): Promise<LatestRatingResponse[]> {
    return this.lessonRecordService.getLatestRatings(mappingId);
  }
}
