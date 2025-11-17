# 代碼改進計劃：從 85 分到 95 分

## 📊 當前評分：82-85 / 100
## 🎯 目標評分：95 / 100
## 📈 需要提升：+10-13 分

---

## 評分詳細分析

### 當前得分構成（85分）
- ✅ 數據結構合理：70分基礎 + 10分
- ✅ 代碼品味良好：+8分（對象映射、函數提取、內聯優化）
- ✅ 簡潔性：+7分（縮進≤3層、函數專注）
- ✅ 安全性：+5分（環境檢查、事務、樂觀鎖）
- ❌ 扣分項：-15分

### 扣分項分析
1. **過度設計**（-8分）
   - Rate limiting 對內部操作過度
   - Audit logging 記錄過於詳細
   - Share visibility 三級別可能只需兩級

2. **類型安全不足**（-5分）
   - Prisma 動態類型導致 `any`
   - 錯誤處理模式不統一
   - 魔法數字散落各處

3. **仍可簡化**（-3分）
   - claimSeat 仍有 ~120 行
   - 缺少類型守衛
   - 部分函數缺少文檔

---

## 🚀 改進計劃（5個階段）

### **Phase 1: 移除過度設計** [+8分]

#### 1.1 簡化 Rate Limiting ✅ 已開始
**當前問題**：
- `lesson-record.service.ts:90` - 內部查詢操作
- `sharing.service.ts:97` - 內部查詢操作
- 硬編碼魔法數字：`30`, `60_000`

**解決方案**：
```typescript
// ✅ 已創建：src/config/rate-limits.ts
export const RATE_LIMITS = {
  SHARED_QUERY: { max: 30, windowMs: 60_000 },  // 可設為 0 禁用
  INVITATION_VERIFY: { max: 10, windowMs: 60_000 }
} as const;
```

**改進點**：
- [x] 創建集中配置文件
- [ ] 更新 lesson-record.service.ts 使用配置
- [ ] 更新 sharing.service.ts 使用配置
- [ ] 添加禁用檢查（max = 0 時跳過）
- [ ] 更新測試

**預期收益**：+2分

---

#### 1.2 簡化 Audit Logging
**當前問題**：
- 查詢操作也記錄審計（過度）
- 每次 listSharedRecords 都記錄

**解決方案**：
```typescript
// 定義審計級別
enum AuditLevel {
  CRITICAL,  // 創建、刪除、權限變更
  IMPORTANT, // 更新、分享
  INFO       // 查詢（可選）
}

// 只記錄 CRITICAL 和 IMPORTANT
```

**改進點**：
- [ ] 創建審計級別配置
- [ ] 移除查詢操作的審計日誌
- [ ] 保留：創建、更新、刪除、分享操作
- [ ] 更新測試

**預期收益**：+3分

---

#### 1.3 評估 Share Visibility
**當前狀態**：三級別 `private | resort | all`

**分析**：
- 實際使用場景檢查
- 'resort' 和 'all' 的區別是否必要？
- 可能合併為 `private | shared`

**改進點**：
- [ ] 檢查實際使用場景（需用戶確認）
- [ ] 如合適，簡化為二級別
- [ ] 更新 schema 和代碼
- [ ] 數據遷移

**預期收益**：+3分（如果簡化）

---

### **Phase 2: 提升類型安全** [+5分]

#### 2.1 統一錯誤響應格式
**當前問題**：
```typescript
// 混合使用
throw new NotFoundException('字符串');  // ❌
throw new NotFoundException({ code, message });  // ✅
```

**解決方案**：
```typescript
// src/types/errors.ts
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}
```

**改進點**：
- [ ] 創建統一錯誤類型
- [ ] 更新所有錯誤拋出點
- [ ] 添加錯誤代碼常量
- [ ] 更新測試

**預期收益**：+2分

---

#### 2.2 提取魔法數字為常量
**當前問題**：
```typescript
// invitations.service.ts
const maxRetries = 5;  // 行44
const chars = 'ABCDEFGH...';  // 行354
for (let i = 0; i < 8; i++)  // 邀請碼長度

// students.service.ts (已修復，但可改進)
@Min(1) @Max(5) selfRating  // 評分範圍
```

**解決方案**：
```typescript
// src/config/constants.ts
export const INVITATION_CODE = {
  LENGTH: 8,
  CHARSET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',  // 排除 0O1I
  MAX_RETRIES: 5
} as const;

export const RATING = {
  MIN: 1,
  MAX: 5
} as const;
```

**改進點**：
- [ ] 創建 constants.ts
- [ ] 提取所有魔法數字
- [ ] 更新代碼使用常量
- [ ] 更新測試

**預期收益**：+2分

---

#### 2.3 添加明確類型定義
**當前問題**：
- Prisma 動態類型導致 `any`
- 函數參數類型可更明確

**解決方案**：
```typescript
// src/types/invitation.ts
export interface ClaimResult {
  seatId: string;
  mappingId: string;
  message: string;
}

export interface InvitationWithSeat extends SeatInvitation {
  seat: OrderSeat & {
    identityForm: SeatIdentityForm | null;
  };
}
```

**改進點**：
- [ ] 定義業務類型
- [ ] 減少對 Prisma 動態類型依賴
- [ ] 添加類型守衛函數
- [ ] 更新測試

**預期收益**：+1分

---

### **Phase 3: 進一步簡化** [+3分]

#### 3.1 重構 claimSeat Transaction
**當前問題**：
- transaction 閉包內 ~70 行代碼
- 邏輯步驟清晰但仍可拆分

**解決方案**：
```typescript
private async executeClaimTransaction(
  tx: Prisma.TransactionClient,
  context: ClaimContext
): Promise<ClaimResult> {
  const student = await this.findOrCreateGlobalStudent(tx, context.dto);
  const mapping = await this.createStudentMapping(tx, student.id, context.lesson.resortId);

  await this.claimSeatWithLock(tx, context.seat, mapping.id, context.now);
  await this.finalizeClaimProcess(tx, context, mapping.id);

  return { seatId: context.seat.id, mappingId: mapping.id };
}

// 從 120 行主函數 -> 30 行 + 4個輔助函數（各20行）
```

**改進點**：
- [ ] 創建 ClaimContext 類型
- [ ] 提取 claimSeatWithLock
- [ ] 提取 finalizeClaimProcess
- [ ] 簡化主函數到 ~80 行
- [ ] 更新測試

**預期收益**：+2分

---

#### 3.2 添加類型守衛
**解決方案**：
```typescript
// src/types/guards.ts
export function isActiveAccount(account: unknown): account is ActiveAccount {
  return (
    typeof account === 'object' &&
    account !== null &&
    'status' in account &&
    account.status === 'active'
  );
}

export function hasResortAccess(instructor: unknown): instructor is InstructorWithResort {
  return (
    typeof instructor === 'object' &&
    instructor !== null &&
    'resortId' in instructor &&
    typeof instructor.resortId === 'number'
  );
}
```

**改進點**：
- [ ] 創建類型守衛文件
- [ ] 添加 4-5 個關鍵守衛
- [ ] 在代碼中使用
- [ ] 添加測試

**預期收益**：+1分

---

### **Phase 4: 測試完善** [必需，不加分但避免扣分]

#### 4.1 單元測試覆蓋率 >90%
**當前狀態**：
- ✅ auth.service.spec.ts - 已有測試
- ⚠️ lesson-record.service.spec.ts - 部分測試
- ❌ sharing.service.spec.ts - 需補充
- ❌ invitations.service - 缺少關鍵測試

**改進點**：
- [ ] lesson-record: 測試新的配置使用
- [ ] sharing: 測試權限邏輯
- [ ] invitations: 測試 claimSeat 完整流程
- [ ] 所有新增輔助函數的測試

**預期收益**：避免扣分

---

#### 4.2 集成測試
**關鍵流程**：
1. 完整的邀請碼認領流程
2. 權限檢查（不同角色）
3. 錯誤場景（過期、已認領、樂觀鎖衝突）

**改進點**：
- [ ] 創建集成測試套件
- [ ] 測試 3-5 個關鍵流程
- [ ] 確保所有錯誤場景覆蓋

**預期收益**：避免扣分

---

### **Phase 5: 文檔和驗證** [+1分]

#### 5.1 添加 JSDoc
**關鍵函數**：
- claimSeat
- validateInvitationCode
- findOrCreateGlobalStudent
- 所有 public API

**模板**：
```typescript
/**
 * 認領席位（含樂觀鎖保護）
 *
 * 完整的席位認領流程，包括：
 * 1. 驗證邀請碼有效性
 * 2. 創建/查找全局學生記錄
 * 3. 創建學生-度假村映射
 * 4. 使用樂觀鎖更新席位狀態
 * 5. 處理監護人關係（如適用）
 *
 * @param dto - 認領資料，包含學生和監護人信息
 * @returns 席位 ID 和學生映射 ID
 *
 * @throws {NotFoundException} 邀請碼不存在或課程不存在
 * @throws {GoneException} 邀請碼已過期
 * @throws {ConflictException} 邀請碼已使用或席位已被認領（樂觀鎖衝突）
 * @throws {UnprocessableEntityException} 身份表單未完成
 *
 * @example
 * const result = await service.claimSeat({
 *   code: 'ABC12345',
 *   studentName: '張三',
 *   contactEmail: 'zhang@example.com'
 * });
 */
async claimSeat(dto: ClaimInvitationDto): Promise<ClaimResult>
```

**改進點**：
- [ ] 10-15 個關鍵函數添加 JSDoc
- [ ] 包含參數、返回值、異常說明
- [ ] 添加使用示例

**預期收益**：+1分

---

#### 5.2 最終驗證
**檢查清單**：
- [ ] 所有測試通過
- [ ] ESLint 無錯誤
- [ ] TypeScript 編譯通過
- [ ] 代碼覆蓋率 >90%
- [ ] 運行應用無錯誤
- [ ] Linus 準則檢查：
  - [ ] 縮進 ≤3 層 ✓
  - [ ] 函數 <80 行 ✓
  - [ ] 零特殊情況 ✓
  - [ ] 零重複代碼 ✓
  - [ ] 數據結構清晰 ✓

---

## 📊 預期最終評分

### 改進後得分構成（95分）
- 數據結構合理：70 + 10 = 80
- 代碼品味：+8 → +10（簡化 claimSeat）
- 簡潔性：+7（保持）
- 安全性：+5（保持）
- 類型安全：+5（新增）
- 可配置性：+3（新增）
- 文檔完善：+1（新增）
- 測試覆蓋：+2（新增）

**總分**：80 + 10 + 7 + 5 + 5 + 3 + 1 + 2 = **113**（歸一化為 95/100）

---

## ⏱️ 預估工時

| 階段 | 工作量 | 預估時間 |
|------|--------|---------|
| Phase 1 | 中等 | 2-3 小時 |
| Phase 2 | 大 | 3-4 小時 |
| Phase 3 | 中等 | 2-3 小時 |
| Phase 4 | 大 | 4-5 小時 |
| Phase 5 | 小 | 1-2 小時 |
| **總計** | - | **12-17 小時** |

---

## 🚦 執行建議

### 優先級排序
1. **高優先級**（必做）：
   - Phase 2.1: 統一錯誤格式（影響所有 API）
   - Phase 2.2: 提取常量（易於維護）
   - Phase 4: 測試完善（保證質量）

2. **中優先級**（強烈建議）：
   - Phase 1.1: 簡化 Rate Limiting
   - Phase 1.2: 簡化 Audit Logging
   - Phase 3.1: 重構 claimSeat

3. **低優先級**（可選）：
   - Phase 1.3: 評估 Share Visibility（需業務確認）
   - Phase 5.1: 添加 JSDoc（錦上添花）

### 分階段執行建議
**Week 1**: Phase 2 (類型安全) + Phase 4.1 (單元測試)
**Week 2**: Phase 1 (移除過度設計) + Phase 3 (進一步簡化)
**Week 3**: Phase 4.2 (集成測試) + Phase 5 (文檔)

---

## ✅ 驗收標準

達到 95 分的具體標準：
1. ✅ 所有測試通過（覆蓋率 >90%）
2. ✅ 零 ESLint 錯誤
3. ✅ 零魔法數字（全部常量化）
4. ✅ 統一錯誤格式（100%）
5. ✅ 縮進 ≤3 層（100%）
6. ✅ 主函數 <80 行（90%+）
7. ✅ 關鍵函數有文檔（>80%）
8. ✅ 可配置性（rate limit, audit level）

---

## 🎯 下一步

請確認：
1. 是否同意這個改進計劃？
2. 優先級順序是否符合需求？
3. 是否立即開始執行？還是需要調整？

如果同意，我將按照計劃逐步執行，每完成一個 Phase 提交一次代碼。
