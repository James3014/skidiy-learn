# 滑雪教學評量系統：重構實作計畫

參考規格：`sdd-T-spec_20251002.md`

---

## 1. 環境與基礎
- 建立 pnpm workspace（apps/api、apps/web、packages/schema）。
- 建置 Docker Compose：PostgreSQL、Redis、Keycloak、MailHog。
- 整合 ESLint/Prettier/Husky；設定 GitHub Actions（lint/test/build）。
- 編寫專案 README 與貢獻指南，說明開發規範與分支流程。

## 2. 資料庫與種子
- 使用 Prisma 定義 DBML 對應模型、Enum、索引、RLS（透過 raw SQL migration）。
- 撰寫 `prisma/seed.ts`：匯入 `abilitylist.csv`、`教學紀錄_200925.csv` 轉換後的 JSON（或直接 CSV 流）；建立 `ability_catalog`、`analysis_groups/items`、`practice_drills`、`coach_ability_ratings` 等初始資料。
- 建立資料遷移流程：初始化 `share_visibility`、`student_types`、`legacy_id_mappings`。
- 設計檢查腳本，確保 CSV ↔ DB 一致性與 referential integrity。

## 3. 後端 (NestJS)
- 模組拆分：`accounts`, `lessons`, `lesson-records`, `abilities`, `sharing`, `identity-forms`, `metrics`。
- 服務要點：
  - 排序 API (`analyses/practices/reorder`) 使用交易並寫入 `audit_logs`。
  - 共享狀態更新（MFA、角色 Guard、RateLimiter/Redis）。
  - 共享查詢 `scope=shared` + Redis 快取，節流 30 次/分鐘。
  - 席位認領流程 + 身份表單 Wizard，審計寫入 + BullMQ 排程。
  - 能力評量 1~3 星對應 `coach_proficiency_band_enum`；繼承鏈驗證。
- 框架：Nest Config, Class Validator, Swagger/OpenAPI，自動輸出前端型別。
- 背景作業：BullMQ 處理邀請碼逾期、審計匯出、報表預計算。

## 4. 前端 (Next.js + React)
- 依 `教學評量ui/` HTML 重建頁面：學生、教練、管理端三種工作區。
- OIDC 登入：NextAuth.js + Keycloak Provider；角色導向的保護路由（Middleware + Server Actions）。
- 狀態：TanStack Query + React Query Devtools；Zustand 管控本地 UI 狀態。
- 元件：Tailwind + Radix UI 建立設計系統（Card、Tabs、Chips、Modals）。
- 功能：
  - 教練評量：自評對照、能力矩陣瀏覽、拖拉排序、學生類型 Chips。
  - 學生/監護人：邀請碼認領、身份表單、課前自評。
  - 管理端：共享權限開關、字典維護、共享紀錄查詢、報表。
- 測試：Storybook、Playwright（多角色 scenario）、Lighthouse 監測。

## 5. 審計與監控
- Audit Pipeline：Nest Interceptor 收集 `actor_id`, `action`, `filters`, `count`, `reason`, `performed_at`。
- 指標：`shared_query_count`, `shared_rate_limited`, `expired_invites_processed`, `job_failure`。
- OpenTelemetry：後端 + 前端透過 OTLP 匯出到 Grafana Stack（Tempo+Loki+Prometheus）。
- 日誌：Pino JSON 格式，分環境存儲；Airflow/BigQuery 另行匯總。

## 6. 測試策略
- **單元**：Jest (Nest) 覆蓋 Service/Guard/Util；Vitest (React) 覆蓋 Hook/Util。
- **整合**：Testcontainers 啟動 PostgreSQL/Redis/Keycloak，透過 Supertest 驗證 API。
- **E2E**：Playwright + Seed Data，從 seat claim → 教練評量 → 共享查詢 → 管理審核完整流程。
- **資料校對**：定期腳本比對 CSV 種子 vs DB 數據；監控差異並產生報告。

## 7. 發布與回滾
- Feature Flag：Unleash 控制共享功能、自評顯示、AI 摘要等；分階段 rollout。
- CI/CD：GitHub Actions → Docker Build → ArgoCD/Kubernetes (staging → prod)。
- 備援：PostgreSQL PITR、Redis Snapshot、Audit Log 匯出備份。
- Rollback：Argo Rollouts Canary；必要時回復上一版本容器與資料快照，確保「Never Break Userspace」。
