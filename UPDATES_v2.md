# Plan B 更新記錄 v2.0

## 修正日期
2025-10-25

## 發現的問題

### 1. `migrate dev` 非互動模式錯誤
**問題：** 透過腳本執行 `prisma migrate dev` 會拋出 `MigrateDevEnvNonInteractiveError`

**原因：** Prisma CLI 檢查 `stdin.isTTY`，在非互動環境下拒絕執行 `migrate dev` 以防止意外資料遺失

**影響：** 原本的 `./scripts/db-migrate.sh` 無法直接建立新 migration

### 2. 參數傳遞問題
**問題：** 使用 `$@` 在雙引號中會變成單一字串

**修正：** 改用 `$*` 並搭配 `docker compose exec -w` 直接指定工作目錄

### 3. Migration 衝突
**問題：** 現有資料庫保留舊的 enum/type 定義，導致 `P3018: type already exists`

**解決方案：** 提供三種資料庫重置流程

## 已修正的內容

### 新增檔案

#### `scripts/db-deploy.sh` ⭐ 新增
非互動模式套用 migration，建議日常使用

```bash
#!/bin/bash
# Apply existing migrations in non-interactive mode (for CI/CD and deployment)
exec "$(dirname "$0")/prisma-docker.sh" migrate deploy "$@"
```

**用途：**
- 套用從 git 拉下來的 migration
- CI/CD 自動化部署
- 開發環境初始化

### 修正的檔案

#### `scripts/prisma-docker.sh`
**變更：**
1. 參數傳遞從 `$@` 改為 `$*`
2. 執行方式從 `sh -c "cd ... && npx prisma $@"` 改為 `exec -w /workspace/apps/api ... npx prisma $*`

**優點：**
- 避免參數在雙引號中合併成單一字串
- 直接在正確工作目錄執行，減少一層 shell

#### `scripts/db-migrate.sh`
**變更：** 新增警告訊息，提示使用者互動模式的需求

**內容：**
```bash
echo "⚠️  WARNING: migrate dev requires interactive terminal"
echo "Please use one of these instead:"
echo ""
echo "  1. To apply existing migrations (recommended):"
echo "     ./scripts/db-deploy.sh"
echo ""
echo "  2. To create new migration (interactive):"
echo "     docker compose exec -it prisma-runner sh"
echo "     cd /workspace/apps/api"
echo "     npx prisma migrate dev --name your_migration_name"
echo ""
read -p "Continue anyway? (y/N) " -n 1 -r
```

### 更新的文件

#### `QUICK_START.md`
**新增章節：**
- "Creating New Migrations (Interactive Only)" - 說明互動式建立 migration 流程
- 區分 "Daily Development" 與 "Creating New Migrations"

**變更：**
- 推薦使用 `./scripts/db-deploy.sh` 而非 `db-migrate.sh`
- 說明何時需要進入容器互動執行

#### `PRISMA_DOCKER_GUIDE.md`
**新增章節：**
- "Creating New Migrations (Interactive Mode Required)" - 詳細說明為何需要互動模式
- "Database Reset and Clean Setup" - 三種資料庫重置方法

**新增內容：**
1. **互動式 Migration 工作流程**
   ```bash
   docker compose exec -it prisma-runner sh
   cd /workspace/apps/api
   npx prisma migrate dev --name add_new_feature
   exit
   git add apps/api/prisma/migrations
   git commit -m "Add migration: add_new_feature"
   ```

2. **資料庫重置選項**
   - Option 1: DROP SCHEMA + CREATE SCHEMA (推薦)
   - Option 2: 刪除 Docker volume (核彈選項)
   - Option 3: `prisma migrate reset` (便利但會遺失資料)

3. **資料回填方法**
   - Manual SQL file
   - Prisma seed
   - CSV/JSON import

#### `scripts/README.md`
**變更：**
- 新增 `db-deploy.sh` 說明（標記為推薦）
- `db-migrate.sh` 標記警告符號並說明限制
- 明確指出使用場景

## 建議的工作流程

### 日常開發（套用既有 migration）
```bash
# 從 git 拉取最新程式碼
git pull

# 套用 migration
./scripts/db-deploy.sh

# 產生 Prisma Client
./scripts/prisma-docker.sh generate
```

### 建立新 Migration
```bash
# 1. 修改 schema
vim apps/api/prisma/schema.prisma

# 2. 進入容器
docker compose exec -it prisma-runner sh

# 3. 建立 migration
cd /workspace/apps/api
npx prisma migrate dev --name describe_your_change

# 4. 離開容器
exit

# 5. 提交
git add apps/api/prisma/migrations
git commit -m "Add migration: describe_your_change"
git push
```

### 資料庫重置（遇到 type already exists 錯誤時）
```bash
# 方法 1：只重置 schema（推薦）
docker exec -it diyski-postgres-1 psql -U diyski -d diyski
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO diyski;
GRANT ALL ON SCHEMA public TO public;
\q

./scripts/db-deploy.sh

# 方法 2：完全重置（核彈選項）
cd /Users/jameschen/Downloads/diyski/評量
docker compose down
docker volume rm diyski_pgdata
docker compose up -d postgres
sleep 5

cd /tmp/diyski_ascii
./scripts/db-deploy.sh
```

## Migration 檔案命名規範

建議將 migration 依時間順序重新命名：

```
apps/api/prisma/migrations/
├── 202510240000_init_schema/          # 初始 25 張表
│   └── migration.sql
└── 202510250900_refactor_lesson_details/  # 欄位調整
    └── migration.sql
```

確保建立順序正確，避免相依性問題。

## 已知限制

1. **無法透過腳本直接建立 migration**
   - 原因：Prisma 需要 TTY（互動式終端）
   - 解決：必須進入容器互動執行

2. **現有資料庫可能有舊的 type 定義**
   - 症狀：`P3018: type "SportType" already exists`
   - 解決：重置資料庫 schema（參考上方流程）

3. **Docker volume 持久化**
   - 優點：資料不會在容器重啟時遺失
   - 缺點：需要手動清理才能完全重置

## 測試檢查清單

- [x] `./scripts/db-deploy.sh` 可成功套用 migration
- [x] `./scripts/prisma-docker.sh --version` 顯示 Linux binary
- [x] `./scripts/prisma-docker.sh generate` 產生 Prisma Client
- [x] 互動式進入容器可執行 `migrate dev`
- [x] 資料庫重置流程可正常運作
- [x] 文件更新完整且正確

## 下一步建議

1. **在原專案目錄測試**
   - 依照 `MIGRATION_CHECKLIST.md` 複製檔案
   - 驗證中文路徑下的運作

2. **建立 seed 機制**
   - 撰寫 `apps/api/prisma/seed.ts`
   - 在 `package.json` 設定 `prisma.seed`
   - 提供測試資料快速回填

3. **CI/CD 整合**
   - GitHub Actions 使用 `./scripts/db-deploy.sh`
   - 確保自動化測試環境使用相同流程

4. **團隊培訓**
   - 分享 `QUICK_START.md`
   - 說明 deploy vs dev 的差異
   - 示範互動式建立 migration 流程
