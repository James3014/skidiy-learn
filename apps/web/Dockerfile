# 最簡單的版本 - 不優化，只求能跑
FROM node:22-slim

RUN npm install -g pnpm@9

WORKDIR /app

# Copy 所有東西
COPY . .

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 移到 web 目錄
WORKDIR /app/apps/web

# 構建
RUN pnpm build

# 環境變數
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

EXPOSE 8080

# 直接用 node 執行 Next.js，完全避免 pnpm/npx
CMD ["node", "node_modules/next/dist/bin/next", "start"]
