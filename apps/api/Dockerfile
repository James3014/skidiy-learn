# 基於能工作的 Dockerfile.dev 結構，只修改生產環境需要的部分
FROM node:22-slim

# Install OpenSSL for Prisma（像 Dockerfile.dev 一樣）
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 使用 corepack（像 Dockerfile.dev 一樣）
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# 使用相同的工作目錄結構
WORKDIR /workspace

# 複製 workspace 配置（像 Dockerfile.dev 一樣）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY packages/schema/package.json ./packages/schema/ 2>/dev/null || true

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製源碼
COPY . .

# 切換到 api 目錄（像 Dockerfile.dev 一樣）
WORKDIR /workspace/apps/api

# Generate Prisma Client（像 Dockerfile.dev 一樣）
RUN pnpm prisma generate

# 構建（生產環境特有）
RUN pnpm build

# 環境變數
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# 運行 migration 然後啟動（使用 pnpm）
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
