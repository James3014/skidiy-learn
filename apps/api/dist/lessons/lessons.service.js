var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { toLessonResponse } from './dto/lesson-response.dto.js';
import { toSeatResponse } from './dto/seat-response.dto.js';
let LessonsService = class LessonsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters = {}) {
        const where = {};
        if (filters.instructorId) {
            where.instructorId = filters.instructorId;
        }
        if (typeof filters.resortId === 'number') {
            where.resortId = filters.resortId;
        }
        if (filters.date) {
            const targetDate = new Date(filters.date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            where.lessonDate = {
                gte: targetDate,
                lt: nextDay
            };
        }
        const lessons = await this.prisma.lesson.findMany({
            where,
            include: {
                seats: true
            },
            orderBy: {
                lessonDate: 'desc'
            }
        });
        return lessons.map(toLessonResponse);
    }
    async findOne(id) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id },
            include: {
                seats: true
            }
        });
        if (!lesson) {
            throw new NotFoundException(`Lesson with id ${id} not found`);
        }
        return toLessonResponse(lesson);
    }
    async create(dto) {
        const lesson = await this.prisma.lesson.create({
            data: {
                resortId: dto.resortId,
                instructorId: dto.instructorId,
                lessonDate: new Date(dto.lessonDate),
                seats: {
                    create: Array.from({ length: dto.seatCount }, (_, i) => ({
                        seatNumber: i + 1,
                        status: 'pending'
                    }))
                }
            },
            include: {
                seats: true
            }
        });
        return toLessonResponse(lesson);
    }
    async getSeatsWithStatus(lessonId, includeSelfEval = false) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId }
        });
        if (!lesson) {
            throw new NotFoundException(`Lesson with id ${lessonId} not found`);
        }
        const seatInclude = includeSelfEval
            ? {
                claimedMapping: {
                    include: {
                        selfEvaluations: {
                            where: { lessonId }
                        }
                    }
                }
            }
            : undefined;
        const seats = await this.prisma.orderSeat.findMany({
            where: { lessonId },
            include: seatInclude,
            orderBy: {
                seatNumber: 'asc'
            }
        });
        return seats.map(seat => toSeatResponse(seat, lessonId));
    }
};
LessonsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], LessonsService);
export { LessonsService };
//# sourceMappingURL=lessons.service.js.map