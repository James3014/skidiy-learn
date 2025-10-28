"use strict";
async;
claimSeat(dto, ClaimInvitationDto);
Promise < {
    seatId: string,
    mappingId: string,
    message: string
} > {
    const: invitation = await this.prisma.seatInvitation.findUnique({
        where: { code: dto.code },
        include: {
            seat: {
                include: {
                    identityForm: true
                }
            }
        }
    }),
    if(, invitation) {
        throw new NotFoundException({
            code: 'INVITE_NOT_FOUND',
            message: '邀請碼不存在'
        });
    },
    const: now = new Date(),
    if(invitation) { }, : .expiresAt < now
};
{
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
//# sourceMappingURL=invitations-transaction.service.js.map