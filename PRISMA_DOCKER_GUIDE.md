# Prisma Docker Workflow Guide

## Problem

On macOS, Prisma's query engine has a known bug (P1010 error) where it denies database access even when credentials and permissions are correct. The error appears before any actual database connection is attempted.

## Solution

Run all Prisma commands inside a Docker container with a Linux environment, which bypasses the macOS-specific query engine bug.

## Setup

The project includes:

1. **Dockerfile.prisma** - Custom Node.js Alpine image with OpenSSL (required for Prisma)
2. **docker-compose.yml** - `prisma-runner` service configured to connect to postgres
3. **Helper scripts** in `scripts/` directory for convenience

## Usage

### Apply Existing Migrations (Recommended for Daily Use)

```bash
./scripts/db-deploy.sh
```

This automatically:
- Starts the prisma-runner container if needed
- Installs dependencies
- Runs `prisma migrate deploy` (non-interactive, safe for CI/CD)

**Use this for:** Applying existing migrations from git repository

### Creating New Migrations (Interactive Mode Required)

**IMPORTANT:** `prisma migrate dev` requires an interactive terminal (TTY). The wrapper script cannot provide this.

**Workflow for creating new migrations:**

```bash
# 1. Enter container interactively
docker compose exec -it prisma-runner sh

# 2. Navigate to API directory
cd /workspace/apps/api

# 3. Edit your schema if needed
# vim prisma/schema.prisma

# 4. Create migration
npx prisma migrate dev --name add_new_feature

# 5. Exit container
exit

# 6. Commit the new migration files
git add apps/api/prisma/migrations
git commit -m "Add migration: add_new_feature"
```

**Why this is necessary:** Prisma's `migrate dev` checks for `stdin.isTTY` and refuses to run in non-interactive environments to prevent accidental data loss.

### Other Prisma Commands (Non-Interactive)

```bash
# Generate Prisma Client
./scripts/prisma-docker.sh generate

# Push schema without migration (prototyping only)
./scripts/prisma-docker.sh db push

# Open Prisma Studio
./scripts/prisma-docker.sh studio

# Check migration status
./scripts/prisma-docker.sh migrate status

# Apply migrations (production-safe)
./scripts/db-deploy.sh
```

### Direct Docker Exec (Advanced)

```bash
# Start the container
docker compose up -d prisma-runner

# Install dependencies (first time only)
docker exec diyski_ascii-prisma-runner-1 sh -c "cd /workspace && pnpm install"

# Run Prisma commands
docker exec diyski_ascii-prisma-runner-1 sh -c "cd /workspace/apps/api && pnpm prisma migrate dev"
docker exec diyski_ascii-prisma-runner-1 sh -c "cd /workspace/apps/api && pnpm prisma generate"
```

## How It Works

1. **Custom Docker Image**: Built from `Dockerfile.prisma` with OpenSSL pre-installed
2. **Network Configuration**: Connects to existing postgres container via `diyski_default` network
3. **Volume Mount**: Your workspace is mounted to `/workspace` in the container
4. **Database URL**: Points to `diyski-postgres-1:5432` (container-to-container networking)

## Key Files

- `Dockerfile.prisma` - Base image with OpenSSL
- `docker-compose.yml` - prisma-runner service definition
- `scripts/prisma-docker.sh` - General-purpose Prisma command wrapper
- `scripts/db-migrate.sh` - Quick migration shortcut
- `apps/api/prisma/schema.prisma` - Your Prisma schema

## Database Reset and Clean Setup

### When You Need a Clean Database

If you encounter migration conflicts (e.g., `P3018: type "SportType" already exists`), you need to reset the database.

### Option 1: Drop and Recreate Schema (Recommended)

```bash
# 1. Connect to postgres
docker exec -it diyski-postgres-1 psql -U diyski -d diyski

# 2. In psql, run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO diyski;
GRANT ALL ON SCHEMA public TO public;
\q

# 3. Apply all migrations from scratch
./scripts/db-deploy.sh
```

### Option 2: Delete Docker Volume (Nuclear Option)

**WARNING:** This deletes ALL data in postgres, including other databases.

```bash
# 1. Stop all containers using postgres
cd /Users/jameschen/Downloads/diyski/評量  # or original project path
docker compose down

# 2. Remove volume
docker volume rm diyski_pgdata

# 3. Restart postgres
docker compose up -d postgres

# 4. Wait for postgres to initialize
sleep 5

# 5. Apply migrations in ASCII path
cd /tmp/diyski_ascii
./scripts/db-deploy.sh
```

### Option 3: Use Prisma's Reset (Loses All Data)

```bash
# This will:
# - Drop database
# - Recreate database
# - Apply all migrations
# - Run seed script (if configured)
./scripts/prisma-docker.sh migrate reset
```

### After Reset: Seed Data

If you need to restore data after reset:

```bash
# Option 1: Manual SQL file
docker exec -i diyski-postgres-1 psql -U diyski -d diyski < manual-seed.sql

# Option 2: Prisma seed (if configured in package.json)
./scripts/prisma-docker.sh db seed

# Option 3: Import from CSV/JSON
# (Use your existing Python scripts or write custom seed.ts)
```

## Troubleshooting

### Container won't start

```bash
docker compose down
docker compose build prisma-runner
docker compose up -d prisma-runner
```

### Dependencies not found

```bash
docker exec diyski_ascii-prisma-runner-1 sh -c "cd /workspace && pnpm install"
```

### Database connection failed

Ensure the postgres container is running:

```bash
docker ps | grep postgres
# Should show diyski-postgres-1 running

# If not running, start it
cd /path/to/original/diyski
docker compose up -d postgres
```

### Check logs

```bash
docker logs diyski_ascii-prisma-runner-1
docker logs diyski-postgres-1
```

## Migration Workflow

1. Edit `apps/api/prisma/schema.prisma`
2. Run `./scripts/db-migrate.sh` or `./scripts/prisma-docker.sh migrate dev`
3. Commit the new migration files in `apps/api/prisma/migrations/`
4. Team members can run the same script to apply migrations

## Note on Original vs ASCII Path

This guide assumes you're working in `/tmp/diyski_ascii`. If you move the project back to the original path with Chinese characters, the Docker approach will still work since everything runs inside the Linux container.
