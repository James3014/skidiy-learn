# 最簡單的版本 - 先讓它能跑
FROM node:22-slim

RUN npm install -g pnpm@9
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy 所有東西
COPY . .

# 安裝依賴 (包含 devDependencies，因為需要 @nestjs/cli)
RUN pnpm install --frozen-lockfile

# 移到 api 目錄
WORKDIR /app/apps/api

# 生成 Prisma Client
RUN pnpm prisma:generate

# 構建
RUN pnpm build

# 移除 workspace 配置，防止 pnpm 在運行時嘗試解析 workspace
RUN rm -f /app/pnpm-workspace.yaml

# 環境變數
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# 啟動前執行數據庫遷移，然後啟動應用
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
