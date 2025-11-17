# Zeabur 部署指南

本專案已針對 Zeabur 部署進行優化，包含完整的 Docker 配置和環境變數設定。

## 前置準備

### 1. 必要服務

在 Zeabur 上需要建立以下服務：

- **PostgreSQL** - 主資料庫
- **Redis** - 快取和 Session 管理
- **API** - NestJS 後端服務
- **Web** - Next.js 前端服務

### 2. 環境變數配置

#### PostgreSQL 服務
無需額外配置，使用 Zeabur 預設設定即可。

#### Redis 服務
無需額外配置，使用 Zeabur 預設設定即可。

#### API 服務環境變數

```bash
# 資料庫連線（使用 Zeabur 內部連線）
DATABASE_URL=${POSTGRES_URL}

# Redis 連線（使用 Zeabur 內部連線）
REDIS_URL=${REDIS_URL}

# 應用配置
NODE_ENV=production
PORT=8080

# JWT 密鑰（請替換為您自己的隨機字串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS 設定（替換為您的 Web 服務域名）
CORS_ORIGIN=https://${ZEABUR_WEB_DOMAIN}
```

#### Web 服務環境變數

```bash
# API 端點（使用 Zeabur 內部連線）
NEXT_PUBLIC_API_URL=https://${ZEABUR_API_DOMAIN}

# 應用配置
NODE_ENV=production
PORT=8080
```

## 部署步驟

### 方法一：透過 Zeabur Dashboard

1. **連接 GitHub 儲存庫**
   - 在 Zeabur 專案中點擊「Deploy New Service」
   - 選擇「GitHub」
   - 授權並選擇 `James3014/skidiy-learn` 儲存庫

2. **部署 PostgreSQL**
   - 點擊「Add Service」
   - 選擇「PostgreSQL」
   - 等待部署完成

3. **部署 Redis**
   - 點擊「Add Service」
   - 選擇「Redis」
   - 等待部署完成

4. **部署 API 服務**
   - 點擊「Deploy New Service」
   - 選擇已連接的儲存庫
   - 設定：
     - Service Name: `api`
     - Root Directory: `/`
     - Dockerfile Path: `apps/api/Dockerfile`
   - 在「Environment Variables」頁面設定上述 API 環境變數
   - 等待構建和部署完成

5. **部署 Web 服務**
   - 點擊「Deploy New Service」
   - 選擇已連接的儲存庫
   - 設定：
     - Service Name: `web`
     - Root Directory: `/`
     - Dockerfile Path: `apps/web/Dockerfile`
   - 在「Environment Variables」頁面設定上述 Web 環境變數
   - 等待構建和部署完成

6. **配置域名**
   - 為 API 和 Web 服務生成或綁定域名
   - 更新 API 服務的 `CORS_ORIGIN` 環境變數為 Web 域名
   - 更新 Web 服務的 `NEXT_PUBLIC_API_URL` 環境變數為 API 域名

### 方法二：透過 Zeabur CLI（進階）

```bash
# 安裝 Zeabur CLI
npm install -g @zeabur/cli

# 登入
zeabur login

# 部署
zeabur deploy
```

## Dockerfile 說明

### API Dockerfile (`apps/api/Dockerfile`)

採用多階段構建優化：

1. **base** - 安裝 pnpm 和 OpenSSL（Prisma 需要）
2. **dependencies** - 安裝所有 monorepo 依賴
3. **build** - 生成 Prisma Client 並構建 NestJS
4. **runtime** - 最小化生產環境映像

特色：
- 啟動時自動執行資料庫遷移 (`prisma migrate deploy`)
- 包含完整的 Prisma Client 和 schema
- 優化的層快取策略

### Web Dockerfile (`apps/web/Dockerfile`)

採用多階段構建優化：

1. **base** - 安裝 pnpm
2. **dependencies** - 安裝所有 monorepo 依賴
3. **build** - 構建 Next.js（standalone 模式）
4. **runtime** - 最小化生產環境映像

特色：
- 使用 Next.js standalone 輸出減少映像大小
- 包含靜態資源和公開文件
- 快速啟動時間

## 常見問題

### 1. API 服務啟動失敗

**可能原因**：資料庫連線失敗

**解決方案**：
- 確認 `DATABASE_URL` 環境變數已正確設定
- 確認 PostgreSQL 服務已啟動且可連線
- 檢查 Zeabur 日誌中的錯誤訊息

### 2. Prisma Client 生成失敗

**可能原因**：OpenSSL 缺失或 Prisma schema 錯誤

**解決方案**：
- API Dockerfile 已包含 OpenSSL 安裝步驟
- 確認 `apps/api/prisma/schema.prisma` 無語法錯誤
- 檢查構建日誌中的詳細錯誤

### 3. Web 服務無法連接到 API

**可能原因**：`NEXT_PUBLIC_API_URL` 設定錯誤或 CORS 設定問題

**解決方案**：
- 確認 `NEXT_PUBLIC_API_URL` 指向正確的 API 域名
- 確認 API 的 `CORS_ORIGIN` 包含 Web 域名
- 在瀏覽器開發者工具檢查網路請求

### 4. 資料庫遷移失敗

**可能原因**：資料庫權限不足或遷移檔案錯誤

**解決方案**：
- 檢查資料庫使用者是否有 CREATE TABLE 權限
- 確認 `apps/api/prisma/migrations/` 目錄完整
- 嘗試手動執行 `npx prisma migrate deploy`

## 效能優化建議

1. **啟用 Redis 快取**
   - API 已整合 Redis，確保環境變數已設定

2. **資料庫連線池**
   - Prisma 預設使用連線池，可在 schema.prisma 調整

3. **CDN 配置**
   - 考慮為靜態資源配置 CDN

4. **監控設定**
   - 使用 Zeabur 內建監控或整合第三方服務

## 安全性檢查清單

- [ ] 更改 `JWT_SECRET` 為強隨機字串
- [ ] 確認 `CORS_ORIGIN` 僅允許信任的域名
- [ ] 檢查資料庫存取權限
- [ ] 啟用 HTTPS（Zeabur 預設提供）
- [ ] 定期更新依賴套件

## 維護指令

### 本地開發

```bash
# 安裝依賴
pnpm install

# 啟動開發環境
pnpm dev

# 執行測試
pnpm test

# 執行整合測試（需要 Docker）
ENABLE_INTEGRATION_TESTS=true pnpm test:integration
```

### 資料庫管理

```bash
# 生成 Prisma Client
cd apps/api
pnpm prisma:generate

# 建立新遷移
pnpm prisma:migrate:dev

# 部署遷移（生產環境）
pnpm prisma migrate deploy

# 開啟 Prisma Studio
pnpm prisma studio
```

## 技術支援

如遇到部署問題，請：

1. 檢查 Zeabur 服務日誌
2. 確認環境變數設定正確
3. 查看本專案的 GitHub Issues
4. 參考 [Zeabur 官方文件](https://docs.zeabur.com/)
