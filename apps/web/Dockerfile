# 基於能工作的 Dockerfile.dev 結構，只修改生產環境需要的部分
FROM node:22-slim

# 使用 corepack（像 Dockerfile.dev 一樣）
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# 使用相同的工作目錄結構
WORKDIR /workspace

# 複製 workspace 配置（像 Dockerfile.dev 一樣）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/schema/package.json ./packages/schema/ 2>/dev/null || true

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製源碼
COPY . .

# 切換到 web 目錄（像 Dockerfile.dev 一樣）
WORKDIR /workspace/apps/web

# 構建（生產環境特有）
RUN pnpm build

# 環境變數
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

EXPOSE 8080

# 使用 pnpm start（像 Dockerfile.dev 使用 pnpm start:dev）
CMD ["pnpm", "start"]
