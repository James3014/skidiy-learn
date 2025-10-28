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
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IdentityService } from './identity.service.js';
let IdentityController = class IdentityController {
    constructor(identityService) {
        this.identityService = identityService;
    }
    async generateInvitation(seatId) {
        return this.identityService.generateInvitation(seatId);
    }
    async getIdentity(seatId) {
        return this.identityService.getIdentityForm(seatId);
    }
    async submitIdentity(seatId, payload) {
        return this.identityService.submitIdentityForm(seatId, payload);
    }
    async confirmSeat(seatId) {
        return this.identityService.confirmSeatClaim(seatId);
    }
};
__decorate([
    Post('seats/:seatId/invitation'),
    __param(0, Param('seatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IdentityController.prototype, "generateInvitation", null);
__decorate([
    Get('seats/:seatId/form'),
    __param(0, Param('seatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IdentityController.prototype, "getIdentity", null);
__decorate([
    Patch('seats/:seatId/form'),
    __param(0, Param('seatId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IdentityController.prototype, "submitIdentity", null);
__decorate([
    Post('seats/:seatId/confirm'),
    __param(0, Param('seatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IdentityController.prototype, "confirmSeat", null);
IdentityController = __decorate([
    Controller('identity'),
    __metadata("design:paramtypes", [IdentityService])
], IdentityController);
export { IdentityController };
//# sourceMappingURL=identity.controller.js.map