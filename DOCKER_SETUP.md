# Docker Compose 部署指南

## 概述

由於在 macOS (Apple Silicon) 環境下遇到 Prisma Client 無法正常連接 PostgreSQL 的問題 (錯誤 P1010),我們採用 Docker Compose 作為開發環境的解決方案。

## 問題背景

**原始錯誤:**
```
PrismaClientInitializationError: User 'diyski' was denied access on the database 'diyski.public'
```

**嘗試過的解決方案:**
1. ❌ 重新生成 Prisma Client (5.22.0 → 5.19.0)
2. ❌ 修改 DATABASE_URL 連接字串 (添加 `?schema=public`)
3. ❌ 驗證資料庫權限 (已確認為 Superuser)
4. ❌ 降級 Prisma 版本

**結論:** Prisma 在嘗試連接前就失敗,可能是 macOS 特定問題。Docker Compose 提供穩定的 Linux 環境作為解決方案。

## 架構

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                       │
├─────────────────┬─────────────────┬─────────────────────┤
│   API Server    │   PostgreSQL    │   Redis + Others    │
│  (NestJS)       │   (Port 5432)   │                     │
│  Port 3001      │                 │                     │
│  → 3000         │                 │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

## 配置檔案

### 1. Dockerfile.dev

```dockerfile
FROM node:20-slim

# 安裝 OpenSSL 3.x 供 Prisma 使用
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 設定工作目錄
WORKDIR /workspace

# 複製 package 檔案
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製原始碼
COPY . .

# 生成 Prisma Client
WORKDIR /workspace/apps/api
RUN pnpm prisma generate

# 開放端口
EXPOSE 3000

# 啟動開發伺服器
CMD ["pnpm", "start:dev"]
```

**關鍵點:**
- 使用 `node:20-slim` (Debian) 而非 Alpine,以獲得更好的 OpenSSL 支持
- 安裝 OpenSSL 3.x (`libssl3` 已包含在 `openssl` 套件中)
- 在構建時生成 Prisma Client

### 2. schema.prisma 修改

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-arm64-openssl-3.0.x"]
}
```

**說明:**
- `native`: 支持本地 macOS 開發 (darwin-arm64)
- `linux-arm64-openssl-3.0.x`: Docker 容器中的 Debian 環境

### 3. docker-compose.yml

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    working_dir: /workspace/apps/api
    command: pnpm start:dev
    environment:
      DATABASE_URL: postgresql://diyski:diyski@postgres:5432/diyski
      NODE_ENV: development
      PORT: 3000
    ports:
      - '3001:3000'
    volumes:
      - .:/workspace
      - /workspace/node_modules
      - /workspace/apps/api/node_modules
    depends_on:
      - postgres
      - redis
```

**重要配置:**
- `DATABASE_URL` 使用容器名稱 `postgres` 而非 `localhost`
- Volume mounts 保留主機 `node_modules` 以避免覆蓋 Docker 生成的檔案
- 端口映射: `3001:3000` (主機:容器)

## 使用方法

### 啟動服務

```bash
# 構建並啟動 API 服務
docker compose -p diyski up api -d --build

# 在容器內重新生成 Prisma Client (首次啟動或 schema 更改後)
docker exec diyski-api-1 pnpm prisma generate

# 重啟 API 服務
docker compose -p diyski restart api
```

### 檢查狀態

```bash
# 查看所有容器
docker ps --filter name=diyski

# 查看 API 日誌
docker logs diyski-api-1 --tail 50

# 測試健康狀態
curl http://localhost:3001/api/health
```

### 資料庫操作

```bash
# 執行 Prisma 遷移
docker exec diyski-api-1 pnpm prisma migrate dev

# 查詢資料庫
docker exec diyski-postgres-1 psql -U diyski -d diyski -c "SELECT * FROM \"Lesson\" LIMIT 5;"
```

### 停止服務

```bash
# 停止 API 服務
docker compose -p diyski stop api

# 停止所有服務
docker compose -p diyski down

# 停止並刪除 volumes (會清除資料庫數據!)
docker compose -p diyski down -v
```

## 常見問題

### 1. Prisma 找不到正確的引擎

**錯誤:**
```
Prisma Client could not locate the Query Engine for runtime "linux-arm64-openssl-3.0.x"
```

**解決方案:**
```bash
# 在容器內重新生成 Prisma Client
docker exec diyski-api-1 pnpm prisma generate

# 重啟容器
docker compose -p diyski restart api
```

### 2. 端口已被佔用

**錯誤:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3001: bind: address already in used
```

**解決方案:**
```bash
# 找出佔用端口的進程
lsof -ti:3001

# 終止進程
kill -9 $(lsof -ti:3001)
```

### 3. Volume mount 覆蓋了 node_modules

**現象:** API 啟動失敗,缺少依賴

**解決方案:**
- `docker-compose.yml` 已配置匿名 volumes 來保護 `node_modules`
- 如果仍有問題,重新構建: `docker compose -p diyski up api -d --build`

## 開發工作流程

1. **修改代碼:** 在本地編輯器中修改檔案
2. **自動重載:** NestJS 的 `start:dev` 會自動偵測檔案變化
3. **Schema 變更:** 如果修改 `schema.prisma`:
   ```bash
   docker exec diyski-api-1 pnpm prisma generate
   docker exec diyski-api-1 pnpm prisma migrate dev
   docker compose -p diyski restart api
   ```

## 測試數據

系統已包含三個測試課程 (Lessons 101, 102, 103):

- **Lesson 101:** 未記錄未評量 - 有學生自評但無教學記錄
- **Lesson 102:** 已記錄未評量 - 有教學記錄但無能力評分
- **Lesson 103:** 都完成 - 完整的教學記錄和 8 項能力評分

詳見 `demo-data-simplified.md`

## 生產部署考量

目前配置使用 `Dockerfile.dev` 用於開發環境。生產部署時需考慮:

1. 創建 `Dockerfile.prod` 移除開發工具
2. 使用環境變數管理敏感資訊
3. 配置健康檢查和重啟策略
4. 考慮多階段構建以減小映像大小
5. 使用 nginx 作為反向代理

## 參考資料

- Prisma Docker 部署: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker
- NestJS Docker: https://docs.nestjs.com/recipes/docker
- Docker Compose 網絡: https://docs.docker.com/compose/networking/
