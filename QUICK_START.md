# Quick Start - Prisma with Docker

## TL;DR

Prisma doesn't work directly on macOS due to a query engine bug. Use Docker instead.

## Common Commands

### Daily Development

```bash
# Apply existing migrations (non-interactive, safe for automation)
./scripts/db-deploy.sh

# Generate Prisma Client
./scripts/prisma-docker.sh generate

# Open Prisma Studio
./scripts/prisma-docker.sh studio

# Check migration status
./scripts/prisma-docker.sh migrate status
```

### Creating New Migrations (Interactive Only)

**IMPORTANT:** `migrate dev` requires interactive terminal. Use this workflow:

```bash
# 1. Enter the container interactively
docker compose exec -it prisma-runner sh

# 2. Navigate to API directory
cd /workspace/apps/api

# 3. Create migration
npx prisma migrate dev --name your_migration_name

# 4. Exit container
exit
```

### Other Commands

```bash
# Push schema without migration (for prototyping)
./scripts/prisma-docker.sh db push

# Reset database (WARNING: deletes all data)
./scripts/prisma-docker.sh migrate reset
```

## First Time Setup

```bash
# 1. Start postgres
docker compose up -d postgres

# 2. Build prisma runner
docker compose build prisma-runner
docker compose up -d prisma-runner

# 3. Install dependencies
docker exec diyski_ascii-prisma-runner-1 sh -c "cd /workspace && pnpm install"

# 4. Apply migrations
./scripts/db-deploy.sh
```

## Troubleshooting

**Container not running?**
```bash
docker compose up -d prisma-runner
```

**Dependencies missing?**
```bash
docker exec diyski_ascii-prisma-runner-1 sh -c "cd /workspace && pnpm install"
```

**Postgres not running?**
```bash
docker compose up -d postgres
```

**Need to reset everything?**
```bash
docker compose down
docker compose build prisma-runner
docker compose up -d postgres prisma-runner
```

## Full Documentation

- `PRISMA_DOCKER_GUIDE.md` - Complete guide
- `SOLUTION_SUMMARY.md` - Problem analysis and solution
- `scripts/README.md` - Script details
