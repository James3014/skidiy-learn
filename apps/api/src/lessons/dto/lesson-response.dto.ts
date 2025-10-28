import { Lesson, OrderSeat } from '@prisma/client';

export type LessonResponseDto = {
  id: number;
  resortId: number;
  instructorId: string;
  lessonDate: string;
  createdAt: string;
  updatedAt: string;
  seatCount?: number;
};

export function toLessonResponse(
  model: Lesson & { seats?: OrderSeat[] }
): LessonResponseDto {
  return {
    id: model.id,
    resortId: model.resortId,
    instructorId: model.instructorId,
    lessonDate: model.lessonDate.toISOString(),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    seatCount: model.seats?.length
  };
}
