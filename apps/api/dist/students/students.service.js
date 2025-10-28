var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submitSelfEvaluation(mappingId, lessonId, dto) {
        const mapping = await this.prisma.studentMapping.findUnique({
            where: { id: mappingId }
        });
        if (!mapping) {
            throw new NotFoundException(`Student mapping ${mappingId} not found`);
        }
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId }
        });
        if (!lesson) {
            throw new NotFoundException(`Lesson ${lessonId} not found`);
        }
        if (dto.selfRating < 1 || dto.selfRating > 5) {
            throw new BadRequestException('Self rating must be between 1 and 5');
        }
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
};
StudentsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], StudentsService);
export { StudentsService };
//# sourceMappingURL=students.service.js.map