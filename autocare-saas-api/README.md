# AutoCare Services API

Production-oriented, multi-tenant API for automotive service businesses. The first release provides tenant registration, JWT authentication, customer management, and tenant-isolated service history.

## Prerequisites

- Node.js 20.19.6 (use `nvm use 20.19.6`)
- Docker Desktop (for PostgreSQL)

## Run locally

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run prisma:generate
npm run prisma:deploy
npm run start:dev
```

The API is available at `http://localhost:3000/api/v1`; Swagger UI is at `http://localhost:3000/docs`.

## Useful commands

```bash
npm run lint:check
npm test
npm run build
npm run prisma:studio
```

## Authentication flow

1. `POST /api/v1/auth/register` creates a tenant and owner account.
2. `POST /api/v1/auth/login` returns an access token.
3. Send `Authorization: Bearer <accessToken>` on customer and service-history requests.

All protected data access is scoped to the `tenantId` carried by the verified JWT. Never accept tenant identity from client request bodies or query strings.
