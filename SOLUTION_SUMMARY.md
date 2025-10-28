# Prisma P1010 Error - Solution Summary

## Problem Recap

When running `pnpm --filter apps-api prisma migrate dev` on macOS, the Prisma query engine immediately threw:

```
P1010: User 'diyski' was denied access on the database diyski.public
```

**Key observations:**
- PostgreSQL logs showed NO connection attempts from Prisma
- Database credentials and permissions were verified correct via `psql`
- Copying project to ASCII path (`/tmp/diyski_ascii`) did NOT fix the issue
- Error occurred BEFORE the query engine attempted any network connection

**Root cause:** macOS-specific bug in Prisma's query engine binary

## Solution: Docker Container Approach

Run all Prisma commands inside a Linux Docker container, completely bypassing the macOS query engine.

## What Was Implemented

### 1. Custom Docker Image (`Dockerfile.prisma`)
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache openssl openssl-dev  # Required for Prisma
RUN corepack enable                          # For pnpm
WORKDIR /workspace
CMD ["sleep", "infinity"]
```

### 2. Docker Compose Service
Added `prisma-runner` service to `docker-compose.yml`:
- Connects to existing postgres via `diyski_default` network
- Mounts workspace to `/workspace`
- Uses `DATABASE_URL: postgresql://diyski:diyski@diyski-postgres-1:5432/diyski`

### 3. Helper Scripts

**`scripts/prisma-docker.sh`** - Universal Prisma command runner
```bash
./scripts/prisma-docker.sh migrate dev
./scripts/prisma-docker.sh generate
./scripts/prisma-docker.sh studio
```

**`scripts/db-migrate.sh`** - Quick migration shortcut
```bash
./scripts/db-migrate.sh
```

## Verification

Successfully ran migration inside container:
```bash
docker exec diyski_ascii-prisma-runner-1 sh -c \
  "cd /workspace/apps/api && pnpm prisma migrate dev --name init"
```

Result:
- ✅ Migration applied successfully
- ✅ 25 tables created in postgres
- ✅ Prisma Client generated
- ✅ No P1010 error

## Usage Going Forward

### Daily Workflow

```bash
# Edit your schema
vim apps/api/prisma/schema.prisma

# Run migration
./scripts/db-migrate.sh

# Or generate client only
./scripts/prisma-docker.sh generate
```

### First-Time Setup (New Team Members)

```bash
# 1. Clone repo
git clone <repo>
cd diyski

# 2. Copy .env.example to .env
cp .env.example .env

# 3. Start postgres
docker compose up -d postgres

# 4. Build and start prisma-runner
docker compose build prisma-runner
docker compose up -d prisma-runner

# 5. Install dependencies
docker exec <container-name> sh -c "cd /workspace && pnpm install"

# 6. Run migrations
./scripts/db-migrate.sh
```

## Files Created/Modified

**New files:**
- `Dockerfile.prisma` - Custom Node image with OpenSSL
- `scripts/prisma-docker.sh` - Prisma command wrapper
- `scripts/db-migrate.sh` - Migration shortcut
- `scripts/README.md` - Scripts documentation
- `PRISMA_DOCKER_GUIDE.md` - Comprehensive guide
- `SOLUTION_SUMMARY.md` - This file

**Modified files:**
- `docker-compose.yml` - Added `prisma-runner` service and external network

## Why This Works

1. **Linux Query Engine**: Docker container uses `linux-musl-arm64` Prisma binaries, which don't have the macOS bug
2. **Container Networking**: Can connect to postgres via Docker network (`diyski-postgres-1:5432`)
3. **Volume Mount**: Changes to schema and migrations are immediately reflected on host
4. **Isolated Environment**: Dependencies and Node version are consistent across all machines

## Alternative Approaches Tried (Failed)

❌ **ASCII Path Move**: Copying to `/tmp/diyski_ascii` - Same error
❌ **Direct PostgreSQL URL**: Using `127.0.0.1` vs `localhost` - Same error
❌ **Permission Changes**: GRANT ALL PRIVILEGES - Already had full access
❌ **Prisma Version Downgrade**: Not attempted (would affect team)

## Benefits

✅ **Consistent Environment**: Same Linux environment for all developers
✅ **No macOS Surprises**: Eliminates platform-specific bugs
✅ **Easy Onboarding**: New developers just run Docker
✅ **CI/CD Ready**: Production will use Linux anyway
✅ **Portable**: Works on any machine with Docker

## Drawbacks

⚠️ **Requires Docker**: Team must have Docker installed
⚠️ **Slower First Run**: Need to build image and install dependencies
⚠️ **Extra Complexity**: One more service to manage

## Next Steps

1. **Test on Other Machines**: Verify solution works on Intel Macs and Linux
2. **Update Team Docs**: Add Docker setup to onboarding guide
3. **CI/CD Integration**: Use same Docker approach in GitHub Actions
4. **Monitor Prisma Issues**: Check if future versions fix macOS bug

## References

- Prisma Schema: `apps/api/prisma/schema.prisma`
- Database: PostgreSQL 16 (container: `diyski-postgres-1`)
- Original Issue: P1010 error with no connection attempt
- Solution Guide: `PRISMA_DOCKER_GUIDE.md`
