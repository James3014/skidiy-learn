import { Injectable, NotFoundException } from '@nestjs/common';
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
    // Validate mapping exists (lesson validation happens implicitly via foreign key)
    const mapping = await this.prisma.studentMapping.findUnique({
      where: { id: mappingId }
    });

    if (!mapping) {
      throw new NotFoundException(`Student mapping ${mappingId} not found`);
    }

    // Note: Rating range validation is handled by DTO @Min/@Max decorators
    // Upsert self-evaluation - foreign key constraint will validate lesson exists
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
