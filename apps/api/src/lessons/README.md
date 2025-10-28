# Lessons Module

課程與席位管理模組，實作課程 CRUD、席位管理、邀請碼認領等核心功能。

## 架構

```
lessons/
├── dto/
│   ├── create-lesson.dto.ts          # 建立課程 DTO
│   ├── lesson-response.dto.ts        # 課程回應 DTO
│   ├── seat-response.dto.ts          # 席位回應 DTO
│   ├── create-invitation.dto.ts      # 建立邀請碼 DTO
│   ├── claim-invitation.dto.ts       # 認領席位 DTO
│   └── invitation-response.dto.ts    # 邀請碼回應 DTO
├── lessons.controller.ts              # 課程 API
├── seats.controller.ts                # 席位 API
├── invitations.controller.ts          # 邀請碼 API
├── lessons.service.ts                 # 課程服務
├── seats.service.ts                   # 席位服務
├── invitations.service.ts             # 邀請碼服務
├── lessons.module.ts                  # 模組定義
├── lessons.service.spec.ts            # 課程服務測試
└── invitations.service.spec.ts        # 邀請碼服務測試
```

## API 端點

### Lessons Controller

```typescript
GET    /api/v1/lessons              # 課程清單（支援 role, date 過濾）
POST   /api/v1/lessons              # 建立課程
GET    /api/v1/lessons/:id          # 課程詳情
GET    /api/v1/lessons/:id/seats    # 席位狀態（支援 include=self_eval）
```

### Seats Controller

```typescript
GET    /api/v1/seats/:id                    # 席位詳情
POST   /api/v1/seats/:id/invitations        # 產生邀請碼
GET    /api/v1/seats/:id/identity-form      # 查詢身份表單
PUT    /api/v1/seats/:id/identity-form      # 更新身份表單
```

### Invitations Controller

```typescript
GET    /api/v1/invitations/:code            # 驗證邀請碼
POST   /api/v1/invitations/claim            # 認領席位
POST   /api/v1/invitations/:code/identity   # 填寫身份表單
```

## 核心功能

### 1. 課程建立

建立課程時自動建立指定數量的席位：

```typescript
POST /api/v1/lessons
{
  "resortId": 1,
  "instructorId": "uuid",
  "lessonDate": "2025-01-15",
  "seatCount": 4
}
```

### 2. 邀請碼產生

- 8 字元隨機碼（排除易混淆字元 0O1I）
- 檢查唯一性（最多重試 5 次）
- 預設過期時間 7 天
- 自動更新席位狀態為 `invited`

```typescript
POST /api/v1/seats/{seatId}/invitations
{
  "expiresInDays": 7  // 可選，預設 7
}
```

### 3. 席位認領（樂觀鎖）

使用 Prisma 的 version 欄位實作樂觀鎖，避免併發衝突：

```typescript
POST /api/v1/invitations/claim
{
  "code": "ABC12345",
  "studentName": "王小明",
  "contactEmail": "student@example.com",
  "birthDate": "2010-05-15",
  "isMinor": true,
  "guardianEmail": "parent@example.com"
}
```

流程：
1. 驗證邀請碼（存在、未過期、未使用）
2. 檢查身份表單狀態（必須為 `submitted` 或 `confirmed`）
3. 檢查席位狀態（未被認領）
4. 建立或尋找 GlobalStudent
5. 建立 StudentMapping
6. **樂觀鎖更新席位**（version 欄位）
7. 更新邀請碼為已認領
8. 確認身份表單
9. 建立監護人關係（如有）

### 4. 身份表單流程

**訂課後**：自動建立 `SeatIdentityForm`（status=draft）

**填寫表單**：
```typescript
POST /api/v1/invitations/{code}/identity
{
  "studentName": "王小明",
  "contactEmail": "student@example.com",
  "birthDate": "2010-05-15",
  "isMinor": true,
  "guardianEmail": "parent@example.com"
}
```

**確認認領**：呼叫 `/claim` 時，系統檢查表單狀態並顯示確認資訊

## 錯誤處理

### 邀請碼相關

- `INVITE_NOT_FOUND` (404): 邀請碼不存在
- `INVITE_EXPIRED` (410): 邀請碼已過期
- `INVITE_ALREADY_CLAIMED` (409): 邀請碼已被使用
- `INVITE_CODE_COLLISION` (409): 邀請碼產生多次碰撞

### 席位認領相關

- `SEAT_CLAIMED` (409): 席位已被認領（含併發衝突）
- `IDENTITY_FORM_INCOMPLETE` (422): 身份表單未完成

### 其他

- `NOT_FOUND` (404): 資源不存在
- `VALIDATION_ERROR` (400): 驗證錯誤

## 測試

```bash
# 執行測試
npm test lessons.service.spec.ts
npm test invitations.service.spec.ts

# 測試覆蓋
npm test -- --coverage
```

### 測試案例

**LessonsService**:
- 課程清單查詢與過濾
- 建立課程與席位
- 席位狀態查詢（含/不含自評）

**InvitationsService**:
- 邀請碼產生（含碰撞重試）
- 邀請碼驗證（有效、過期、已使用）
- 席位認領成功
- **併發認領衝突測試**（樂觀鎖）

## 資料庫 Schema

參考 `prisma/schema.prisma`：

- `Lesson`: 課程主表
- `OrderSeat`: 席位（含 version 樂觀鎖）
- `SeatInvitation`: 邀請碼（8 字元主鍵）
- `SeatIdentityForm`: 身份表單
- `GlobalStudent`: 全域學生
- `StudentMapping`: 學生雪場映射
- `GuardianRelationship`: 監護人關係

## 依賴

- `@nestjs/common`: NestJS 核心
- `class-validator`: DTO 驗證
- `class-transformer`: 資料轉換
- `crypto`: 邀請碼產生
- `PrismaService`: 資料庫存取

## 注意事項

1. **樂觀鎖機制**: 席位認領使用 `version` 欄位，併發衝突時會清理已建立的 StudentMapping
2. **邀請碼格式**: 8 字元大寫字母+數字，排除 0O1I 避免混淆
3. **身份表單驗證**: 認領前必須完成表單填寫（status=submitted）
4. **監護人關係**: 未成年學生（isMinor=true）需提供 guardianEmail
5. **事務處理**: 認領流程涉及多表操作，失敗時需 rollback
6. **自評查詢**: 使用 `include=self_eval` 參數可載入學生自評資料

## 未來改進

- [ ] 新增邀請碼批次產生功能
- [ ] 實作邀請碼重寄機制
- [ ] 新增席位狀態變更審計日誌
- [ ] 實作排程清理過期邀請碼
- [ ] 支援邀請碼自訂過期時間
- [ ] 新增席位認領通知（Email/LINE）
