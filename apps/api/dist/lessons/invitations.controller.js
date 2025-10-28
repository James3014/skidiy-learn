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
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service.js';
import { ClaimInvitationDto } from './dto/claim-invitation.dto.js';
let InvitationsController = class InvitationsController {
    constructor(invitationsService) {
        this.invitationsService = invitationsService;
    }
    async verifyCode(code) {
        return this.invitationsService.verifyCode(code);
    }
    async claimSeat(dto) {
        return this.invitationsService.claimSeat(dto);
    }
    async submitIdentityForm(code, data) {
        return this.invitationsService.submitIdentityForm(code, data);
    }
};
__decorate([
    Get(':code'),
    ApiOperation({ summary: 'Verify invitation code validity' }),
    ApiParam({ name: 'code', description: '8-character invitation code' }),
    __param(0, Param('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "verifyCode", null);
__decorate([
    Post('claim'),
    ApiOperation({ summary: 'Claim a seat using invitation code and student information' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ClaimInvitationDto]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "claimSeat", null);
__decorate([
    Post(':code/identity'),
    ApiOperation({ summary: 'Submit or update identity form before claiming seat' }),
    ApiParam({ name: 'code', description: '8-character invitation code' }),
    __param(0, Param('code')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "submitIdentityForm", null);
InvitationsController = __decorate([
    ApiTags('invitations'),
    Controller('api/v1/invitations'),
    __metadata("design:paramtypes", [InvitationsService])
], InvitationsController);
export { InvitationsController };
//# sourceMappingURL=invitations.controller.js.map