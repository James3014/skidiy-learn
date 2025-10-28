# DIY Ski Evaluation Platform (Reboot)

以 `sdd-T-spec_20251002.md` 與《LINUS_GUIDE.md》為準則，使用 **Next.js + NestJS + PostgreSQL + Redis + Keycloak** 重構滑雪教學評量系統。

## Philosophy
- **Good Taste**：消除特殊情況，以資料結構驅動程式碼。
- **Never Break Userspace**：所有功能皆向後相容，透過 Feature Flag 控制釋出。
- **Pragmatism**：解決真實痛點，拒絕臆測性複雜度。
- **Simplicity**：模組短小，函式只做一件事。

## Monorepo Structure
```
apps/
  api/   NestJS 後端
  web/   Next.js 前端
packages/
  schema/  Zod 型別，共享 DTO
infrastructure/
  keycloak/  Realm 匯入設定
```

## Getting Started
1. 安裝依賴（需外網）：
   ```bash
   corepack enable
   pnpm install
   ```
2. 啟動基礎服務：
   ```bash
   cp .env.example .env
   docker compose up -d
   ```
3. 開發模式：
   ```bash
   pnpm dev:api   # 以 3000/health 提供 API 檢測
   pnpm dev:web   # Next.js 於 3000 port
   ```

## Code Quality Tooling
- `pnpm lint:root`：檢查根目錄腳本與設定檔。
- `pnpm --recursive lint`：沿用各 workspace 的 lint 規則（API/Web/Schema）。
- `pnpm format`：使用 Prettier 套用預設排版。
- `pnpm lint-staged`：供 Husky pre-commit 使用，只修正暫存區檔案。

首次安裝後執行 `pnpm prepare` 會安裝 Husky。提交前若未透過 Git 觸發 pre-commit，也可手動執行 `pnpm lint-staged` 確保格式一致。

## Continuous Integration
- `.github/workflows/ci.yml` 會在 push / PR 時執行。
- 目前流程會跑：
  1. `pnpm lint:root`
  2. `pnpm --filter packages/schema lint`
  3. `pnpm --filter apps/web lint`
  4. `pnpm --filter apps/api lint`（暫時允許失敗，待 lessons 模組完成後再改為必跑）

## Specification & Tasks
- 實作計畫：`docs/spec-kit/implementation-plan.md`
- 任務拆解：`docs/spec-kit/tasks.md`
- 核心規格：`sdd-T-spec_20251002.md`

在開始任何工作前，請先閱讀《LINUS_GUIDE.md》，確保思考符合 Linus 哲學。完成任務後，更新規格與任務文件保持同步。任何破壞性變更都必須先確認向後相容策略。
