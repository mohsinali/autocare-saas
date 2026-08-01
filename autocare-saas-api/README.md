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

## Vehicle migration recovery

If `20260731000100_add_vehicles_and_refactor_service_history` was previously recorded as failed, first update your working copy, then mark only that failed migration as rolled back and re-deploy:

```bash
npx prisma migrate resolve --rolled-back 20260731000100_add_vehicles_and_refactor_service_history
npm run prisma:deploy
```

The migration preserves historical service-history rows that predate vehicles. Such rows have no trustworthy vehicle identity and must be mapped to a real vehicle through a deliberate data-remediation process before they can participate in vehicle-scoped history.

## Authentication flow

1. `POST /api/v1/auth/register` creates a tenant and owner account.
2. `POST /api/v1/auth/login` returns an access token.
3. Send `Authorization: Bearer <accessToken>` on customer and service-history requests.

All protected data access is scoped to the `tenantId` carried by the verified JWT. Never accept tenant identity from client request bodies or query strings.
