var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEmail, IsDateString, IsBoolean } from 'class-validator';
export class ClaimInvitationDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "code", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "studentName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "studentEnglish", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "birthDate", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "contactEmail", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "guardianEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "contactPhone", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ClaimInvitationDto.prototype, "isMinor", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ClaimInvitationDto.prototype, "hasExternalInsurance", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "insuranceProvider", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ClaimInvitationDto.prototype, "note", void 0);
//# sourceMappingURL=claim-invitation.dto.js.map