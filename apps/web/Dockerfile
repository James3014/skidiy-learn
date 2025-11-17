FROM node:22-slim AS base
RUN npm install -g pnpm@9

# Install dependencies only
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# Build Next.js app
WORKDIR /app/apps/web
RUN pnpm build && \
    echo "=== Build completed, checking output ===" && \
    ls -la .next/ && \
    echo "=== Checking standalone directory ===" && \
    ls -la .next/standalone/ || echo "standalone directory not found" && \
    echo "=== Checking for server.js ===" && \
    find .next/standalone -name "server.js" -type f || echo "server.js not found"

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public directory if it exists (optional)
RUN mkdir -p ./apps/web/public

USER nextjs

EXPOSE 8080

CMD ["sh", "-c", "echo '=== Runtime check ===' && ls -la && ls -la apps/web/ && echo '=== Starting server ===' && node apps/web/server.js"]
