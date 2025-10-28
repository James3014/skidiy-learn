var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsInt, IsString, IsDateString, Min, Max } from 'class-validator';
export class CreateLessonDto {
}
__decorate([
    IsInt(),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "resortId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateLessonDto.prototype, "instructorId", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateLessonDto.prototype, "lessonDate", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(6),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "seatCount", void 0);
//# sourceMappingURL=create-lesson.dto.js.map