#!/bin/bash
# WARNING: "migrate dev" requires interactive mode
#
# For creating NEW migrations, you must run interactively:
#   docker compose exec -it prisma-runner sh
#   cd /workspace/apps/api
#   npx prisma migrate dev --name your_migration_name
#
# For applying EXISTING migrations, use:
#   ./scripts/db-deploy.sh
#
# This script will fail with "MigrateDevEnvNonInteractiveError"

echo "⚠️  WARNING: migrate dev requires interactive terminal"
echo "Please use one of these instead:"
echo ""
echo "  1. To apply existing migrations (recommended):"
echo "     ./scripts/db-deploy.sh"
echo ""
echo "  2. To create new migration (interactive):"
echo "     docker compose exec -it prisma-runner sh"
echo "     cd /workspace/apps/api"
echo "     npx prisma migrate dev --name your_migration_name"
echo ""
read -p "Continue anyway? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

exec "$(dirname "$0")/prisma-docker.sh" migrate dev "$@"
