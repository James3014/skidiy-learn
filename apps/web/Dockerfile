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

# 構建 Web
WORKDIR /src
RUN pnpm --filter apps/web build

FROM base AS runtime
WORKDIR /app

COPY --from=build /src/apps/web/.next/standalone ./
COPY --from=build /src/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /src/apps/web/public ./apps/web/public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

WORKDIR /app/apps/web
CMD ["node", "server.js"]
