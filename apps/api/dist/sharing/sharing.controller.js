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
import { Body, Controller, Patch, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SharingService } from './sharing.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
let SharingController = class SharingController {
    constructor(sharingService) {
        this.sharingService = sharingService;
    }
    async updateVisibility(detailId, visibility, accountId) {
        return this.sharingService.updateShareVisibility(detailId, accountId, visibility);
    }
    async querySharedRecords(resortId, sportType, limit, accountId) {
        return this.sharingService.querySharedRecords(accountId, {
            resortId: resortId ? parseInt(resortId) : undefined,
            sportType: sportType,
            limit: limit ? parseInt(limit) : 20
        });
    }
};
__decorate([
    Roles('instructor'),
    Patch('details/:detailId/visibility'),
    ApiOperation({ summary: 'Update share visibility for a lesson record detail' }),
    ApiParam({ name: 'detailId', description: 'Lesson record detail ID' }),
    __param(0, Param('detailId')),
    __param(1, Body('visibility')),
    __param(2, CurrentUser('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "updateVisibility", null);
__decorate([
    Roles('instructor', 'admin'),
    Get('records'),
    ApiOperation({ summary: 'Query shared teaching records with filters' }),
    ApiQuery({ name: 'resortId', required: false, description: 'Filter by resort ID' }),
    ApiQuery({ name: 'sportType', required: false, enum: ['ski', 'snowboard'], description: 'Filter by sport type' }),
    ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results (default: 20)' }),
    __param(0, Query('resortId')),
    __param(1, Query('sportType')),
    __param(2, Query('limit')),
    __param(3, CurrentUser('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "querySharedRecords", null);
SharingController = __decorate([
    ApiTags('sharing'),
    ApiBearerAuth('JWT-auth'),
    Controller('api/v1/sharing'),
    __metadata("design:paramtypes", [SharingService])
], SharingController);
export { SharingController };
//# sourceMappingURL=sharing.controller.js.map