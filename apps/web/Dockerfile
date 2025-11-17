FROM node:22-slim AS base
RUN npm install -g pnpm@9

FROM base AS dependencies
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /src
COPY . .
COPY --from=dependencies /src/node_modules ./node_modules
COPY --from=dependencies /src/apps/web/node_modules ./apps/web/node_modules

# 構建 Web - 直接在 apps/web 目錄中執行
WORKDIR /src/apps/web
RUN pnpm build

FROM base AS runtime
WORKDIR /app

# 複製 standalone 輸出
# standalone 模式會生成包含所有依賴的自包含目錄
COPY --from=build /src/apps/web/.next/standalone ./
# 複製靜態文件
COPY --from=build /src/apps/web/.next/static ./apps/web/.next/static
# 複製 public 文件
COPY --from=build /src/apps/web/public ./apps/web/public

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

EXPOSE 8080

# Next.js standalone server 位置
CMD ["node", "apps/web/server.js"]
