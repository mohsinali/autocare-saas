# Frontend Architecture

## Folder structure

`src/app` contains routing and page composition. `src/features` owns feature-specific forms, hooks, and view components. Shared primitives live under `src/components/ui`; shared layout and presentational components live under `src/components/layout` and `src/components/common`. `src/services` is the sole HTTP boundary, while `src/providers`, `src/lib`, and `src/types` provide application infrastructure.

## Design principles

The interface prioritizes clarity, whitespace, keyboard access, responsive composition, and calm visual hierarchy. Blue is the actionable primary color; semantic success, warning, and danger colors are reserved for meaning. Theme variables and dark-mode classes support both themes from the first release.

## Component conventions

Use PascalCase component names and kebab-case filenames. Prefer focused, composable components with typed props. Route files compose features; they do not make HTTP calls. Shared UI components follow shadcn’s ownership model: copied into the repository and adapted locally.

## State management

TanStack Query owns server state, cache invalidation, and mutation lifecycles. React Hook Form owns transient form state. Local `useState` is limited to view state such as dialog visibility. Authentication session storage is centralized in `services/auth/session.ts`; no token is passed manually by individual features.

## API conventions

Axios is configured once in `services/api/client.ts`. Feature services return typed response data and are consumed via TanStack Query. The request interceptor adds the bearer token; a 401 clears the session and redirects to login. When refresh tokens are introduced by the backend, refresh handling belongs in this interceptor, with queued request replay.

## Form conventions

Every form uses a Zod schema, `zodResolver`, accessible labels, and field-level validation feedback. Mutations display outcome notifications and invalidate the smallest relevant query key.

## Styling and accessibility

Use Tailwind utility classes and shared design tokens; do not use inline styles. Interactive controls have visible focus treatment, semantic HTML, labelled icon buttons, sufficient contrast, and disabled-state semantics. Tables retain readable overflow behavior on small screens.

## Performance

Server data is cached with deliberate query keys and a sensible stale time. Pages only fetch their feature’s data. Use dynamic imports for future large charts/editors, stable callback props where profiling demonstrates a need, and Next image/font optimization for asset-heavy modules.

## Workspace Pattern

The application is organized around business workspaces rather than isolated CRUD modules.

Primary workspace:

Customer Workspace

Customer
    ├── Profile
    ├── Vehicles
    ├── Appointments
    └── Service History

Future workspaces may include:

Branch Workspace
Technician Workspace
Administration Workspace

A workspace owns the navigation flow for related business entities while backend modules remain independent.

Pages should guide users through business workflows instead of exposing unrelated CRUD screens.

## Future modules

Vehicles, appointments, invoices/billing, reports, notifications, tenant settings/RBAC, audit history, and AI voice-agent workflows should each be introduced as an independent feature with typed API services, query keys, forms, and route composition. Avoid cross-feature imports except through explicitly shared components or services.
