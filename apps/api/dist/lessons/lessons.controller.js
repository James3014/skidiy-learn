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
import { Controller, Get, Post, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LessonsService } from './lessons.service.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
let LessonsController = class LessonsController {
    constructor(lessonsService) {
        this.lessonsService = lessonsService;
    }
    async findAll(role, date, instructorId, resortId) {
        return this.lessonsService.findAll({
            role,
            date,
            instructorId,
            resortId: resortId ? parseInt(resortId, 10) : undefined
        });
    }
    async create(dto) {
        return this.lessonsService.create(dto);
    }
    async findOne(id) {
        return this.lessonsService.findOne(id);
    }
    async getSeats(id, include) {
        const includeSelfEval = include?.split(',').includes('self_eval') ?? false;
        return this.lessonsService.getSeatsWithStatus(id, includeSelfEval);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'List lessons with optional filters' }),
    ApiQuery({ name: 'role', required: false, enum: ['coach', 'student'] }),
    ApiQuery({ name: 'date', required: false, description: 'Filter by lesson date (ISO format)' }),
    ApiQuery({ name: 'instructorId', required: false }),
    ApiQuery({ name: 'resortId', required: false }),
    __param(0, Query('role')),
    __param(1, Query('date')),
    __param(2, Query('instructorId')),
    __param(3, Query('resortId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "findAll", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new lesson with seats' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateLessonDto]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "create", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get lesson details by ID' }),
    ApiParam({ name: 'id', description: 'Lesson ID' }),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "findOne", null);
__decorate([
    Get(':id/seats'),
    ApiOperation({ summary: 'Get seats for a lesson with status and optional self-evaluation' }),
    ApiParam({ name: 'id', description: 'Lesson ID' }),
    ApiQuery({ name: 'include', required: false, description: 'Comma-separated includes (e.g. "self_eval")' }),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Query('include')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getSeats", null);
LessonsController = __decorate([
    ApiTags('lessons'),
    Controller('api/v1/lessons'),
    __metadata("design:paramtypes", [LessonsService])
], LessonsController);
export { LessonsController };
//# sourceMappingURL=lessons.controller.js.map