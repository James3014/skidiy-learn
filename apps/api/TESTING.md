# 測試指南

本專案包含完整的單元測試和整合測試套件，確保程式碼品質和功能正確性。

## 測試架構

### 單元測試 (Unit Tests)
位置：`test/**/*.spec.ts`

使用 Jest + NestJS Testing 模組測試個別服務和元件，模擬所有外部相依性。

**已完成的單元測試：**
- ✅ `test/sharing/sharing.service.spec.ts` - Sharing 服務（12 個測試）
  - updateShareVisibility 功能
  - querySharedRecords 功能
  - Rate limiting 驗證
  - 權限檢查
  - Audit logging

- ✅ `test/auth/auth.service.spec.ts` - Auth 服務（7 個測試）
  - login 功能
  - validateToken 功能
  - 帳號狀態驗證

- ✅ `test/auth/jwt.strategy.spec.ts` - JWT 策略（4 個測試）
  - Passport JWT 驗證
  - 帳號狀態檢查

- ✅ `test/auth/roles.guard.spec.ts` - 角色守衛（5 個測試）
  - 角色授權檢查
  - 多角色支援

### 整合測試 (Integration Tests)
位置：`test/integration/**/*.integration.spec.ts`

使用 Testcontainers 在真實 PostgreSQL 環境中測試完整的 API 流程。

**已完成的整合測試：**
- ✅ `test/integration/invitations.integration.spec.ts` - 邀請與席位認領（9 個測試）
  - 成功認領席位流程
  - **樂觀鎖衝突 + Transaction rollback** ⭐
  - 邀請碼過期處理
  - 重複使用檢查
  - 身份表單驗證
  - 監護人關係建立
  - 邀請碼驗證 API

## 執行測試

### 單元測試
```bash
# 執行所有單元測試
pnpm test

# 執行特定測試檔案
pnpm test sharing.service.spec.ts

# 執行特定模組的測試
pnpm test auth

# 查看測試覆蓋率
pnpm test --coverage
```

### 整合測試
```bash
# 執行所有整合測試（需要 Docker）
pnpm test:integration

# 注意：整合測試會：
# 1. 啟動 PostgreSQL 容器
# 2. 執行資料庫遷移
# 3. 執行測試
# 4. 清理容器
# 整個過程約需 30-60 秒
```

### 執行所有測試
```bash
# 執行單元測試 + 整合測試
pnpm test:all
```

## 關鍵測試場景

### Transaction Rollback 測試 ⭐

位置：`test/integration/invitations.integration.spec.ts` (line 112-159)

**測試目的：** 驗證樂觀鎖衝突時，Prisma transaction 會自動回滾所有變更

**測試流程：**
1. 建立邀請碼和席位（version = 1）
2. 手動增加 seat.version（模擬並發認領）
3. 嘗試認領席位
4. 驗證樂觀鎖失敗，回應 409 錯誤
5. **驗證 transaction rollback 效果：**
   - ❌ 沒有建立 StudentMapping
   - ❌ 沒有建立 GlobalStudent
   - ❌ 沒有建立 GuardianRelationship
   - ❌ Seat 狀態仍為 'pending'
   - ❌ Invitation 未被標記為已使用
   - ✅ 所有變更都已回滾

這個測試證明了我們在 `invitations.service.ts` 中實作的 transaction 包裹正確運作，不需要手動清理資料。

## 測試最佳實踐

### 單元測試
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let dependency: DependencyType;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceName,
        { provide: DependencyType, useValue: mockDependency }
      ]
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    dependency = module.get<DependencyType>(DependencyType);
  });

  it('應該描述預期行為（使用繁體中文）', async () => {
    // Arrange
    jest.spyOn(dependency, 'method').mockResolvedValue(mockData);

    // Act
    const result = await service.method(input);

    // Assert
    expect(result).toEqual(expectedOutput);
    expect(dependency.method).toHaveBeenCalledWith(expectedArgs);
  });
});
```

### 整合測試
```typescript
describe('Feature Integration Tests', () => {
  let env: IntegrationTestEnvironment;
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
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

  it('應該測試完整的 API 流程', async () => {
    // 建立測試資料
    const testData = await prisma.model.create({ data: {...} });

    // 呼叫 API
    const response = await request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .send(requestData)
      .expect(201);

    // 驗證回應
    expect(response.body).toMatchObject(expectedResponse);

    // 驗證資料庫狀態
    const dbRecord = await prisma.model.findUnique({ where: { id } });
    expect(dbRecord).toBeDefined();
  });
});
```

## 測試覆蓋率目標

- **單元測試**: > 80% 覆蓋率
- **關鍵業務邏輯**: 100% 覆蓋率
- **整合測試**: 主要 API 流程覆蓋

## 持續整合

在 CI/CD pipeline 中：
```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: pnpm test --coverage

- name: Run integration tests
  run: pnpm test:integration
  # 需要 Docker 環境
```

## 故障排除

### 整合測試無法啟動容器
```bash
# 確認 Docker daemon 正在執行
docker ps

# 確認有權限存取 Docker socket
ls -la /var/run/docker.sock
```

### 測試超時
- 整合測試預設超時 2 分鐘
- 容器啟動可能需要 30-60 秒
- 如果經常超時，檢查 Docker 資源配置

### Prisma 遷移失敗
```bash
# 重新生成 Prisma Client
pnpm prisma:generate

# 檢查遷移檔案
ls prisma/migrations
```

## 下一步

- [ ] 增加更多整合測試（Sharing、LessonRecord）
- [ ] 設定 GitHub Actions CI
- [ ] 增加 E2E 測試（Playwright）
- [ ] 設定測試覆蓋率門檻
