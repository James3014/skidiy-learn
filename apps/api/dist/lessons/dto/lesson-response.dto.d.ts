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
export declare function toLessonResponse(model: Lesson & {
    seats?: OrderSeat[];
}): LessonResponseDto;
