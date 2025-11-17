import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

const shouldRunIntegration = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeOrSkip = shouldRunIntegration ? describe : describe.skip;

describeOrSkip('Sharing Integration Tests', () => {
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
  }, 120000);

  afterAll(async () => {
    await env.teardown();
  }, 30000);

  beforeEach(async () => {
    await env.cleanDatabase();
  });

  describe('共享記錄查詢權限', () => {
    let resort1Id: number;
    let resort2Id: number;
    let instructor1AccountId: string;
    let instructor2AccountId: string;
    let adminInstructorAccountId: string;
    let instructor1Token: string;
    let instructor2Token: string;
    let adminToken: string;

    beforeEach(async () => {
      // 建立兩個雪場
      const resort1 = await prisma.resort.create({
        data: { name: '苗場滑雪場', location: '日本新潟' }
      });
      resort1Id = resort1.id;

      const resort2 = await prisma.resort.create({
        data: { name: '白馬滑雪場', location: '日本長野' }
      });
      resort2Id = resort2.id;

      // 建立教練 1 (苗場，一般權限)
      const account1 = await prisma.account.create({
        data: { role: 'instructor', status: 'active' }
      });
      instructor1AccountId = account1.id;

      const instructor1 = await prisma.instructor.create({
        data: {
          accountId: account1.id,
          resortId: resort1Id,
          canViewSharedRecords: false
        }
      });

      // 建立教練 2 (白馬，一般權限)
      const account2 = await prisma.account.create({
        data: { role: 'instructor', status: 'active' }
      });
      instructor2AccountId = account2.id;

      const instructor2 = await prisma.instructor.create({
        data: {
          accountId: account2.id,
          resortId: resort2Id,
          canViewSharedRecords: false
        }
      });

      // 建立管理員教練 (跨雪場權限)
      const adminAccount = await prisma.account.create({
        data: { role: 'instructor', status: 'active' }
      });
      adminInstructorAccountId = adminAccount.id;

      await prisma.instructor.create({
        data: {
          accountId: adminAccount.id,
          canViewSharedRecords: true // 可以查看所有共享記錄
        }
      });

      // 為每個教練生成認證 token (模擬登入)
      // 注意：這裡需要根據實際的認證實現調整
      instructor1Token = 'mock-token-instructor1';
      instructor2Token = 'mock-token-instructor2';
      adminToken = 'mock-token-admin';

      // 建立教學記錄和共享設定
      // 教練 1 在苗場的課程
      const lesson1 = await prisma.lesson.create({
        data: {
          resortId: resort1Id,
          instructorId: instructor1.id,
          lessonDate: new Date('2025-01-20')
        }
      });

      const globalStudent1 = await prisma.globalStudent.create({
        data: { email: 'student1@example.com' }
      });

      const mapping1 = await prisma.studentMapping.create({
        data: {
          globalStudentId: globalStudent1.id,
          resortId: resort1Id
        }
      });

      const record1 = await prisma.lessonRecord.create({
        data: {
          lessonId: lesson1.id,
          createdBy: account1.id
        }
      });

      await prisma.lessonRecordDetail.create({
        data: {
          lessonRecordId: record1.id,
          studentMappingId: mapping1.id,
          resortId: resort1Id,
          shareVisibility: 'resort', // 只在雪場內共享
          sharedAt: new Date(),
          sharedBy: account1.id
        }
      });

      await prisma.lessonRecordDetail.create({
        data: {
          lessonRecordId: record1.id,
          studentMappingId: mapping1.id,
          resortId: resort1Id,
          shareVisibility: 'all', // 對所有人共享
          sharedAt: new Date(),
          sharedBy: account1.id
        }
      });

      // 教練 2 在白馬的課程
      const lesson2 = await prisma.lesson.create({
        data: {
          resortId: resort2Id,
          instructorId: instructor2.id,
          lessonDate: new Date('2025-01-21')
        }
      });

      const globalStudent2 = await prisma.globalStudent.create({
        data: { email: 'student2@example.com' }
      });

      const mapping2 = await prisma.studentMapping.create({
        data: {
          globalStudentId: globalStudent2.id,
          resortId: resort2Id
        }
      });

      const record2 = await prisma.lessonRecord.create({
        data: {
          lessonId: lesson2.id,
          createdBy: account2.id
        }
      });

      await prisma.lessonRecordDetail.create({
        data: {
          lessonRecordId: record2.id,
          studentMappingId: mapping2.id,
          resortId: resort2Id,
          shareVisibility: 'all',
          sharedAt: new Date(),
          sharedBy: account2.id
        }
      });

      await prisma.lessonRecordDetail.create({
        data: {
          lessonRecordId: record2.id,
          studentMappingId: mapping2.id,
          resortId: resort2Id,
          shareVisibility: 'private', // 不共享
          sharedAt: null,
          sharedBy: null
        }
      });
    });

    it('一般教練只能看到 "all" 可見度的記錄', async () => {
      // 模擬教練 1 查詢共享記錄
      // 注意：這裡需要實際的認證機制，暫時用 mock
      const response = await request(app.getHttpServer())
        .get('/api/v1/sharing/records')
        .set('Authorization', `Bearer ${instructor1Token}`)
        .expect(200);

      // 教練 1 應該只能看到所有 'all' 可見度的記錄
      // 包括自己的 1 個 'all' 記錄和教練 2 的 1 個 'all' 記錄
      expect(response.body).toHaveLength(2);

      // 確認都是 'all' 可見度
      response.body.forEach((record: any) => {
        expect(record.shareVisibility).toBe('all');
      });
    });

    it('一般教練不能看到其他雪場的 "resort" 可見度記錄', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sharing/records')
        .set('Authorization', `Bearer ${instructor1Token}`)
        .expect(200);

      // 確認結果中沒有 resort2 的 'resort' 記錄
      const resort2ResortRecords = response.body.filter(
        (record: any) => record.resortId === resort2Id && record.shareVisibility === 'resort'
      );
      expect(resort2ResortRecords).toHaveLength(0);
    });

    it('管理員教練可以看到 "resort" 和 "all" 可見度的記錄', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sharing/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 管理員應該能看到：
      // - 教練 1 的 1 個 'resort' 記錄
      // - 教練 1 的 1 個 'all' 記錄
      // - 教練 2 的 1 個 'all' 記錄
      // 共 3 個
      expect(response.body).toHaveLength(3);

      const visibilities = response.body.map((record: any) => record.shareVisibility);
      expect(visibilities).toContain('resort');
      expect(visibilities).toContain('all');
    });

    it('任何教練都不能看到 "private" 可見度的記錄', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/api/v1/sharing/records')
        .set('Authorization', `Bearer ${instructor1Token}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/api/v1/sharing/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 確認沒有 'private' 記錄
      [...response1.body, ...response2.body].forEach((record: any) => {
        expect(record.shareVisibility).not.toBe('private');
      });
    });

    it('支援按雪場 ID 過濾', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/sharing/records?resortId=${resort1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 應該只返回 resort1 的記錄
      response.body.forEach((record: any) => {
        expect(record.resortId).toBe(resort1Id);
      });

      expect(response.body.length).toBeGreaterThan(0);
    });

    it('支援 limit 參數限制返回數量', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sharing/records?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('應該執行 rate limiting', async () => {
      // 快速發送多個請求以觸發 rate limit
      const requests = Array.from({ length: 35 }, () =>
        request(app.getHttpServer())
          .get('/api/v1/sharing/records')
          .set('Authorization', `Bearer ${instructor1Token}`)
      );

      const responses = await Promise.all(requests);

      // 至少有一個請求應該被 rate limit（假設限制是 30 次/分鐘）
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('更新共享可見度', () => {
    let detailId: string;
    let ownerAccountId: string;
    let otherAccountId: string;
    let ownerToken: string;
    let otherToken: string;

    beforeEach(async () => {
      const resort = await prisma.resort.create({
        data: { name: '測試雪場' }
      });

      // 擁有者帳號
      const ownerAccount = await prisma.account.create({
        data: { role: 'instructor', status: 'active' }
      });
      ownerAccountId = ownerAccount.id;
      ownerToken = 'mock-token-owner';

      const instructor = await prisma.instructor.create({
        data: {
          accountId: ownerAccount.id,
          resortId: resort.id
        }
      });

      // 其他教練帳號
      const otherAccount = await prisma.account.create({
        data: { role: 'instructor', status: 'active' }
      });
      otherAccountId = otherAccount.id;
      otherToken = 'mock-token-other';

      await prisma.instructor.create({
        data: {
          accountId: otherAccount.id,
          resortId: resort.id
        }
      });

      const lesson = await prisma.lesson.create({
        data: {
          resortId: resort.id,
          instructorId: instructor.id,
          lessonDate: new Date()
        }
      });

      const globalStudent = await prisma.globalStudent.create({
        data: { email: 'test@example.com' }
      });

      const mapping = await prisma.studentMapping.create({
        data: {
          globalStudentId: globalStudent.id,
          resortId: resort.id
        }
      });

      const record = await prisma.lessonRecord.create({
        data: {
          lessonId: lesson.id,
          createdBy: ownerAccount.id
        }
      });

      const detail = await prisma.lessonRecordDetail.create({
        data: {
          lessonRecordId: record.id,
          studentMappingId: mapping.id,
          resortId: resort.id,
          shareVisibility: 'private'
        }
      });

      detailId = detail.id;
    });

    it('擁有者應該能夠更新共享可見度', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/sharing/details/${detailId}/visibility`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ visibility: 'resort' })
        .expect(200);

      expect(response.body.shareVisibility).toBe('resort');

      // 驗證資料庫已更新
      const detail = await prisma.lessonRecordDetail.findUnique({
        where: { id: detailId }
      });

      expect(detail?.shareVisibility).toBe('resort');
      expect(detail?.sharedAt).toBeDefined();
      expect(detail?.sharedBy).toBe(ownerAccountId);
    });

    it('非擁有者不能更新共享可見度', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/sharing/details/${detailId}/visibility`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ visibility: 'all' })
        .expect(403);

      // 驗證資料庫未更新
      const detail = await prisma.lessonRecordDetail.findUnique({
        where: { id: detailId }
      });

      expect(detail?.shareVisibility).toBe('private'); // 仍然是 private
    });

    it('設為 private 時應該清空 sharedAt 和 sharedBy', async () => {
      // 先設為 resort
      await request(app.getHttpServer())
        .patch(`/api/v1/sharing/details/${detailId}/visibility`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ visibility: 'resort' })
        .expect(200);

      // 再設回 private
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/sharing/details/${detailId}/visibility`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ visibility: 'private' })
        .expect(200);

      expect(response.body.shareVisibility).toBe('private');
      expect(response.body.sharedAt).toBeNull();
      expect(response.body.sharedBy).toBeNull();

      // 驗證資料庫
      const detail = await prisma.lessonRecordDetail.findUnique({
        where: { id: detailId }
      });

      expect(detail?.sharedAt).toBeNull();
      expect(detail?.sharedBy).toBeNull();
    });
  });
});
