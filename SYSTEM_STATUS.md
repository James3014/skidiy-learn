# DIY Ski 評量系統 - 系統狀態報告

**更新時間**: 2025-10-27
**版本**: v1.0-beta

## 系統概述

DIY Ski 評量系統是一個滑雪教練教學評量與學生進度追蹤系統，採用前後端分離架構，提供教練端與學生端完整的用戶旅程。

## 技術棧

### 後端 (API)
- **框架**: NestJS 10.4.20
- **語言**: TypeScript 5.6.3
- **資料庫**: PostgreSQL 16 (Docker)
- **ORM**: Prisma 5.19.0
- **API 文件**: Swagger/OpenAPI
- **認證**: JWT (passport-jwt)
- **驗證**: class-validator

### 前端 (Web)
- **框架**: Next.js 14.2.33 (App Router)
- **語言**: TypeScript 5.6.3
- **UI**: Tailwind CSS 3.4.17
- **狀態管理**: @tanstack/react-query 5.90.5
- **HTTP 客戶端**: Axios 1.7.9

### 基礎設施
- **容器化**: Docker Compose
- **包管理**: pnpm (workspace)
- **開發工具**: ts-node, tsx, nodemon

## 運行狀態

### 服務端口
- **API Server**: `http://localhost:3001/api`
- **Frontend**: `http://localhost:3003`
- **PostgreSQL**: `localhost:5432`
- **Swagger UI**: `http://localhost:3001/api-docs`

### 啟動命令
```bash
# API (在 apps/api 目錄)
PORT=3001 pnpm start:dev

# Frontend (在 apps/web 目錄)
pnpm dev --port 3003

# Database (在專案根目錄)
docker compose up -d
```

## 已實作功能

### 1. 教練端功能

#### 1.1 認證與授權
- ✅ 測試登入頁 (`/login-test`)
- ✅ JWT Token 管理
- ✅ 角色權限控制 (instructor/student/admin)

#### 1.2 課程管理
- ✅ 課程列表頁 (`/lessons`)
  - 搜尋與過濾 (課程 ID、雪場)
  - 日期篩選 (全部/今日/本週/本月)
  - 座位狀態顯示
  - 排序功能
- ✅ 課程詳情頁 (`/lessons/[id]`)
  - 課程資訊展示
  - 座位管理 (狀態追蹤)
  - 學生自評顯示
  - 評分歷史查看

#### 1.3 教學記錄與評分
- ✅ 教學記錄創建頁 (`/lessons/[id]/records/new`)
  - 教學總結輸入
  - 分析項目管理 (Analysis Groups & Items)
  - 練習設計 (Practice Skills & Drills)
  - **60項能力評分系統**
    - 3星評等：認識⭐ / 熟悉⭐⭐ / 優秀⭐⭐⭐
    - 能力分類篩選
    - 快速批量評分
    - 顯示學生歷史評分
  - 草稿自動儲存 (localStorage)
  - 兩階段提交 (lesson record → ratings)

### 2. 學生端功能

#### 2.1 座位領取
- ✅ 邀請碼領取頁 (`/claim`)
  - 8位字元邀請碼驗證
  - 過期/已使用檢查
  - 完整學生資訊表單
    - 姓名、英文名
    - 出生日期
    - 聯絡方式 (Email、電話)
    - 未成年標記 + 監護人 Email
    - 外部保險資訊
    - 備註
  - 三步驟流程體驗

#### 2.2 自我評估
- ✅ 學生自評頁 (`/self-eval`)
  - 1-5分自我評分 (視覺化圓形按鈕)
  - 每個分數說明文字
  - 補充說明文字框
  - 自動載入/更新已有評估
  - 參數驗證 (mappingId + lessonId)

### 3. 管理員功能

#### 3.1 字典維護 (`/admin/dictionary`)
- ✅ 多分頁系統設計 (能力清單/教學分析/練習項目/雪場與雪道)
- ✅ 搜尋功能
- ✅ 列表顯示與 CRUD 操作按鈕
- ✅ 批次匯入功能介面
- ✅ 浮動新增按鈕 (FAB)
- ✅ 深色模式支援

#### 3.2 報表與分析 (`/admin/reports`)
- ✅ 日期範圍篩選器
- ✅ 三種報表類型切換 (教練表現/學生參與度/雪場使用率)
- ✅ 摘要統計卡片
  - 教練總完成率 (含成長趨勢)
  - 學生總參與數 (含新增人數)
  - 最受歡迎雪場
- ✅ 視覺化圖表 (教練完成率長條圖)
- ✅ 詳細數據表格 (可排序、狀態高亮)
- ✅ 匯出功能按鈕

#### 3.3 課程管理 (`/admin/courses`)
- ✅ 課程搜尋列
- ✅ 多維度篩選器
  - 時間範圍 (今天/本週/本月/自訂)
  - 教練篩選
  - 雪場篩選
  - 課程狀態 (未評量/已評量)
- ✅ 課程卡片顯示
  - 日期、教練資訊
  - 座位佔用狀態 (已佔用/總座位)
  - 狀態標籤 (未評量/已評量/已結束)
- ✅ 管理席位按鈕
- ✅ 浮動新增課程按鈕 (FAB)
- ✅ 空狀態提示

### 4. API Endpoints

#### 4.1 認證
- `POST /api/v1/auth/login` - 登入

#### 4.2 課程
- `GET /api/v1/lessons` - 課程列表（支援過濾）
- `GET /api/v1/lessons/:id` - 課程詳情
- `GET /api/v1/lessons/:id/seats` - 座位列表（含自評）
- `POST /api/v1/lessons` - 建立課程

#### 4.3 邀請碼
- `GET /api/v1/invitations/:code` - 驗證邀請碼
- `POST /api/v1/invitations/claim` - 領取座位
- `POST /api/v1/invitations/:code/identity` - 提交身份資訊
- `POST /api/v1/seats/:id/invitations` - 產生邀請碼

#### 4.4 學生自評
- `POST /api/v1/students/:mappingId/lessons/:lessonId/self-eval` - 提交/更新自評

#### 4.5 教學記錄
- `POST /api/v1/lesson-records` - 建立教學記錄
- `GET /api/v1/lesson-records/private` - 私人教學記錄列表

#### 4.6 教練評分
- `POST /api/v1/lesson-records/ratings` - 建立評分
- `GET /api/v1/lesson-records/students/:mappingId/latest-ratings` - 最新評分

#### 4.7 能力、分析、練習
- `GET /api/abilities` - 能力列表（60項）
- `GET /api/analysis-groups` - 分析群組
- `GET /api/practice-skills` - 練習技能

#### 4.8 共享記錄
- `GET /api/v1/sharing/records` - 共享記錄列表

## 資料庫結構

### 核心資料表

#### Lesson (課程)
- id, resortId, instructorId, lessonDate
- 關聯: OrderSeat[], StudentSelfEvaluation[]

#### OrderSeat (座位)
- id, lessonId, seatNumber, status (pending/claimed/completed)
- claimedMappingId, claimedAt
- 關聯: SeatInvitation, SeatIdentityForm, StudentMapping

#### SeatInvitation (邀請碼)
- id, seatId, code (8字元), expiresAt, claimedAt, claimedBy
- 唯一約束: code

#### StudentMapping (學生映射)
- id (UUID)
- 關聯: OrderSeat[], StudentSelfEvaluation[]

#### StudentSelfEvaluation (學生自評)
- id, studentMappingId, lessonId
- selfRating (1-5), selfComment
- 唯一約束: (studentMappingId, lessonId)

#### LessonRecord (教學記錄)
- id, lessonId, summary, videos
- 關聯: LessonRecordDetail[]

#### LessonRecordDetail (教學記錄詳情)
- id, lessonRecordId, studentMappingId
- shareVisibility (private/resort/all)
- studentTypes[], sharedAt, sharedBy
- 關聯: CoachRating[]

#### CoachRating (教練評分)
- id, lessonRecordDetailId, abilityId
- rating, proficiencyBand (knew/familiar/excellent)
- comment, sourceRatingId

#### Ability (能力項目)
- id, name, category, sportType
- skillLevel (1-10), sequenceInLevel
- 總共60項能力

## 前端架構

### 目錄結構
```
apps/web/
├── app/                    # Next.js App Router 頁面
│   ├── claim/             # 座位領取
│   ├── lessons/           # 課程相關
│   │   └── [id]/
│   │       └── records/new/  # 教學記錄創建
│   ├── login-test/        # 測試登入
│   └── self-eval/         # 學生自評
├── lib/
│   ├── api/               # API 客戶端
│   │   └── client.ts      # axios + 型別定義
│   ├── hooks/             # React Query hooks
│   ├── providers/         # React Query Provider
│   └── utils/             # 工具函數 (env.ts)
└── components/            # 共用元件
```

### 關鍵設計模式

#### 1. React Query 整合
- 集中式 API client (`lib/api/client.ts`)
- 自訂 hooks (`use-lessons.ts`, `use-lesson-records.ts`)
- 自動快取與重新驗證

#### 2. 型別安全
- OpenAPI schema 生成 TypeScript types
- 手動維護的型別定義（待 backend schemas 補齊）

#### 3. 草稿自動儲存
- localStorage 儲存未完成表單
- 1秒 debounce
- 頁面載入時自動恢復

#### 4. 深色模式
- Tailwind dark: 選擇器
- 所有頁面完整支援

## 待完成項目

### 高優先級
1. ⏳ **完整端到端測試** - 測試登入 → 課程 → 評分流程
2. ⏳ **錯誤處理優化** - 統一錯誤訊息顯示
3. ⏳ **Loading 狀態改善** - 骨架屏 (skeleton screens)

### 中優先級
4. ⏳ **座位邀請碼產生功能** - 教練產生邀請碼 UI
5. ⏳ **評分歷史詳細頁** - 查看完整評分時間軸
6. ⏳ **共享記錄瀏覽** - 查看其他教練的公開教學記錄
7. ⏳ **影片上傳功能** - 教學影片上傳與播放

### 低優先級
8. ⏳ **多語言支援** - i18n (繁中/英文/日文)
9. ⏳ **PWA 支援** - 離線模式、安裝到主畫面
10. ⏳ **通知系統** - Email/推播通知

## 已知問題

### 後端
1. ⚠️ OpenAPI response schemas 缺失 - 部分 endpoints 沒有 @ApiResponse 裝飾器
2. ⚠️ JWT refresh token 機制未實作 - 僅有 access token
3. ⚠️ 檔案上傳 endpoint 未實作 - 教學影片上傳功能待補

### 前端
1. ⚠️ 圖片/影片上傳 UI 未實作 - 教學記錄頁面僅有欄位佔位
2. ⚠️ 座位邀請碼產生 UI 缺失 - 需從課程詳情頁觸發
3. ⚠️ 響應式設計待優化 - 小螢幕 (< 640px) 部分排版問題

### 一般
1. ⚠️ 測試覆蓋率不足 - 僅有部分單元測試
2. ⚠️ API 文件不完整 - 缺少使用範例
3. ⚠️ 環境變數管理 - 需要 .env.example 檔案

## 測試帳號

### 教練帳號
- 帳號 ID: `demo-instructor-1`
- 角色: instructor

### 測試流程

#### 教練端流程
1. 訪問 `http://localhost:3003/login-test`
2. 輸入 `demo-instructor-1` 登入
3. 進入課程列表 `/lessons`
4. 選擇課程查看詳情
5. 點擊已認領座位的「建立教學記錄」
6. 填寫分析、練習、評分
7. 提交教學記錄

#### 學生端流程
1. 訪問 `http://localhost:3003/claim`
2. 輸入8位邀請碼（需先從 API 產生）
3. 填寫學生資訊
4. 領取座位成功
5. 訪問 `/self-eval?mappingId=xxx&lessonId=yyy`
6. 填寫課前自評

## 部署建議

### 開發環境
- API: `pnpm start:dev`（port 3001）
- Web: `pnpm dev --port 3003`
- DB: Docker Compose

### 生產環境
1. **前端**: Vercel / Netlify
   - 環境變數: `NEXT_PUBLIC_API_URL`
2. **後端**: Railway / Render / AWS ECS
   - 環境變數: `DATABASE_URL`, `JWT_SECRET`
3. **資料庫**: Supabase / Railway PostgreSQL
4. **靜態資源**: Cloudflare R2 / AWS S3

## 效能指標

### 目標
- API 回應時間: < 200ms (p95)
- 頁面載入時間: < 2s (FCP)
- Core Web Vitals: 全綠

### 優化建議
1. 啟用 API response 快取
2. 實作 pagination（課程列表、評分記錄）
3. 圖片/影片 CDN
4. Database query 優化（增加 index）

## 安全性

### 已實作
- ✅ JWT 認證
- ✅ Role-based 權限控制
- ✅ Input validation (class-validator)
- ✅ SQL injection 防護 (Prisma ORM)
- ✅ CORS 設定

### 待加強
- ⏳ Rate limiting (現有 RateLimiterModule 待啟用)
- ⏳ CSRF protection
- ⏳ XSS 防護加強
- ⏳ 敏感資料加密（出生日期、聯絡方式）
- ⏳ Audit logging 完整化

## 版本歷史

### v1.0-beta (2025-10-27)
- ✅ 完整前端頁面實作（6個核心頁面）
- ✅ 學生自評 API endpoint 補齊
- ✅ 60項能力評分系統
- ✅ 座位邀請碼機制
- ✅ React Query 整合
- ✅ 深色模式支援

## 聯絡資訊

**專案負責人**: [待填寫]
**GitHub Repository**: [待填寫]
**Issue Tracker**: [待填寫]

---

**備註**: 此文件持續更新，請確保同步最新版本。
