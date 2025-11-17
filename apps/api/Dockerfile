FROM node:22-slim AS base
RUN npm install -g pnpm@9
RUN apt-get update -y && apt-get install -y openssl

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
COPY --from=dependencies /src/apps/api/node_modules ./apps/api/node_modules

# 生成 Prisma Client
WORKDIR /src/apps/api
RUN pnpm prisma:generate

# 構建 API
WORKDIR /src
RUN pnpm --filter apps/api build

FROM base AS runtime
WORKDIR /src

COPY --from=build /src/apps/api/dist ./apps/api/dist
COPY --from=build /src/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /src/apps/api/package.json ./apps/api/
COPY --from=build /src/apps/api/prisma ./apps/api/prisma
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/package.json ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# 啟動前執行數據庫遷移
WORKDIR /src/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
