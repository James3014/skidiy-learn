import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSelfEvaluationDto } from './dto/create-self-evaluation.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitSelfEvaluation(
    mappingId: string,
    lessonId: number,
    dto: CreateSelfEvaluationDto
  ) {
    // Validate that the mapping exists
    const mapping = await this.prisma.studentMapping.findUnique({
      where: { id: mappingId }
    });

    if (!mapping) {
      throw new NotFoundException(`Student mapping ${mappingId} not found`);
    }

    // Validate that the lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }

    // Validate rating range
    if (dto.selfRating < 1 || dto.selfRating > 5) {
      throw new BadRequestException('Self rating must be between 1 and 5');
    }

    // Upsert self-evaluation
    const selfEval = await this.prisma.studentSelfEvaluation.upsert({
      where: {
        studentMappingId_lessonId: {
          studentMappingId: mappingId,
          lessonId: lessonId
        }
      },
      create: {
        studentMappingId: mappingId,
        lessonId: lessonId,
        selfRating: dto.selfRating,
        selfComment: dto.selfComment || null
      },
      update: {
        selfRating: dto.selfRating,
        selfComment: dto.selfComment || null,
        updatedAt: new Date()
      }
    });

    return {
      id: selfEval.id,
      studentMappingId: selfEval.studentMappingId,
      lessonId: selfEval.lessonId,
      selfRating: selfEval.selfRating,
      selfComment: selfEval.selfComment,
      updatedAt: selfEval.updatedAt.toISOString(),
      message: 'Self-evaluation submitted successfully'
    };
  }
}
