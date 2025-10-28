import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { LessonResponseDto, toLessonResponse } from './dto/lesson-response.dto.js';
import { SeatResponseDto, toSeatResponse } from './dto/seat-response.dto.js';

export interface LessonFilters {
  role?: 'coach' | 'student';
  date?: string;
  instructorId?: string;
  resortId?: number;
}

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: LessonFilters = {}): Promise<LessonResponseDto[]> {
    const where: Prisma.LessonWhereInput = {};

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

  async findOne(id: number): Promise<LessonResponseDto> {
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

  async create(dto: CreateLessonDto): Promise<LessonResponseDto> {
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

  async getSeatsWithStatus(
    lessonId: number,
    includeSelfEval: boolean = false
  ): Promise<SeatResponseDto[]> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }

    const seatInclude: Prisma.OrderSeatInclude | undefined = includeSelfEval
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
}
