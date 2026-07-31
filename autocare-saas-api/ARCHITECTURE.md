# Architecture

## Project vision

AutoCare Services is a dependable multi-tenant SaaS platform for automotive workshops. It will bring customers, vehicles, work history, scheduling, billing, communications, reporting, and assisted voice workflows into one secure operational system.

## Architecture decisions

- NestJS modules are the application boundary: each capability owns its controller, service, DTOs, and repository where persistence queries merit isolation.
- Prisma is the database access layer. The schema is the source of truth and PostgreSQL enforces relational integrity.
- Tenancy is row-based. Every tenant-owned query includes `tenantId`; the JWT is the sole source of the current tenant context.
- JWT bearer authentication is global by default. `@Public()` must be deliberately applied to unauthenticated endpoints.
- DTOs validate and transform input at the HTTP boundary. Domain/application services receive validated data only.
- Controllers remain thin; services own use-case orchestration; repositories encapsulate non-trivial data access.
- Pino HTTP logging and one global exception filter provide consistent observability and error envelopes.

## Coding standards

- TypeScript strict mode is mandatory. Prefer explicit return types on exported functions.
- Validate all external input with `class-validator`; use whitelisting and reject unknown fields.
- Keep units small, deterministic, and independently testable through dependency injection.
- Do not expose password hashes, secrets, or cross-tenant records.
- Add database indexes for tenant-scoped access paths and migrations for every schema change.

## Naming conventions

- Files: kebab-case with Nest suffixes (`customers.service.ts`, `create-customer.dto.ts`).
- Classes: PascalCase. Variables/functions: camelCase. Database columns: camelCase through Prisma.
- REST resources are plural nouns; commands use HTTP verbs rather than action-heavy routes.
- IDs are UUIDs. Tenant IDs must be carried in repository method signatures for tenant-owned data.

## Folder structure

```
src/
  auth/             authentication, JWT strategy, DTOs
  customers/        customer use cases and persistence adapter
  service-history/  completed-service use cases and persistence adapter
  common/           cross-cutting decorators and exception handling
  prisma/           database client lifecycle
  app.module.ts     composition root
prisma/schema.prisma database schema
```

## Design principles

- Security and tenant isolation are defaults, not opt-in behavior.
- Use the simplest abstraction that protects a stable boundary; avoid generic repository layers and speculative domain frameworks.
- Prefer clear transactional data integrity over application-only conventions.
- API contracts are documented with Swagger and versioned under `/api/v1`.
- Optimize for evolvability: modules can gain policies, RBAC guards, events, and integrations without rewriting adjacent capabilities.

## Future roadmap

1. Vehicle management and appointment scheduling with conflict detection.
2. RBAC permissions, invitations, refresh-token rotation, password reset, and audit logs.
3. Subscription billing, tenant plans, metering, and webhook processing.
4. Notifications, dashboards, reporting read models, and background jobs.
5. AI voice agents with consent controls, recordings, transcripts, and human handoff.
6. Operational hardening: health checks, metrics/tracing, rate limiting, backups, CI/CD, and row-level security evaluation.
