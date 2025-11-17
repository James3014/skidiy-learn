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

# 環境變數
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# 啟動前執行數據庫遷移，然後啟動應用
# 直接用 node 執行 prisma，完全避免 pnpm/npx
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]
