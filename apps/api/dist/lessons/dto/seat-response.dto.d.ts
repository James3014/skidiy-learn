import { OrderSeat, SeatStatus, StudentSelfEvaluation } from '@prisma/client';
export type SeatResponseDto = {
    id: string;
    lessonId: number;
    seatNumber: number;
    status: SeatStatus;
    claimedMappingId: string | null;
    claimedAt: string | null;
    createdAt: string;
    updatedAt: string;
    selfEval?: {
        selfRating: number;
        selfComment: string | null;
    } | null;
};
export declare function toSeatResponse(model: OrderSeat & {
    claimedMapping?: {
        selfEvaluations?: StudentSelfEvaluation[];
    } | null;
}, lessonId?: number): SeatResponseDto;
