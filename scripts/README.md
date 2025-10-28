# Scripts Directory

Helper scripts for the DIY Ski project.

## Prisma Docker Scripts

These scripts solve the macOS Prisma query engine bug (P1010 error) by running Prisma inside a Docker container.

### `db-deploy.sh` ⭐ **Recommended for Daily Use**

Apply existing migrations in non-interactive mode. Safe for automation and CI/CD.

```bash
./scripts/db-deploy.sh
```

**Use this when:**
- Pulling migrations from git
- Setting up development environment
- Deploying to production
- Running in CI/CD pipelines

### `db-migrate.sh` ⚠️ **Interactive Mode Required**

**WARNING:** This script will show a warning because `migrate dev` requires interactive terminal (TTY).

For creating NEW migrations, use the interactive workflow instead:

```bash
# Enter container
docker compose exec -it prisma-runner sh

# Create migration
cd /workspace/apps/api
npx prisma migrate dev --name your_migration_name

# Exit
exit
```

### `prisma-docker.sh`

General-purpose script for running any Prisma command in Docker.

```bash
# Generate Prisma Client
./scripts/prisma-docker.sh generate

# Push schema without migrations
./scripts/prisma-docker.sh db push

# Open Prisma Studio
./scripts/prisma-docker.sh studio

# Run migrations
./scripts/prisma-docker.sh migrate dev
./scripts/prisma-docker.sh migrate deploy
./scripts/prisma-docker.sh migrate reset

# Create new migration without applying
./scripts/prisma-docker.sh migrate dev --create-only
```

## How They Work

1. Check if `prisma-runner` Docker service is running
2. Start it if needed
3. Install dependencies if `node_modules` doesn't exist in container
4. Execute the Prisma command inside the container
5. Results are saved to your local workspace via volume mount

## Requirements

- Docker and Docker Compose installed
- Postgres container running (`diyski-postgres-1`)
- Project at `/tmp/diyski_ascii` (or update paths in scripts)

## See Also

- `../PRISMA_DOCKER_GUIDE.md` - Detailed guide and troubleshooting
- `../docker-compose.yml` - Service configuration
- `../Dockerfile.prisma` - Custom image definition
