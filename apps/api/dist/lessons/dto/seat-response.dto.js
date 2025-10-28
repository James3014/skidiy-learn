export function toSeatResponse(model, lessonId) {
    const selfEval = lessonId && model.claimedMapping?.selfEvaluations?.find(se => se.lessonId === lessonId);
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
//# sourceMappingURL=seat-response.dto.js.map