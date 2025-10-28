import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

const shouldRunIntegration = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeOrSkip = shouldRunIntegration ? describe : describe.skip;

describeOrSkip('Invitations Integration Tests', () => {
  type IntegrationTestEnvironment = import('./setup.js').IntegrationTestEnvironment;
  let env: IntegrationTestEnvironment;
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const { IntegrationTestEnvironment } = await import('./setup.js');
    env = IntegrationTestEnvironment.getInstance();
    await env.setup();
    app = env.app!;
    prisma = env.prisma!;
  }, 120000); // 2 分鐘超時（容器啟動需要時間）

  afterAll(async () => {
    await env.teardown();
  }, 30000);

  beforeEach(async () => {
    await env.cleanDatabase();
  });

  describe('席位認領流程', () => {
    let invitationCode: string;
    let seatId: string;
    let lessonId: number;

    beforeEach(async () => {
      // 建立測試資料：Resort、Account、Instructor、Lesson、Seat、Invitation
      const resort = await prisma.resort.create({
        data: { name: '苗場滑雪場', location: '日本新潟' }
      });

      const account = await prisma.account.create({
        data: {
          role: 'instructor',
          status: 'active'
        }
      });

      const instructor = await prisma.instructor.create({
        data: {
          accountId: account.id,
          canViewSharedRecords: false
        }
      });

      const lesson = await prisma.lesson.create({
        data: {
          resortId: resort.id,
          instructorId: instructor.id,
          lessonDate: new Date('2025-01-20')
        }
      });

      lessonId = lesson.id;

      const seat = await prisma.orderSeat.create({
        data: {
          lessonId: lesson.id,
          seatNumber: 1,
          status: 'pending'
        }
      });

      seatId = seat.id;

      const invitation = await prisma.seatInvitation.create({
        data: {
          code: 'TEST1234',
          seatId: seat.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 天後
        }
      });

      invitationCode = invitation.code;

      // 建立身份表單
      await prisma.seatIdentityForm.create({
        data: {
          seatId: seat.id,
          status: 'submitted',
          studentName: '測試學生',
          contactEmail: 'student@example.com',
          submittedAt: new Date()
        }
      });
    });

    it('應該成功認領席位', async () => {
      const claimData = {
        code: invitationCode,
        studentName: '測試學生',
        contactEmail: 'student@example.com',
        contactPhone: '0912345678',
        birthDate: '2000-01-01'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/invitations/claim')
        .send(claimData)
        .expect(201);

      expect(response.body).toMatchObject({
        seatId,
        message: '席位認領成功'
      });
      expect(response.body.mappingId).toBeDefined();

      // 驗證資料庫狀態
      const seat = await prisma.orderSeat.findUnique({
        where: { id: seatId }
      });

      expect(seat?.status).toBe('claimed');
      expect(seat?.claimedMappingId).toBe(response.body.mappingId);
      expect(seat?.claimedAt).toBeDefined();

      const invitation = await prisma.seatInvitation.findUnique({
        where: { code: invitationCode }
      });

      expect(invitation?.claimedAt).toBeDefined();
      expect(invitation?.claimedBy).toBe(response.body.mappingId);

      const identityForm = await prisma.seatIdentityForm.findUnique({
        where: { seatId }
      });

      expect(identityForm?.status).toBe('confirmed');
      expect(identityForm?.confirmedAt).toBeDefined();
    });

    it('應該在樂觀鎖衝突時回滾所有變更', async () => {
      const claimData = {
        code: invitationCode,
        studentName: '測試學生A',
        contactEmail: 'studentA@example.com'
      };

      // 取得原始 version
      const originalSeat = await prisma.orderSeat.findUnique({
        where: { id: seatId }
      });

      const originalVersion = originalSeat?.version;

      // 在認領前手動更新 seat 的 version（模擬並發衝突）
      await prisma.orderSeat.update({
        where: { id: seatId },
        data: { version: { increment: 1 } }
      });

      // 嘗試認領（應該失敗）
      const response = await request(app.getHttpServer())
        .post('/api/v1/invitations/claim')
        .send(claimData)
        .expect(409);

      expect(response.body.code).toBe('SEAT_CLAIMED');

      // 驗證沒有建立 StudentMapping（transaction rollback）
      const mappings = await prisma.studentMapping.findMany();
      expect(mappings).toHaveLength(0);

      // 驗證沒有建立 GlobalStudent
      const students = await prisma.globalStudent.findMany();
      expect(students).toHaveLength(0);

      // 驗證 seat 狀態未改變
      const seat = await prisma.orderSeat.findUnique({
        where: { id: seatId }
      });

      expect(seat?.status).toBe('pending'); // 仍然是 pending
      expect(seat?.claimedMappingId).toBeNull();
      expect(seat?.version).toBe((originalVersion ?? 1) + 1); // 只增加了我們手動的一次

      // 驗證邀請碼未被標記為已使用
      const invitation = await prisma.seatInvitation.findUnique({
        where: { code: invitationCode }
      });

      expect(invitation?.claimedAt).toBeNull();
      expect(invitation?.claimedBy).toBeNull();
    });

    it('應該在邀請碼過期時拒絕認領', async () => {
      // 更新邀請碼為過期狀態
      await prisma.seatInvitation.update({
        where: { code: invitationCode },
        data: { expiresAt: new Date(Date.now() - 1000) } // 1 秒前過期
      });

      const claimData = {
        code: invitationCode,
        studentName: '測試學生',
        contactEmail: 'student@example.com'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/invitations/claim')
        .send(claimData)
        .expect(410);

      expect(response.body.code).toBe('INVITE_EXPIRED');
    });

    it('應該在邀請碼已被使用時拒絕認領', async () => {
      // 先成功認領一次
      const firstClaimData = {
        code: invitationCode,
        studentName: '第一位學生',
        contactEmail: 'first@example.com'
      };

      await request(app.getHttpServer())
        .post('/api/v1/invitations/claim')
        .send(firstClaimData)
        .expect(201);

      // 嘗試用同樣的邀請碼再認領一次
      const secondClaimData = {
        code: invitationCode,
        studentName: '第二位學生',
        contactEmail: 'second@example.com'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/invitations/claim')
        .send(secondClaimData)
        .expect(409);

      expect(response.body.code).toBe('INVITE_ALREADY_CLAIMED');
    });

    it('應該在身份表單未完成時拒絕認領', async () => {
      // 刪除身份表單
      await prisma.seatIdentityForm.delete({
        where: { seatId }
      });

      const claimData = {
        code: invitationCode,
        studentName: '測試學生',
        contactEmail: 'student@example.com'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/invitations/claim')
        .send(claimData)
        .expect(422);

      expect(response.body.code).toBe('IDENTITY_FORM_INCOMPLETE');
    });

    it('應該正確建立監護人關係（未成年學生）', async () => {
      const claimData = {
        code: invitationCode,
        studentName: '未成年學生',
        contactEmail: 'student@example.com',
        guardianEmail: 'parent@example.com',
        isMinor: true,
        birthDate: '2015-01-01'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/invitations/claim')
        .send(claimData)
        .expect(201);

      // 驗證監護人關係已建立
      const relations = await prisma.guardianRelationship.findMany({
        where: {
          guardianEmail: 'parent@example.com'
        }
      });

      expect(relations).toHaveLength(1);
      expect(relations[0].relationship).toBe('parent');

      // 驗證 GlobalStudent 已建立
      const student = await prisma.globalStudent.findFirst({
        where: {
          email: 'student@example.com'
        }
      });

      expect(student).toBeDefined();
      expect(relations[0].studentId).toBe(student?.id);
    });
  });

  describe('邀請碼驗證', () => {
    let validCode: string;

    beforeEach(async () => {
      const resort = await prisma.resort.create({
        data: { name: '測試雪場' }
      });

      const account = await prisma.account.create({
        data: { role: 'instructor', status: 'active' }
      });

      const instructor = await prisma.instructor.create({
        data: { accountId: account.id }
      });

      const lesson = await prisma.lesson.create({
        data: {
          resortId: resort.id,
          instructorId: instructor.id,
          lessonDate: new Date('2025-02-01')
        }
      });

      const seat = await prisma.orderSeat.create({
        data: { lessonId: lesson.id, seatNumber: 1 }
      });

      const invitation = await prisma.seatInvitation.create({
        data: {
          code: 'VALID123',
          seatId: seat.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      validCode = invitation.code;
    });

    it('應該成功驗證有效的邀請碼', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/invitations/${validCode}`)
        .expect(200);

      expect(response.body).toMatchObject({
        code: validCode,
        seatId: expect.any(String)
      });
    });

    it('應該拒絕不存在的邀請碼', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/invitations/INVALID1')
        .expect(404);

      expect(response.body.code).toBe('INVITE_NOT_FOUND');
    });
  });
});
