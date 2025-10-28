var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, ConflictException, GoneException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { toInvitationResponse } from './dto/invitation-response.dto.js';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
let InvitationsService = class InvitationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateInvitation(seatId, expiresInDays = 7) {
        const seat = await this.prisma.orderSeat.findUnique({
            where: { id: seatId }
        });
        if (!seat) {
            throw new NotFoundException(`Seat with id ${seatId} not found`);
        }
        const maxRetries = 5;
        let invitation = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const code = this.generateCode();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + expiresInDays);
                invitation = await this.prisma.seatInvitation.create({
                    data: {
                        code,
                        seatId,
                        expiresAt
                    }
                });
                await this.prisma.orderSeat.update({
                    where: { id: seatId },
                    data: {
                        status: 'invited',
                        updatedAt: new Date()
                    }
                });
                break;
            }
            catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2002' &&
                    attempt < maxRetries - 1) {
                    continue;
                }
                throw error;
            }
        }
        if (!invitation) {
            throw new ConflictException({
                code: 'INVITE_CODE_COLLISION',
                message: '邀請碼產生多次碰撞，請稍後再試'
            });
        }
        return toInvitationResponse(invitation);
    }
    async verifyCode(code) {
        const invitation = await this.prisma.seatInvitation.findUnique({
            where: { code }
        });
        if (!invitation) {
            throw new NotFoundException({
                code: 'INVITE_NOT_FOUND',
                message: '邀請碼不存在'
            });
        }
        const now = new Date();
        if (invitation.expiresAt < now) {
            throw new GoneException({
                code: 'INVITE_EXPIRED',
                message: '邀請碼已過期'
            });
        }
        if (invitation.claimedAt) {
            throw new ConflictException({
                code: 'INVITE_ALREADY_CLAIMED',
                message: '邀請碼已被使用'
            });
        }
        return toInvitationResponse(invitation);
    }
    async claimSeat(dto) {
        const invitation = await this.prisma.seatInvitation.findUnique({
            where: { code: dto.code },
            include: {
                seat: {
                    include: {
                        identityForm: true
                    }
                }
            }
        });
        if (!invitation) {
            throw new NotFoundException({
                code: 'INVITE_NOT_FOUND',
                message: '邀請碼不存在'
            });
        }
        const now = new Date();
        if (invitation.expiresAt < now) {
            throw new GoneException({
                code: 'INVITE_EXPIRED',
                message: '邀請碼已過期'
            });
        }
        if (invitation.claimedAt) {
            throw new ConflictException({
                code: 'INVITE_ALREADY_CLAIMED',
                message: '邀請碼已被使用'
            });
        }
        const identityForm = invitation.seat.identityForm;
        if (!identityForm || identityForm.status === 'draft') {
            throw new UnprocessableEntityException({
                code: 'IDENTITY_FORM_INCOMPLETE',
                message: '請先完成身份資料填寫'
            });
        }
        const seat = invitation.seat;
        if (seat.status === 'claimed') {
            throw new ConflictException({
                code: 'SEAT_CLAIMED',
                message: '席位已被認領',
                details: {
                    claimedAt: seat.claimedAt,
                    claimedBy: seat.claimedMappingId
                }
            });
        }
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: seat.lessonId }
        });
        if (!lesson) {
            throw new NotFoundException('課程不存在');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const contactFilters = [];
            if (dto.contactEmail) {
                contactFilters.push({ email: dto.contactEmail });
            }
            if (dto.contactPhone) {
                contactFilters.push({ phone: dto.contactPhone });
            }
            let globalStudent = await tx.globalStudent.findFirst({
                where: contactFilters.length ? { OR: contactFilters } : undefined
            });
            if (!globalStudent) {
                globalStudent = await tx.globalStudent.create({
                    data: {
                        email: dto.contactEmail,
                        phone: dto.contactPhone,
                        birthDate: dto.birthDate ? new Date(dto.birthDate) : null
                    }
                });
            }
            const mapping = await tx.studentMapping.create({
                data: {
                    globalStudentId: globalStudent.id,
                    resortId: lesson.resortId
                }
            });
            try {
                await tx.orderSeat.update({
                    where: {
                        id: seat.id,
                        version: seat.version
                    },
                    data: {
                        status: 'claimed',
                        claimedMappingId: mapping.id,
                        claimedAt: now,
                        version: { increment: 1 },
                        updatedAt: now
                    }
                });
            }
            catch (error) {
                throw new ConflictException({
                    code: 'SEAT_CLAIMED',
                    message: '席位已被其他人認領，請重新整理頁面'
                });
            }
            await tx.seatInvitation.update({
                where: { code: dto.code },
                data: {
                    claimedAt: now,
                    claimedBy: mapping.id
                }
            });
            await tx.seatIdentityForm.update({
                where: { seatId: seat.id },
                data: {
                    status: 'confirmed',
                    confirmedAt: now,
                    studentName: dto.studentName,
                    studentEnglish: dto.studentEnglish,
                    birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
                    contactEmail: dto.contactEmail,
                    guardianEmail: dto.guardianEmail,
                    contactPhone: dto.contactPhone,
                    isMinor: dto.isMinor ?? false,
                    hasExternalInsurance: dto.hasExternalInsurance ?? false,
                    insuranceProvider: dto.insuranceProvider,
                    note: dto.note,
                    updatedAt: now
                }
            });
            if (dto.guardianEmail && dto.isMinor) {
                const existingRelation = await tx.guardianRelationship.findFirst({
                    where: {
                        guardianEmail: dto.guardianEmail,
                        studentId: globalStudent.id
                    }
                });
                if (!existingRelation) {
                    await tx.guardianRelationship.create({
                        data: {
                            guardianEmail: dto.guardianEmail,
                            studentId: globalStudent.id,
                            relationship: 'parent'
                        }
                    });
                }
            }
            return {
                seatId: seat.id,
                mappingId: mapping.id
            };
        });
        return {
            ...result,
            message: '席位認領成功'
        };
    }
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        const bytes = crypto.randomBytes(8);
        for (let i = 0; i < 8; i++) {
            code += chars[bytes[i] % chars.length];
        }
        return code;
    }
    async submitIdentityForm(code, data) {
        const invitation = await this.prisma.seatInvitation.findUnique({
            where: { code },
            include: {
                seat: {
                    include: {
                        identityForm: true
                    }
                }
            }
        });
        if (!invitation) {
            throw new NotFoundException('邀請碼不存在');
        }
        const now = new Date();
        if (invitation.expiresAt < now) {
            throw new GoneException('邀請碼已過期');
        }
        const seatId = invitation.seatId;
        const existingForm = invitation.seat.identityForm;
        if (existingForm && existingForm.status === 'confirmed') {
            throw new ConflictException('席位已完成認領，無法修改身份資料');
        }
        if (!data.studentName || !data.contactEmail) {
            throw new UnprocessableEntityException('姓名和聯絡 Email 為必填');
        }
        const form = await this.prisma.seatIdentityForm.upsert({
            where: { seatId },
            create: {
                seatId,
                status: 'submitted',
                studentName: data.studentName,
                studentEnglish: data.studentEnglish,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                contactEmail: data.contactEmail,
                guardianEmail: data.guardianEmail,
                contactPhone: data.contactPhone,
                isMinor: data.isMinor ?? false,
                hasExternalInsurance: data.hasExternalInsurance ?? false,
                insuranceProvider: data.insuranceProvider,
                note: data.note,
                submittedAt: now
            },
            update: {
                status: 'submitted',
                studentName: data.studentName,
                studentEnglish: data.studentEnglish,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                contactEmail: data.contactEmail,
                guardianEmail: data.guardianEmail,
                contactPhone: data.contactPhone,
                isMinor: data.isMinor,
                hasExternalInsurance: data.hasExternalInsurance,
                insuranceProvider: data.insuranceProvider,
                note: data.note,
                submittedAt: now,
                updatedAt: now
            }
        });
        return form;
    }
};
InvitationsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], InvitationsService);
export { InvitationsService };
//# sourceMappingURL=invitations.service.js.map