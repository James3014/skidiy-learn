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
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { LessonRecordService } from './lesson-record.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateLessonRecordDto, CreateCoachRatingsDto, ReorderItemsDto } from './dto/create-lesson-record.dto.js';
let LessonRecordController = class LessonRecordController {
    constructor(lessonRecordService) {
        this.lessonRecordService = lessonRecordService;
    }
    async listPrivate(accountId) {
        return this.lessonRecordService.listPrivateRecords(accountId);
    }
    async listShared(accountId) {
        return this.lessonRecordService.listSharedRecords(accountId);
    }
    async create(dto) {
        return this.lessonRecordService.createLessonRecord(dto);
    }
    async reorderAnalyses(detailId, dto) {
        await this.lessonRecordService.reorderAnalyses(detailId, dto);
    }
    async reorderPractices(detailId, dto) {
        await this.lessonRecordService.reorderPractices(detailId, dto);
    }
    async createRatings(accountId, dto) {
        return this.lessonRecordService.createCoachRatings(accountId, dto);
    }
    async getLatestRatings(mappingId) {
        return this.lessonRecordService.getLatestRatings(mappingId);
    }
};
__decorate([
    Roles('instructor', 'admin'),
    Get('private'),
    ApiOperation({ summary: 'List private lesson records for authenticated instructor' }),
    __param(0, CurrentUser('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonRecordController.prototype, "listPrivate", null);
__decorate([
    Roles('instructor', 'admin'),
    Get('shared'),
    ApiOperation({ summary: 'List shared lesson records accessible to instructor' }),
    __param(0, CurrentUser('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonRecordController.prototype, "listShared", null);
__decorate([
    Roles('instructor'),
    Post(),
    ApiOperation({ summary: 'Create a new lesson record with analyses and practices' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateLessonRecordDto]),
    __metadata("design:returntype", Promise)
], LessonRecordController.prototype, "create", null);
__decorate([
    Roles('instructor'),
    Post(':detailId/analyses/reorder'),
    ApiOperation({ summary: 'Reorder analysis items for a lesson detail' }),
    ApiParam({ name: 'detailId', description: 'Lesson record detail ID' }),
    __param(0, Param('detailId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReorderItemsDto]),
    __metadata("design:returntype", Promise)
], LessonRecordController.prototype, "reorderAnalyses", null);
__decorate([
    Roles('instructor'),
    Post(':detailId/practices/reorder'),
    ApiOperation({ summary: 'Reorder practice items for a lesson detail' }),
    ApiParam({ name: 'detailId', description: 'Lesson record detail ID' }),
    __param(0, Param('detailId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReorderItemsDto]),
    __metadata("design:returntype", Promise)
], LessonRecordController.prototype, "reorderPractices", null);
__decorate([
    Roles('instructor'),
    Post('ratings'),
    ApiOperation({ summary: 'Create coach ability ratings for students' }),
    __param(0, CurrentUser('accountId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateCoachRatingsDto]),
    __metadata("design:returntype", Promise)
], LessonRecordController.prototype, "createRatings", null);
__decorate([
    Get('students/:mappingId/latest-ratings'),
    ApiOperation({ summary: 'Get latest ability ratings for a student' }),
    ApiParam({ name: 'mappingId', description: 'Student mapping ID' }),
    __param(0, Param('mappingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonRecordController.prototype, "getLatestRatings", null);
LessonRecordController = __decorate([
    ApiTags('lesson-records'),
    ApiBearerAuth('JWT-auth'),
    Controller('api/v1/lesson-records'),
    __metadata("design:paramtypes", [LessonRecordService])
], LessonRecordController);
export { LessonRecordController };
//# sourceMappingURL=lesson-record.controller.js.map