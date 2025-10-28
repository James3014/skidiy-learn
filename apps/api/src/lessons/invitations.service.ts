import {
  Injectable,
  NotFoundException,
  ConflictException,
  GoneException,
  UnprocessableEntityException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClaimInvitationDto } from './dto/claim-invitation.dto.js';
import { InvitationResponseDto, toInvitationResponse } from './dto/invitation-response.dto.js';
import {
  Prisma,
  SeatInvitation,
  GlobalStudent,
  Lesson,
  StudentMapping
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 產生 8 字元邀請碼，帶重試機制避免碰撞
   */
  async generateInvitation(
    seatId: string,
    expiresInDays: number = 7
  ): Promise<InvitationResponseDto> {
    // 驗證 seat 存在
    const seat = await this.prisma.orderSeat.findUnique({
      where: { id: seatId }
    });

    if (!seat) {
      throw new NotFoundException(`Seat with id ${seatId} not found`);
    }

    // 產生邀請碼，最多重試 5 次
    const maxRetries = 5;
    let invitation: SeatInvitation | null = null;

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

        // 更新席位狀態為 invited
        await this.prisma.orderSeat.update({
          where: { id: seatId },
          data: {
            status: 'invited',
            updatedAt: new Date()
          }
        });

        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < maxRetries - 1
        ) {
          // 主鍵碰撞，重試
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

  /**
   * 驗證邀請碼
   */
  async verifyCode(code: string): Promise<InvitationResponseDto> {
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

  /**
   * 認領席位（含樂觀鎖）
   */
  async claimSeat(dto: ClaimInvitationDto): Promise<{
    seatId: string;
    mappingId: string;
    message: string;
  }> {
    // 1. 驗證邀請碼 (outside transaction for early validation)
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

    // 2. 檢查身份表單是否完成
    const identityForm = invitation.seat.identityForm;
    if (!identityForm || identityForm.status === 'draft') {
      throw new UnprocessableEntityException({
        code: 'IDENTITY_FORM_INCOMPLETE',
        message: '請先完成身份資料填寫'
      });
    }

    // 3. 檢查席位是否已被認領
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

    // 4. Get lesson (outside transaction for validation)
    const lesson: Lesson | null = await this.prisma.lesson.findUnique({
      where: { id: seat.lessonId }
    });

    if (!lesson) {
      throw new NotFoundException('課程不存在');
    }

    // 5. Execute all database writes in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 5a. 建立或尋找 GlobalStudent
      const contactFilters: Prisma.GlobalStudentWhereInput[] = [];
      if (dto.contactEmail) {
        contactFilters.push({ email: dto.contactEmail });
      }
      if (dto.contactPhone) {
        contactFilters.push({ phone: dto.contactPhone });
      }

      let globalStudent: GlobalStudent | null = await tx.globalStudent.findFirst({
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

      // 5b. 建立 StudentMapping
      const mapping: StudentMapping = await tx.studentMapping.create({
        data: {
          globalStudentId: globalStudent.id,
          resortId: lesson.resortId
        }
      });

      // 5c. 使用樂觀鎖更新席位
      try {
        await tx.orderSeat.update({
          where: {
            id: seat.id,
            version: seat.version // 樂觀鎖
          },
          data: {
            status: 'claimed',
            claimedMappingId: mapping.id,
            claimedAt: now,
            version: { increment: 1 },
            updatedAt: now
          }
        });
      } catch (error) {
        // 樂觀鎖衝突 - transaction 會自動 rollback 所有操作
        throw new ConflictException({
          code: 'SEAT_CLAIMED',
          message: '席位已被其他人認領，請重新整理頁面'
        });
      }

      // 5d. 更新邀請碼為已認領
      await tx.seatInvitation.update({
        where: { code: dto.code },
        data: {
          claimedAt: now,
          claimedBy: mapping.id
        }
      });

      // 5e. 更新身份表單為確認狀態
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

      // 5f. 如果有監護人，建立關係
      if (dto.guardianEmail && dto.isMinor) {
        // Check if relation already exists within transaction
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

  /**
   * 產生 8 字元隨機碼
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字元 0O1I
    let code = '';
    const bytes = crypto.randomBytes(8);

    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }

    return code;
  }

  /**
   * 更新或建立身份表單（認領前填寫）
   */
  async submitIdentityForm(
    code: string,
    data: {
      studentName: string;
      studentEnglish?: string;
      birthDate?: string;
      contactEmail?: string;
      guardianEmail?: string;
      contactPhone?: string;
      isMinor?: boolean;
      hasExternalInsurance?: boolean;
      insuranceProvider?: string;
      note?: string;
    }
  ) {
    // 驗證邀請碼
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

    // 檢查必填欄位
    if (!data.studentName || !data.contactEmail) {
      throw new UnprocessableEntityException('姓名和聯絡 Email 為必填');
    }

    // 建立或更新表單
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
}
