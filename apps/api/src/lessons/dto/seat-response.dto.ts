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

export function toSeatResponse(
  model: OrderSeat & {
    claimedMapping?: {
      selfEvaluations?: StudentSelfEvaluation[]
    } | null
  },
  lessonId?: number
): SeatResponseDto {
  const selfEval = lessonId && model.claimedMapping?.selfEvaluations?.find(
    se => se.lessonId === lessonId
  );

  return {
    id: model.id,
    lessonId: model.lessonId,
    seatNumber: model.seatNumber,
    status: model.status,
    claimedMappingId: model.claimedMappingId,
    claimedAt: model.claimedAt?.toISOString() ?? null,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    selfEval: selfEval ? {
      selfRating: selfEval.selfRating,
      selfComment: selfEval.selfComment
    } : undefined
  };
}
