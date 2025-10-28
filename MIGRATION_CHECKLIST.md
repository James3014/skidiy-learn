# Migration Checklist - Copy Solution Back to Original Directory

## Overview

This solution can be copied back to your original directory (even with Chinese characters in the path) because all Prisma operations run inside the Linux Docker container.

## Files to Copy

Copy these files from `/tmp/diyski_ascii/` to your original project directory:

### Docker Configuration
- [ ] `Dockerfile.prisma`
- [ ] `docker-compose.yml` (modified - check diff before replacing)

### Scripts
- [ ] `scripts/prisma-docker.sh` (executable)
- [ ] `scripts/db-migrate.sh` (executable)
- [ ] `scripts/README.md` (new)

### Documentation
- [ ] `PRISMA_DOCKER_GUIDE.md`
- [ ] `SOLUTION_SUMMARY.md`
- [ ] `QUICK_START.md`
- [ ] `MIGRATION_CHECKLIST.md` (this file)

## Migration Steps

### 1. Backup Original Files

```bash
cd /path/to/original/diyski/評量
cp docker-compose.yml docker-compose.yml.backup
```

### 2. Copy Solution Files

```bash
# From the ASCII path
cd /tmp/diyski_ascii

# Copy to original directory (adjust path as needed)
ORIG_DIR="/Users/jameschen/Downloads/diyski/評量"

# Docker files
cp Dockerfile.prisma "$ORIG_DIR/"

# Scripts
cp scripts/prisma-docker.sh "$ORIG_DIR/scripts/"
cp scripts/db-migrate.sh "$ORIG_DIR/scripts/"
cp scripts/README.md "$ORIG_DIR/scripts/"
chmod +x "$ORIG_DIR/scripts/prisma-docker.sh"
chmod +x "$ORIG_DIR/scripts/db-migrate.sh"

# Documentation
cp PRISMA_DOCKER_GUIDE.md "$ORIG_DIR/"
cp SOLUTION_SUMMARY.md "$ORIG_DIR/"
cp QUICK_START.md "$ORIG_DIR/"
cp MIGRATION_CHECKLIST.md "$ORIG_DIR/"
```

### 3. Merge docker-compose.yml

**IMPORTANT:** Don't just copy `docker-compose.yml`, merge it carefully!

```bash
# View the differences
cd /tmp/diyski_ascii
diff docker-compose.yml "$ORIG_DIR/docker-compose.yml"
```

Add these sections to your original `docker-compose.yml`:

**New service:**
```yaml
  prisma-runner:
    build:
      context: .
      dockerfile: Dockerfile.prisma
    working_dir: /workspace
    environment:
      DATABASE_URL: postgresql://diyski:diyski@diyski-postgres-1:5432/diyski
    volumes:
      - .:/workspace
      - /workspace/node_modules
    networks:
      - diyski_default
```

**New network (at bottom):**
```yaml
networks:
  diyski_default:
    external: true
```

### 4. Update Script Paths (if needed)

If your container names are different, update these files:

**In `scripts/prisma-docker.sh`:**
- Line with `docker compose exec prisma-runner` might need container name adjustment

**In `scripts/db-migrate.sh`:**
- Should inherit from `prisma-docker.sh`, no changes needed

### 5. Test in Original Directory

```bash
cd /path/to/original/diyski/評量

# Build and start
docker compose build prisma-runner
docker compose up -d prisma-runner

# Install dependencies
docker exec <container-name> sh -c "cd /workspace && pnpm install"

# Test migration
./scripts/db-migrate.sh

# Or test generate
./scripts/prisma-docker.sh generate
```

### 6. Clean Up ASCII Directory (Optional)

Once verified working in original directory:

```bash
# Stop containers
cd /tmp/diyski_ascii
docker compose down

# Remove directory
cd /tmp
rm -rf diyski_ascii

# Clean up Docker
docker image prune -f
```

## Verification Checklist

After copying, verify:

- [ ] `docker compose build prisma-runner` succeeds
- [ ] `docker compose up -d prisma-runner` starts container
- [ ] `./scripts/prisma-docker.sh --version` shows Prisma version
- [ ] `./scripts/db-migrate.sh` runs without P1010 error
- [ ] Database tables are created/updated
- [ ] Scripts work from original path (with Chinese characters)

## Important Notes

1. **Network Name**: If your postgres container is on a different network, update the `networks` section in `docker-compose.yml`

2. **Container Names**: Use `docker ps` to check actual container names and update scripts if needed

3. **Database URL**: If your postgres credentials are different, update the `DATABASE_URL` in `docker-compose.yml`

4. **Git Considerations**: Add to `.gitignore` if not already:
   ```
   node_modules/
   .env
   ```

5. **Team Onboarding**: Share `QUICK_START.md` with team members

## Rollback Plan

If something goes wrong:

```bash
# Restore original docker-compose
cp docker-compose.yml.backup docker-compose.yml

# Remove added files
rm Dockerfile.prisma
rm scripts/prisma-docker.sh scripts/db-migrate.sh
rm PRISMA_DOCKER_GUIDE.md SOLUTION_SUMMARY.md QUICK_START.md

# Restart postgres only
docker compose down
docker compose up -d postgres
```

## Success Criteria

You'll know it's working when:
1. ✅ No P1010 errors when running migrations
2. ✅ Postgres logs show successful connections from prisma-runner
3. ✅ Tables are created in the database
4. ✅ Prisma Client is generated successfully
5. ✅ Works from directory with Chinese characters in path
