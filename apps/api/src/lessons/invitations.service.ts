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
import type { ErrorResponse } from '../types/errors.js';
import type { TransactionClient } from '../types/domain.js';
import { INVITATION } from '../config/constants.js';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 為指定席位生成唯一的邀請碼
   *
   * 生成一個 8 字元的邀請碼，使用排除易混淆字元的字符集 (ABCDEFGHJKLMNPQRSTUVWXYZ23456789)。
   * 如果發生碼衝突，會自動重試最多 5 次。
   *
   * @param seatId - 課程席位的唯一識別碼
   * @param expiresInDays - 邀請碼有效天數，預設為 7 天
   * @returns 包含邀請碼和相關資訊的響應物件
   *
   * @throws {NotFoundException} 當指定的席位不存在時
   * @throws {ConflictException} 當重試多次後仍無法生成唯一碼時 (錯誤碼: INVITE_CODE_COLLISION)
   *
   * @example
   * ```typescript
   * const invitation = await service.generateInvitation('seat-123', 7);
   * console.log(invitation.code); // 'A2B3C4D5'
   * ```
   */
  async generateInvitation(
    seatId: string,
    expiresInDays: number = INVITATION.DEFAULT_EXPIRY_DAYS
  ): Promise<InvitationResponseDto> {
    // 驗證 seat 存在
    const seat = await this.prisma.orderSeat.findUnique({
      where: { id: seatId }
    });

    if (!seat) {
      throw new NotFoundException(`Seat with id ${seatId} not found`);
    }

    // 產生邀請碼，最多重試次數
    const maxRetries = INVITATION.MAX_RETRIES;
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
      const error: ErrorResponse = {
        code: 'INVITE_CODE_COLLISION',
        message: '邀請碼產生多次碰撞，請稍後再試'
      };
      throw new ConflictException(error);
    }

    return toInvitationResponse(invitation);
  }

  /**
   * 驗證邀請碼狀態 - 純驗證邏輯，不做查詢
   */
  private validateInvitationStatus(
    invitation: SeatInvitation | null,
    now: Date = new Date(),
    options: { checkClaimed?: boolean } = { checkClaimed: true }
  ): asserts invitation is SeatInvitation {
    if (!invitation) {
      const error: ErrorResponse = {
        code: 'INVITE_NOT_FOUND',
        message: '邀請碼不存在'
      };
      throw new NotFoundException(error);
    }

    if (invitation.expiresAt < now) {
      const error: ErrorResponse = {
        code: 'INVITE_EXPIRED',
        message: '邀請碼已過期'
      };
      throw new GoneException(error);
    }

    if (options.checkClaimed && invitation.claimedAt) {
      const error: ErrorResponse = {
        code: 'INVITE_ALREADY_CLAIMED',
        message: '邀請碼已被使用'
      };
      throw new ConflictException(error);
    }
  }

  /**
   * 驗證邀請碼 - 查詢 + 驗證
   */
  private async validateInvitationCode(code: string, now: Date = new Date()) {
    const invitation = await this.prisma.seatInvitation.findUnique({
      where: { code }
    });

    this.validateInvitationStatus(invitation, now);
    return invitation;
  }

  /**
   * 驗證邀請碼的有效性
   *
   * 檢查邀請碼是否存在、是否過期、是否已被使用。
   * 這個方法不會執行實際的席位認領，只驗證邀請碼的狀態。
   *
   * @param code - 8 字元的邀請碼
   * @returns 包含邀請碼詳細資訊的響應物件
   *
   * @throws {NotFoundException} 當邀請碼不存在時 (錯誤碼: INVITE_NOT_FOUND)
   * @throws {GoneException} 當邀請碼已過期時 (錯誤碼: INVITE_EXPIRED)
   * @throws {ConflictException} 當邀請碼已被使用時 (錯誤碼: INVITE_ALREADY_CLAIMED)
   *
   * @example
   * ```typescript
   * try {
   *   const invitation = await service.verifyCode('A2B3C4D5');
   *   console.log(`席位 ${invitation.seatId} 的邀請碼有效`);
   * } catch (error) {
   *   if (error.code === 'INVITE_EXPIRED') {
   *     console.log('邀請碼已過期');
   *   }
   * }
   * ```
   */
  async verifyCode(code: string): Promise<InvitationResponseDto> {
    const invitation = await this.validateInvitationCode(code);
    return toInvitationResponse(invitation);
  }

  /**
   * 使用邀請碼認領課程席位
   *
   * 完整的席位認領流程，包括：
   * 1. 驗證邀請碼（存在性、過期時間、使用狀態）
   * 2. 檢查身份表單是否已完成
   * 3. 檢查席位是否已被認領
   * 4. 在 transaction 中執行：
   *    - 創建或查找全域學生記錄
   *    - 創建學生映射記錄
   *    - 使用樂觀鎖更新席位狀態
   *    - 標記邀請碼為已使用
   *    - 確認身份表單
   *    - 建立監護人關係（如果是未成年學生）
   *
   * 使用樂觀鎖（optimistic locking）確保並發安全，
   * 當多個請求同時認領同一席位時，只有一個會成功。
   *
   * @param dto - 包含邀請碼和學生資訊的認領數據
   * @returns 認領結果，包含席位 ID、學生映射 ID 和成功訊息
   *
   * @throws {NotFoundException} 當邀請碼不存在時 (錯誤碼: INVITE_NOT_FOUND)
   * @throws {NotFoundException} 當課程不存在時
   * @throws {GoneException} 當邀請碼已過期時 (錯誤碼: INVITE_EXPIRED)
   * @throws {ConflictException} 當邀請碼已被使用時 (錯誤碼: INVITE_ALREADY_CLAIMED)
   * @throws {ConflictException} 當席位已被其他人認領時 (錯誤碼: SEAT_CLAIMED)
   * @throws {UnprocessableEntityException} 當身份表單未完成時 (錯誤碼: IDENTITY_FORM_INCOMPLETE)
   *
   * @example
   * ```typescript
   * const result = await service.claimSeat({
   *   code: 'A2B3C4D5',
   *   studentName: '張三',
   *   contactEmail: 'zhang@example.com',
   *   contactPhone: '0912345678',
   *   birthDate: '2000-01-01',
   *   isMinor: false
   * });
   *
   * console.log(result.message); // '席位認領成功'
   * console.log(result.seatId);  // 'seat-123'
   * ```
   *
   * @example 未成年學生認領（需監護人資訊）
   * ```typescript
   * const result = await service.claimSeat({
   *   code: 'A2B3C4D5',
   *   studentName: '李小明',
   *   contactEmail: 'li@example.com',
   *   guardianEmail: 'parent@example.com',
   *   birthDate: '2015-01-01',
   *   isMinor: true
   * });
   * ```
   */
  async claimSeat(dto: ClaimInvitationDto): Promise<{
    seatId: string;
    mappingId: string;
    message: string;
  }> {
    const validation = await this.validateClaimRequest(dto);
    const result = await this.executeClaimTransaction(dto, validation);

    return {
      ...result,
      message: '席位認領成功'
    };
  }

  /**
   * 驗證認領請求的所有前置條件
   */
  private async validateClaimRequest(dto: ClaimInvitationDto) {
    const now = new Date();

    // 1. 驗證邀請碼
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

    this.validateInvitationStatus(invitation, now);

    // 2. 檢查身份表單是否完成
    const identityForm = invitation.seat.identityForm;
    if (!identityForm || identityForm.status === 'draft') {
      const error: ErrorResponse = {
        code: 'IDENTITY_FORM_INCOMPLETE',
        message: '請先完成身份資料填寫'
      };
      throw new UnprocessableEntityException(error);
    }

    // 3. 檢查席位是否已被認領
    const seat = invitation.seat;
    if (seat.status === 'claimed') {
      const error: ErrorResponse = {
        code: 'SEAT_CLAIMED',
        message: '席位已被認領',
        details: {
          claimedAt: seat.claimedAt,
          claimedBy: seat.claimedMappingId
        }
      };
      throw new ConflictException(error);
    }

    // 4. 獲取課程資訊
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: seat.lessonId }
    });

    if (!lesson) {
      throw new NotFoundException('課程不存在');
    }

    return { seat, lesson, now };
  }

  /**
   * 在 transaction 中執行席位認領的所有資料庫操作
   */
  private async executeClaimTransaction(
    dto: ClaimInvitationDto,
    validation: { seat: any; lesson: Lesson; now: Date }
  ) {
    const { seat, lesson, now } = validation;

    return this.prisma.$transaction(async (tx) => {
      // 1. 建立或尋找 GlobalStudent
      const globalStudent = await this.findOrCreateGlobalStudent(tx, dto);

      // 2. 建立 StudentMapping
      const mapping = await tx.studentMapping.create({
        data: {
          globalStudentId: globalStudent.id,
          resortId: lesson.resortId
        }
      });

      // 3. 使用樂觀鎖更新席位
      await this.claimSeatWithOptimisticLock(tx, seat, mapping.id, now);

      // 4. 更新邀請碼為已認領
      await tx.seatInvitation.update({
        where: { code: dto.code },
        data: {
          claimedAt: now,
          claimedBy: mapping.id
        }
      });

      // 5. 更新身份表單為確認狀態
      await this.confirmIdentityForm(tx, seat.id, dto, now);

      // 6. 如果有監護人，建立關係
      if (dto.guardianEmail && dto.isMinor) {
        await this.ensureGuardianRelation(tx, dto.guardianEmail, globalStudent.id);
      }

      return {
        seatId: seat.id,
        mappingId: mapping.id
      };
    });
  }

  /**
   * 使用樂觀鎖更新席位狀態
   */
  private async claimSeatWithOptimisticLock(
    tx: TransactionClient,
    seat: any,
    mappingId: string,
    now: Date
  ) {
    try {
      await tx.orderSeat.update({
        where: {
          id: seat.id,
          version: seat.version
        },
        data: {
          status: 'claimed',
          claimedMappingId: mappingId,
          claimedAt: now,
          version: { increment: 1 },
          updatedAt: now
        }
      });
    } catch (error) {
      const conflictError: ErrorResponse = {
        code: 'SEAT_CLAIMED',
        message: '席位已被其他人認領，請重新整理頁面'
      };
      throw new ConflictException(conflictError);
    }
  }

  /**
   * 確認身份表單
   */
  private async confirmIdentityForm(
    tx: TransactionClient,
    seatId: string,
    dto: ClaimInvitationDto,
    now: Date
  ) {
    await tx.seatIdentityForm.update({
      where: { seatId },
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
  }

  /**
   * 查找或建立 GlobalStudent
   */
  private async findOrCreateGlobalStudent(
    tx: TransactionClient,
    dto: { contactEmail?: string; contactPhone?: string; birthDate?: string }
  ): Promise<GlobalStudent> {
    const contactFilters: Prisma.GlobalStudentWhereInput[] = [];
    if (dto.contactEmail) contactFilters.push({ email: dto.contactEmail });
    if (dto.contactPhone) contactFilters.push({ phone: dto.contactPhone });

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

    return globalStudent;
  }

  /**
   * 確保監護人關係存在
   */
  private async ensureGuardianRelation(
    tx: TransactionClient,
    guardianEmail: string,
    studentId: string
  ): Promise<void> {
    const existingRelation = await tx.guardianRelationship.findFirst({
      where: { guardianEmail, studentId }
    });

    if (!existingRelation) {
      await tx.guardianRelationship.create({
        data: {
          guardianEmail,
          studentId,
          relationship: 'parent'
        }
      });
    }
  }

  /**
   * 產生隨機邀請碼
   */
  private generateCode(): string {
    let code = '';
    const bytes = crypto.randomBytes(INVITATION.CODE_LENGTH);

    for (let i = 0; i < INVITATION.CODE_LENGTH; i++) {
      code += INVITATION.CODE_CHARS[bytes[i] % INVITATION.CODE_CHARS.length];
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
    const now = new Date();

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

    // Don't check if claimed - allow form submission before claiming
    this.validateInvitationStatus(invitation, now, { checkClaimed: false });

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
