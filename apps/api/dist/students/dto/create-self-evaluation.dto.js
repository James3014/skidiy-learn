var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateSelfEvaluationDto {
}
__decorate([
    ApiProperty({
        description: 'Self-evaluation rating (1-5)',
        minimum: 1,
        maximum: 5,
        example: 3
    }),
    IsInt(),
    Min(1),
    Max(5),
    __metadata("design:type", Number)
], CreateSelfEvaluationDto.prototype, "selfRating", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Optional comment for self-evaluation',
        example: 'I have some experience with skiing but need more practice on turns'
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateSelfEvaluationDto.prototype, "selfComment", void 0);
//# sourceMappingURL=create-self-evaluation.dto.js.map