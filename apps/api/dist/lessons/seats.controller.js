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
import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { InvitationsService } from './invitations.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
let SeatsController = class SeatsController {
    constructor(seatsService, invitationsService) {
        this.seatsService = seatsService;
        this.invitationsService = invitationsService;
    }
    async findOne(id) {
        return this.seatsService.findBySeatId(id);
    }
    async generateInvitation(id, dto) {
        const expiresInDays = dto?.expiresInDays ?? 7;
        return this.invitationsService.generateInvitation(id, expiresInDays);
    }
    async getIdentityForm(id) {
        return this.seatsService.getSeatIdentityForm(id);
    }
    async updateIdentityForm(id, data) {
        return this.seatsService.updateSeatIdentityForm(id, data);
    }
};
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "findOne", null);
__decorate([
    Post(':id/invitations'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateInvitationDto]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "generateInvitation", null);
__decorate([
    Get(':id/identity-form'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "getIdentityForm", null);
__decorate([
    Put(':id/identity-form'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "updateIdentityForm", null);
SeatsController = __decorate([
    Controller('api/v1/seats'),
    __metadata("design:paramtypes", [SeatsService,
        InvitationsService])
], SeatsController);
export { SeatsController };
//# sourceMappingURL=seats.controller.js.map