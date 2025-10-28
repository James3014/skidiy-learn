export function toLessonResponse(model) {
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
//# sourceMappingURL=lesson-response.dto.js.map