import { Controller, Get, Post, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LessonsService } from './lessons.service.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { LessonResponseDto } from './dto/lesson-response.dto.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';

@ApiTags('lessons')
@Controller('api/v1/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'List lessons with optional filters' })
  @ApiQuery({ name: 'role', required: false, enum: ['coach', 'student'] })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by lesson date (ISO format)' })
  @ApiQuery({ name: 'instructorId', required: false })
  @ApiQuery({ name: 'resortId', required: false })
  async findAll(
    @Query('role') role?: 'coach' | 'student',
    @Query('date') date?: string,
    @Query('instructorId') instructorId?: string,
    @Query('resortId') resortId?: string
  ): Promise<LessonResponseDto[]> {
    return this.lessonsService.findAll({
      role,
      date,
      instructorId,
      resortId: resortId ? parseInt(resortId, 10) : undefined
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lesson with seats' })
  async create(@Body() dto: CreateLessonDto): Promise<LessonResponseDto> {
    return this.lessonsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson details by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LessonResponseDto> {
    return this.lessonsService.findOne(id);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'Get seats for a lesson with status and optional self-evaluation' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiQuery({ name: 'include', required: false, description: 'Comma-separated includes (e.g. "self_eval")' })
  async getSeats(
    @Param('id', ParseIntPipe) id: number,
    @Query('include') include?: string
  ): Promise<SeatResponseDto[]> {
    const includeSelfEval = include?.split(',').includes('self_eval') ?? false;
    return this.lessonsService.getSeatsWithStatus(id, includeSelfEval);
  }
}
