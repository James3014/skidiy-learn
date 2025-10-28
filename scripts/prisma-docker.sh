#!/bin/bash
# Helper script to run Prisma commands inside Docker container
# Usage: ./scripts/prisma-docker.sh <command>
# Examples:
#   ./scripts/prisma-docker.sh migrate dev
#   ./scripts/prisma-docker.sh generate
#   ./scripts/prisma-docker.sh db push

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Project name for docker-compose (required for paths with non-ASCII characters)
PROJECT_NAME="diyski"

# Check if docker-compose is running
if ! docker compose --project-name "$PROJECT_NAME" ps prisma-runner | grep -q "Up\|running"; then
    echo "Starting prisma-runner service..."
    docker compose --project-name "$PROJECT_NAME" up -d prisma-runner
    echo "Waiting for service to be ready..."
    sleep 3
fi

# Install dependencies if node_modules doesn't exist in container
if ! docker compose --project-name "$PROJECT_NAME" exec prisma-runner test -d /workspace/node_modules; then
    echo "Installing dependencies in container..."
    docker compose --project-name "$PROJECT_NAME" exec prisma-runner sh -c "cd /workspace && corepack enable && pnpm install"
fi

# Run the Prisma command
PRISMA_ARGS="$*"
echo "Running: prisma $PRISMA_ARGS"
docker compose --project-name "$PROJECT_NAME" exec -w /workspace/apps/api prisma-runner npx prisma $PRISMA_ARGS
