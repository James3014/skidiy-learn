# OpenAPI Documentation

This API provides comprehensive OpenAPI/Swagger documentation.

## Accessing the Documentation

### Swagger UI (Interactive)
When the server is running, visit:
```
http://localhost:3000/api-docs
```

This provides an interactive interface where you can:
- Browse all API endpoints organized by tags
- See request/response schemas
- Test endpoints directly with the "Try it out" feature
- Authenticate using JWT Bearer tokens

### OpenAPI JSON Specification
The OpenAPI spec is automatically generated when the server starts and written to:
```
apps/api/openapi.json
```

You can also access it via HTTP when the server is running:
```
GET http://localhost:3000/api-docs-json
```

## API Structure

The API is organized into the following modules:

### `lessons` Tag
- `GET /api/v1/lessons` - List lessons with optional filters
- `POST /api/v1/lessons` - Create a new lesson with seats
- `GET /api/v1/lessons/:id` - Get lesson details by ID
- `GET /api/v1/lessons/:id/seats` - Get seats for a lesson

### `invitations` Tag
- `GET /api/v1/invitations/:code` - Verify invitation code validity
- `POST /api/v1/invitations/claim` - Claim a seat using invitation code
- `POST /api/v1/invitations/:code/identity` - Submit identity form before claiming

### `lesson-records` Tag
- `GET /api/v1/lesson-records/private` - List private lesson records
- `GET /api/v1/lesson-records/shared` - List shared lesson records
- `POST /api/v1/lesson-records` - Create a new lesson record
- `POST /api/v1/lesson-records/:detailId/analyses/reorder` - Reorder analysis items
- `POST /api/v1/lesson-records/:detailId/practices/reorder` - Reorder practice items
- `POST /api/v1/lesson-records/ratings` - Create coach ability ratings
- `GET /api/v1/lesson-records/students/:mappingId/latest-ratings` - Get latest student ratings

### `sharing` Tag
- `PATCH /api/v1/sharing/details/:detailId/visibility` - Update share visibility
- `GET /api/v1/sharing/records` - Query shared teaching records with filters

## Authentication

Most endpoints require JWT Bearer token authentication:

1. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

2. In Swagger UI, click the "Authorize" button and enter your token

3. Tokens are valid for 7 days

## Role-Based Access Control

Endpoints are protected by role requirements:
- `instructor` - Teaching staff with lesson recording capabilities
- `admin` - Administrative users with elevated permissions

See individual endpoint documentation for specific role requirements.

## Rate Limiting

Some endpoints have rate limiting:
- `GET /api/v1/sharing/records` - 30 requests per minute per user

## Development

To start the server with OpenAPI enabled:

```bash
# Development mode
pnpm --filter apps-api start:dev

# Production mode
pnpm --filter apps-api build
pnpm --filter apps-api start
```

Then access the Swagger UI at `http://localhost:3000/api-docs`
