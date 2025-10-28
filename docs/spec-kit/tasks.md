# 滑雪教學評量系統：重構任務拆解

## A. 環境
1. 完整初始化 pnpm workspace，建立 `apps/api`, `apps/web`, `packages/schema` 目錄。
2. 建立 `docker-compose.yml`（PostgreSQL、Redis、Keycloak、MailHog），撰寫 `.env`/`.env.example`。
3. 設定 ESLint/Prettier/Husky；建立 GitHub Actions pipeline。
4. 撰寫根目錄 README，說明 Linus 原則與開發流程。

## B. 資料庫
1. 建立 Prisma schema，對應 `sdd-T-spec` 資料模型與 Enum。
2. 撰寫 migration/seed 流程，匯入能力矩陣與分析字典；建立資料一致性檢查腳本。
3. 定義 RLS/Trigger raw SQL；整合 Prisma client。

## C. 後端（NestJS）
1. 模組：`accounts`, `lessons`, `lesson-records`, `abilities`, `sharing`, `identity-forms`, `metrics`。
2. 功能實作：
   - 排序 API + 審計寫入
   - 共享狀態更新 + MFA + RateLimiter
   - 共享查詢 + Redis cache
   - 席位認領 + 身份表單 + BullMQ 排程
   - 能力評量建立/繼承
3. 產出 OpenAPI，並透過 `openapi-typescript` 生成前端型別。

## D. 前端（Next.js）
1. 將 `教學評量ui/` 畫面重構為 React 元件，實作角色導向頁面。
2. 整合 Keycloak（NextAuth），實作角色權限與保護路由。
3. 教練評量流程、學生認領流程、管理端共享控制與報表。
4. Storybook/Playwright/E2E 覆蓋主要情境。

## E. 測試與監控
1. 建立 Jest/Vitest 單元測試；使用 Testcontainers 進行 API 整合測試。
2. Playwright E2E：seat claim → lesson record → sharing → admin。
3. OpenTelemetry + Grafana 指標、Pino 日誌、Audit 匯出排程。

## F. 發布 / 回滾
1. 建立 Feature Flag（Unleash），規劃 rollout 白名單。
2. GitHub Actions + Docker + Argo CD 部署流程。
3. PostgreSQL PITR、Redis snapshot、Audit 備份與 Rollback 設計。
