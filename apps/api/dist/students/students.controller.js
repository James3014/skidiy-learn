var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service.js';
import { CreateSelfEvaluationDto } from './dto/create-self-evaluation.dto.js';
let StudentsController = class StudentsController {
    constructor(studentsService) {
        this.studentsService = studentsService;
    }
    async submitSelfEvaluation(mappingId, lessonId, dto) {
        const lessonIdNum = parseInt(lessonId, 10);
        return this.studentsService.submitSelfEvaluation(mappingId, lessonIdNum, dto);
    }
};
__decorate([
    Post(':mappingId/lessons/:lessonId/self-eval'),
    ApiOperation({ summary: 'Submit or update student self-evaluation for a lesson' }),
    ApiParam({ name: 'mappingId', description: 'Student mapping ID' }),
    ApiParam({ name: 'lessonId', description: 'Lesson ID', type: 'integer' }),
    __param(0, Param('mappingId')),
    __param(1, Param('lessonId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, CreateSelfEvaluationDto]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "submitSelfEvaluation", null);
StudentsController = __decorate([
    ApiTags('students'),
    Controller('api/v1/students'),
    __metadata("design:paramtypes", [StudentsService])
], StudentsController);
export { StudentsController };
//# sourceMappingURL=students.controller.js.map