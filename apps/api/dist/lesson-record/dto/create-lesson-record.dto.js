var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { RecordShareVisibility, StudentPersona, CoachProficiencyBand } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateLessonDetailAnalysisDto {
}
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], CreateLessonDetailAnalysisDto.prototype, "analysisGroupId", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], CreateLessonDetailAnalysisDto.prototype, "analysisItemId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLessonDetailAnalysisDto.prototype, "customAnalysis", void 0);
export class CreateLessonDetailPracticeDto {
}
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], CreateLessonDetailPracticeDto.prototype, "skillId", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], CreateLessonDetailPracticeDto.prototype, "drillId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLessonDetailPracticeDto.prototype, "customDrill", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLessonDetailPracticeDto.prototype, "practiceNotes", void 0);
export class CreateLessonRecordDetailDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateLessonRecordDetailDto.prototype, "studentMappingId", void 0);
__decorate([
    IsOptional(),
    IsEnum(RecordShareVisibility),
    __metadata("design:type", typeof (_a = typeof RecordShareVisibility !== "undefined" && RecordShareVisibility) === "function" ? _a : Object)
], CreateLessonRecordDetailDto.prototype, "shareVisibility", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsEnum(StudentPersona, { each: true }),
    __metadata("design:type", Array)
], CreateLessonRecordDetailDto.prototype, "studentTypes", void 0);
__decorate([
    IsOptional(),
    ValidateNested({ each: true }),
    Type(() => CreateLessonDetailAnalysisDto),
    IsArray(),
    __metadata("design:type", Array)
], CreateLessonRecordDetailDto.prototype, "analyses", void 0);
__decorate([
    IsOptional(),
    ValidateNested({ each: true }),
    Type(() => CreateLessonDetailPracticeDto),
    IsArray(),
    __metadata("design:type", Array)
], CreateLessonRecordDetailDto.prototype, "practices", void 0);
export class CreateLessonRecordDto {
}
__decorate([
    IsInt(),
    __metadata("design:type", Number)
], CreateLessonRecordDto.prototype, "lessonId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLessonRecordDto.prototype, "summary", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], CreateLessonRecordDto.prototype, "videos", void 0);
__decorate([
    ArrayNotEmpty(),
    ValidateNested({ each: true }),
    Type(() => CreateLessonRecordDetailDto),
    __metadata("design:type", Array)
], CreateLessonRecordDto.prototype, "details", void 0);
export class CoachRatingItemDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CoachRatingItemDto.prototype, "lessonRecordDetailId", void 0);
__decorate([
    IsInt(),
    __metadata("design:type", Number)
], CoachRatingItemDto.prototype, "abilityId", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(3),
    __metadata("design:type", Number)
], CoachRatingItemDto.prototype, "rating", void 0);
__decorate([
    IsEnum(CoachProficiencyBand),
    __metadata("design:type", typeof (_b = typeof CoachProficiencyBand !== "undefined" && CoachProficiencyBand) === "function" ? _b : Object)
], CoachRatingItemDto.prototype, "proficiencyBand", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CoachRatingItemDto.prototype, "comment", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CoachRatingItemDto.prototype, "sourceRatingId", void 0);
export class CreateCoachRatingsDto {
}
__decorate([
    ArrayNotEmpty(),
    ValidateNested({ each: true }),
    Type(() => CoachRatingItemDto),
    __metadata("design:type", Array)
], CreateCoachRatingsDto.prototype, "ratings", void 0);
export class ReorderItemDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], ReorderItemDto.prototype, "id", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], ReorderItemDto.prototype, "displayOrder", void 0);
export class ReorderItemsDto {
}
__decorate([
    ArrayNotEmpty(),
    ValidateNested({ each: true }),
    Type(() => ReorderItemDto),
    __metadata("design:type", Array)
], ReorderItemsDto.prototype, "items", void 0);
//# sourceMappingURL=create-lesson-record.dto.js.map