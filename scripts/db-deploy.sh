#!/bin/bash
# Apply existing migrations in non-interactive mode (for CI/CD and deployment)
# This script uses "migrate deploy" which is safe for production

exec "$(dirname "$0")/prisma-docker.sh" migrate deploy "$@"
