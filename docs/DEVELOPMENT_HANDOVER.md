# Dragonhold — Comprehensive Development Handover Document

> **Document Version**: 1.0.0  
> **Date**: November 13, 2026 (09:26 ICT)  
> **Repository**: `SaktiArifDwiPutra/Dragonhold`  
> **Active Working Branch**: `feat/vercel-api-integration`  
> **Status**: Verified & Ready for Next Development Session  

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Implementation Status](#3-implementation-status)
4. [Database & Schema Architecture](#4-database--schema-architecture)
5. [Authentication & Security](#5-authentication--security)
6. [Deployment & Infrastructure](#6-deployment--infrastructure)
7. [Recent Development History](#7-recent-development-history)
8. [Pending Tasks & Roadmap](#8-pending-tasks--roadmap)
9. [Development Guidelines & Constraints for Future Agents](#9-development-guidelines--constraints-for-future-agents)
10. [Current Repository State & Immediate Next Steps](#10-current-project-state--next-steps)

---

## 1. Project Overview

### Concept & Purpose
**Dragonhold** is a political fantasy community platform and civic digital realm set in the world of **Aetherial**. Humanity is rebuilding in the aftermath of a devastating war against dragons. The High Throne of Dragonhold sits vacant in an interregnum era, and the realm's history and royal chronicles are waiting to be written by its citizens.

The platform combines rich medieval fantasy tactile lore with modern civic interaction:
- Authenticated citizens are enlisted into the kingdom registry and awarded an official **Citizen Pass** with an authentic sequential Citizen ID (e.g., `DH-000001`).
- Citizens participate in Kingdom governance through democratic assemblies: **Leadership Elections** and **Kingdom Decisions**.
- The administration operates as the High Council / Sovereign Crown, managing public proclamations, platform telemetry, citizen registries, and manual lifecycle control over kingdom ballots.

### Intended User Experience & Philosophy
1. **Ground in Backend Reality**: No fabricated metrics, dummy population numbers ("4,812 Souls"), or fake vote tally indicators. Every statistic displayed on the dashboard, admin console, or voting booths is calculated directly from PostgreSQL data.
2. **Tactile Dark Fantasy Editorial Aesthetics ("The Living Kingdom Archive")**:
   - High-contrast medieval archival design: Obsidian stone base (`#0a0e18`), sovereign antique gold (`#c8a253`, `#eac16e`), seal crimson (`#8a2525`), and tactile aged parchment (`#f4ebd0` with `#1f1d1a` iron gall ink) reserved strictly for authentic documents (Citizen Pass and royal proclamations).
   - Strict 3-font typography: `Lora` (monumental serif headings), `Inter` (clean UI body), and `JetBrains_Mono` (Citizen IDs, telemetry, status badges).
   - Mobile-first ergonomics: 48px minimum touch targets and safe-area insets (`env(safe-area-inset-bottom)`).

---

## 2. Technical Architecture

### Technology Stack & Versions
- **Runtime & Workspace**: Node.js `>=20`, `pnpm@9.15.0` with pnpm monorepo workspaces (`pnpm-workspace.yaml`).
- **Frontend Web (`apps/web`)**: Next.js `16.4.5` (App Router, Turbopack), React `19.3.1`, Tailwind CSS `v4.3.4` (using `@tailwindcss/postcss`), TypeScript `5.9.3`.
- **Backend API (`apps/api`)**: Hono `4.6.14` with `@hono/node-server` `1.13.7` and `@hono/zod-validator` `0.4.2`, Drizzle ORM `0.38.0`, Zod `3.24.1`, `@node-rs/argon2` `2.0.2`, TypeScript `5.7.0`.
- **Database Layer (`packages/db`)**: Neon PostgreSQL (serverless connection pooling via `postgres` `3.4.5`), Drizzle ORM `0.38.0`, Drizzle Kit `0.30.0`.
- **Shared Validation & Types (`packages/shared`)**: Shared Zod schemas, auth schemas, and voting types consumed across frontend and backend.
- **Hosting**:
  - Web & Serverless API: **Vercel** (`apps/web`).
  - Database: **Neon PostgreSQL** (`-pooler.neon.tech`).

### Monorepo Structure & Package Responsibilities
```text
Dragonhold/
├── apps/
│   ├── api/          # Standalone Hono app + exports createApp() for Next.js catch-all route
│   │   ├── src/
│   │   │   ├── app.ts                 # Hono app factory, CORS, Origin Guard, route mounting
│   │   │   ├── env.ts                 # Environment validation via Zod
│   │   │   ├── lib/                   # Session hashing, IP extraction, voting repository store
│   │   │   ├── middleware/            # Auth, Origin Guard, Rate Limiting
│   │   │   ├── routes/                # auth, announcements, admin, voting, admin-voting
│   │   │   └── types.ts               # AppEnv, AuthContext, AppConfig
│   └── web/          # Next.js App Router frontend + Serverless catch-all API route
│       └── src/
│           ├── app/
│           │   ├── admin/             # Platform Overview & User Monitoring
│           │   │   └── voting/        # Admin Voting Management Console
│           │   ├── api/[[...route]]/  # Next.js catch-all API route invoking Hono createApp()
│           │   ├── dashboard/         # Citizen Kingdom Hall & Citizen Pass
│           │   ├── login/             # Citizen sign-in
│           │   ├── register/          # Enlistment page (public registration currently locked)
│           │   ├── voting/            # Public Voting Hall (Active & Published Decree view)
│           │   │   ├── [id]/          # Detailed ballot view & sealed vote submission
│           │   │   └── archive/       # Permanent Voting Archive
│           │   ├── layout.tsx         # Root layout with fonts, AuthProvider, Header, Footer
│           │   └── page.tsx           # Cinematic landing page
│           ├── components/            # Header, Footer, Emblem, UI primitives (Button, Panel, Field, Alert)
│           └── lib/api.ts             # Client fetch helper and ApiError code mapping
├── packages/
│   ├── db/           # Drizzle ORM schema, migrations, connection client, and seed script
│   │   ├── drizzle/                   # SQL migration files (0000, 0001, 0002) and snapshots
│   │   └── src/
│   │       ├── client.ts              # Neon postgres connection factory
│   │       ├── schema/                # users, kingdoms, citizens, sessions, announcements, audit-logs, polls, enums
│   │       └── seed.ts                # Production-grade atomic seed script with conflict validation
│   └── shared/       # Shared Zod validation schemas (auth, citizen, voting)
├── docs/             # Operational, design, and deployment specifications
├── DESIGN.md         # Living Kingdom Archive design system specifications
└── package.json      # Monorepo root scripts (test, typecheck, db:generate, db:migrate, db:seed)
```

### Component Interaction Architecture
1. **Unified Vercel Serverless Execution**:
   - `apps/web/src/app/api/[[...route]]/route.ts` imports `createApp` from `@dragonhold/api` and `createDb` from `@dragonhold/db`.
   - Every API request to `/api/*` is handled in-process by Hono inside Next.js Node.js serverless functions on Vercel.
   - Eliminates external microservice hosting dependencies (no separate VPS, container, Redis, or queue is needed).
   - If standalone deployment is desired in the future, `apps/api/src/index.ts` remains available with Dockerfile support.
2. **Database Access**:
   - Uses Neon PostgreSQL connection pooling via `DATABASE_URL` (`sslmode=require`).
   - Transactions are executed with `db.transaction()` for atomic multi-table writes (e.g., user + citizen creation, voting tally + vote submission).
3. **Session Transport**:
   - Standard HttpOnly, Secure, SameSite=Lax cookie named `dh_session`.
   - Browser client sends credentials automatically on same-origin calls (`/api/...`).

---

## 3. Implementation Status

### Completed and Fully Verified ✅
1. **Core Database Schema & Migrations**:
   - Kingdoms, users, citizens, sessions, announcements, audit logs (`0000_married_screwball.sql`, `0001_daffy_patriot.sql`).
   - Full Voting & Kingdom Decision schema (`0002_voting_system.sql`).
2. **Production-Hardened Seed Engine (`packages/db/src/seed.ts`)**:
   - Validates all environment variables before running any queries.
   - Performs pre-flight conflict verification on admin username, email, and Citizen ID `DH-000001` *before* creating or modifying any database records.
   - Executes kingdom and super-admin user creation in an atomic database transaction.
   - Argon2id password hash parity verified with auth route.
   - Safe `try/finally` connection closing.
   - Tested and verified with 9 comprehensive test cases in `packages/db/src/seed.test.ts`.
3. **Authentication & Session Lifecycle**:
   - Argon2id password hashing (`@node-rs/argon2`).
   - Session issuance, validation, and deletion with SHA-256 token hashing (`sessions.tokenHash`).
   - Session context injection (`requireAuth`, `optionalAuth`) retrieving User and Citizen status.
   - Suspended user immediate revocation.
4. **Registration Security Lock**:
   - Public registration safely disabled (`403 REGISTRATION_DISABLED`).
   - Existing users can log in normally.
   - Beta code evaluation retained in codebase if private beta testing is re-enabled.
5. **Origin Guard & CORS**:
   - Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require an authorized origin matching `WEB_ORIGIN` or Vercel preview environments (`VERCEL_URL`, `VERCEL_BRANCH_URL`).
   - Non-mutating read requests and same-origin browser fetches pass cleanly.
6. **Admin Monitoring Console (`/admin`)**:
   - Live telemetry: registered users, active sessions, enlisted citizens, proclamations, audit events.
   - Paginated user list with role filtering (`SUPER_ADMIN`, `ADMIN`, `CITIZEN`) and status filtering (`ACTIVE`, `SUSPENDED`).
   - Audit trail logging and target inspection.
7. **Complete Voting & Kingdom Decision System**:
   - **Both Voting Types Supported**: `LEADERSHIP_ELECTION` (candidates with photos/background) and `KINGDOM_DECISION` (policies/decisions) on a unified database engine.
   - **Strict Lifecycle State Machine**:
     - Status: `DRAFT` ➔ `ACTIVE` ➔ `CLOSED` (or `CANCELLED`).
     - Results Visibility: `HIDDEN` ➔ `PUBLISHED` ➔ `ARCHIVED` (can republish).
     - Manual admin controls only: closing voting does NOT publish results; publishing does NOT reopen voting; withdrawing archives results without data loss; republishing reuses original results.
   - **Sealed Ballot Confidentiality & Integrity**:
     - Individual citizen votes are confidential (no voter-to-option association exposed in public or admin inspection views).
     - Live vote counts and intermediate percentages are strictly hidden during active voting and closed-hidden states.
     - One citizen = one vote enforced by unique database constraint `(poll_id, citizen_id)` and transaction integrity.
     - Votes cannot be altered or deleted once submitted.
     - Option modification locked once voting is `ACTIVE`.
   - **Admin Management Console (`/admin/voting`)**:
     - System overview metrics (total sessions, drafts, active, closed, published, archived, total votes).
     - Filterable session table (`ALL`, `DRAFT`, `ACTIVE`, `CLOSED`, `PUBLISHED`, `ARCHIVED`).
     - Draft creation wizard with multi-option / candidate builder.
     - Lifecycle transition buttons with explicit confirmation dialogs.
     - Aggregate result inspection and session audit history.
   - **Public Citizen Voting Interface**:
     - `/voting`: Overview of active voting sessions and pinned official result decrees.
     - `/voting/[id]`: Interactive voting chamber (candidate profiles, option selection, single-vote submission with modal confirmation, sealed ballot notification, and official result breakdown when published).
     - `/voting/archive`: Permanent chronicle of all published and archived election and decision decrees with type filtering and pagination.
     - Navigation: Integrated into `SiteHeader`, `SiteFooter`, and `Dashboard`.
   - **Automated Verification**:
     - 26 tests passing in `apps/api/src/routes/voting.test.ts`.

### Currently in Progress ⏳
- **Neon Production Database Execution**: Running migration `0002_voting_system.sql` and `pnpm db:seed` against the live Neon Production database (ready for execution, pending user's go-ahead).

### Planned but Not Yet Implemented 📋
- **Citizen Onboarding V2**: Re-opening registration via cryptographic invite links, council vouches, or invite tokens.
- **Kingdom Chronicles Engine**: Dynamic lore episodes recording the outcomes of historical votes into persistent story chapters.
- **Council Voting / Weighted Ballots**: Advanced voting tiers (e.g., Council of Nobles vs Common Assembly).

### Implemented but Requiring Verification in Production ⚠️
- Migration `0002_voting_system.sql` must be applied to Neon Production with `pnpm db:migrate`.
- The hardened seed script must be run against Neon Production with `pnpm db:seed`.
- Super Admin login must be verified on live production (`https://dragonhold.my.id/login`) after seed completion.

---

## 4. Database & Schema Architecture

### Schema Tables (`packages/db/src/schema/`)
1. **`kingdoms`**:
   - `id`: `uuid` PK.
   - `name`: `varchar(64)` Unique (e.g., `"Dragonhold"`).
   - `description`: `text`.
   - `status`: `varchar(32)` (e.g., `"NEWLY_ESTABLISHED"`).
   - `createdAt`, `updatedAt`: `timestamp with time zone`.
2. **`users`**:
   - `id`: `uuid` PK.
   - `username`: `varchar(32)` Unique.
   - `email`: `varchar(255)` Unique.
   - `passwordHash`: `varchar(255)` (Argon2id).
   - `role`: `user_role` enum (`"SUPER_ADMIN"`, `"ADMIN"`, `"CITIZEN"`).
   - `status`: `user_status` enum (`"ACTIVE"`, `"SUSPENDED"`).
   - `createdAt`, `updatedAt`: `timestamp with time zone`.
3. **`citizens`**:
   - `id`: `uuid` PK.
   - `userId`: `uuid` FK -> `users.id` (CASCADE) Unique.
   - `kingdomId`: `uuid` FK -> `kingdoms.id` (RESTRICT).
   - `citizenCode`: `varchar(32)` Unique (Sequential zero-padded format: `DH-000001`).
   - `characterName`: `varchar(64)`.
   - `status`: `citizen_status` enum (`"ACTIVE"`, `"INACTIVE"`, `"SUSPENDED"`).
   - `joinedAt`: `timestamp with time zone`.
4. **`sessions`**:
   - `id`: `uuid` PK.
   - `userId`: `uuid` FK -> `users.id` (CASCADE).
   - `tokenHash`: `varchar(64)` Unique (SHA-256 hash of random session token).
   - `expiresAt`: `timestamp with time zone`.
   - `ipAddress`: `varchar(45)`.
   - `userAgent`: `text`.
   - `createdAt`: `timestamp with time zone`.
5. **`announcements`**:
   - `id`: `uuid` PK.
   - `title`: `varchar(128)`.
   - `content`: `text`.
   - `category`: `announcement_category` enum (`"GENERAL"`, `"KINGDOM_UPDATE"`, `"LORE"`, `"MAINTENANCE"`).
   - `authorId`: `uuid` FK -> `users.id`.
   - `status`: `announcement_status` enum (`"DRAFT"`, `"PUBLISHED"`, `"ARCHIVED"`).
   - `publishedAt`, `createdAt`, `updatedAt`: `timestamp with time zone`.
6. **`audit_logs`**:
   - `id`: `uuid` PK.
   - `actorId`: `uuid` FK -> `users.id` (SET NULL).
   - `action`: `varchar(64)`.
   - `targetType`: `varchar(32)`.
   - `targetId`: `uuid`.
   - `metadata`: `jsonb`.
   - `ipAddress`: `varchar(45)`.
   - `createdAt`: `timestamp with time zone`.
7. **`polls`**:
   - `id`: `uuid` PK.
   - `title`: `varchar(160)` NOT NULL.
   - `description`: `text` NOT NULL.
   - `type`: `poll_type` enum (`"LEADERSHIP_ELECTION"`, `"KINGDOM_DECISION"`).
   - `status`: `poll_status` enum (`"DRAFT"`, `"ACTIVE"`, `"CLOSED"`, `"CANCELLED"`).
   - `resultsVisibility`: `poll_results_visibility` enum (`"HIDDEN"`, `"PUBLISHED"`, `"ARCHIVED"`).
   - `createdById`: `uuid` FK -> `users.id` (SET NULL).
   - `scheduledStartAt`, `scheduledEndAt`: `timestamp with time zone`.
   - `openedAt`, `closedAt`, `cancelledAt`: `timestamp with time zone`.
   - `resultsPublishedAt`, `resultsWithdrawnAt`: `timestamp with time zone`.
   - `createdAt`, `updatedAt`: `timestamp with time zone`.
8. **`poll_options`**:
   - `id`: `uuid` PK.
   - `pollId`: `uuid` FK -> `polls.id` (CASCADE).
   - `label`: `varchar(160)` NOT NULL.
   - `shortDescription`: `varchar(280)` NOT NULL DEFAULT `""`.
   - `details`: `text` NOT NULL DEFAULT `""`.
   - `imageUrl`: `text`.
   - `displayOrder`: `integer` NOT NULL DEFAULT 0.
   - `createdAt`, `updatedAt`: `timestamp with time zone`.
9. **`poll_votes`**:
   - `id`: `uuid` PK.
   - `pollId`: `uuid` FK -> `polls.id` (CASCADE).
   - `optionId`: `uuid` FK -> `poll_options.id` (CASCADE).
   - `citizenId`: `uuid` FK -> `citizens.id` (RESTRICT).
   - `votedAt`: `timestamp with time zone` NOT NULL DEFAULT now().
   - **Unique Constraint**: `(poll_id, citizen_id)` — strictly guarantees one vote per citizen per poll.

### Migration History (`packages/db/drizzle/`)
- `0000_married_screwball.sql`: Initial schema (users, kingdoms, citizens, sessions, announcements, audit_logs).
- `0001_daffy_patriot.sql`: Indexes and status constraints.
- `0002_voting_system.sql`: Complete voting engine (polls, options, votes, enums, composite unique indexes).

---

## 5. Authentication and Security

### Authentication Flow
1. Citizen submits username/email and password to `/api/auth/login`.
2. Password verified using `@node-rs/argon2`.
3. High-entropy random token generated (`crypto.randomBytes(32).toString("base64url")`).
4. SHA-256 token hash stored in `sessions.tokenHash` with 30-day expiry.
5. Raw token set in `dh_session` cookie:
   - `HttpOnly: true` (inaccessible to browser JavaScript).
   - `Secure: true` (in production).
   - `SameSite: Lax`.
   - `Path: /`.
   - `Domain: COOKIE_DOMAIN` (if specified, for wildcard multi-subdomain sharing).
6. `/api/auth/me` verifies the session, confirms user status is `ACTIVE`, and returns user role and citizen details.

### User Roles & Permissions
- `SUPER_ADMIN`: Unlimited platform oversight, seed management, voting lifecycle, proclamation publishing.
- `ADMIN`: Platform monitoring, voting session management, proclamation publishing.
- `CITIZEN`: Dashboard access, citizen pass inspection, voting in active elections and decisions.

### Origin Guard & CSRF Defense
- Any mutating request (`POST`, `PUT`, `PATCH`, `DELETE`) is intercepted by `originGuard` middleware.
- Verifies the `Origin` header against an allowlist composed of:
  - `WEB_ORIGIN` (canonical domain, e.g., `https://dragonhold.my.id`).
  - Vercel preview environments automatically derived from `VERCEL_URL` and `VERCEL_BRANCH_URL`.
  - Localhost during local development.
- Unauthorized origins receive `403 BAD_ORIGIN`.

### Rate Limiting
- `apps/api/src/middleware/rate-limit.ts`: Sliding-window rate limiting keyed by client IP and action.
- Auth endpoints (login, registration) protected against brute-force attacks.

### Known Limitations
- Rate limiting uses an in-memory Map. In Vercel serverless environments, state is isolated per lambda instance and ephemeral. For strict global rate limiting across thousands of concurrent lambdas, an external Redis or Upstash store would be needed, but is intentionally omitted in V1 to avoid external infrastructure dependencies.

---

## 6. Deployment and Infrastructure

### Target Architecture
- **Web & API**: Vercel (Next.js App Router with Catch-all route `/api/[[...route]]`).
- **Database**: Neon PostgreSQL with connection pooling.
- **Custom Domains**:
  - Frontend / Primary: `https://dragonhold.my.id`
  - Vercel DNS: A record pointing to `76.76.21.21` or CNAME `cname.vercel-dns.com`.

### Environment Variables (Names Only — Values Must Remain Confidential)
Never expose or commit actual credentials. The application reads:

| Environment Variable | Where Configured | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Vercel & Local `.env` | Neon pooled Postgres connection string (`sslmode=require`) |
| `NODE_ENV` | Vercel & Local `.env` | `development`, `test`, or `production` |
| `WEB_ORIGIN` | Vercel & Local `.env` | Canonical web URL (`https://dragonhold.my.id`) |
| `COOKIE_DOMAIN` | Vercel & Local `.env` | Optional wildcard cookie domain (`.dragonhold.my.id`) |
| `VERCEL_URL` | Vercel (System) | Auto-injected by Vercel for preview deployments |
| `VERCEL_BRANCH_URL` | Vercel (System) | Auto-injected by Vercel for branch preview deployments |
| `API_PORT` / `PORT` | Local / Standalone | Port configuration (defaults to 4000) |
| `TRUSTED_PROXY_HOPS` | Vercel & Local `.env` | Number of proxy hops for IP extraction |
| `REGISTRATION_MODE` | Vercel & Local `.env` | Registration gate (`closed_beta` or default) |
| `BETA_ACCESS_CODE` | Vercel & Local `.env` | Secret code for closed beta enlistment |
| `SEED_ADMIN_USERNAME` | Vercel (CLI) / Local `.env` | Initial Super Admin username for `seed.ts` |
| `SEED_ADMIN_EMAIL` | Vercel (CLI) / Local `.env` | Initial Super Admin email for `seed.ts` |
| `SEED_ADMIN_PASSWORD` | Vercel (CLI) / Local `.env` | Initial Super Admin password for `seed.ts` |
| `NEXT_PUBLIC_API_URL` | Vercel & Local `.env` | Set to `/api` (same-origin serverless) |

### Important Historical Incident: The "Invalid Account" Super Admin Issue
**Context**: The user reported entering `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` into Vercel environment variables, redeploying, and finding that login failed with "account invalid".  
**Root Cause**: Setting environment variables in Vercel does **NOT** execute the seed script. Slices of code in `@dragonhold/db/src/seed.ts` must be executed deliberately against the database. Because the database had not been seeded, no user record existed in Neon PostgreSQL, resulting in an expected 401 response on `/api/auth/login`.  
**Resolution**: The seed script was hardened with full pre-flight conflict verification, atomic transaction guarantees, and idempotency so the user can safely run `pnpm db:seed` against Neon Production.

---

## 7. Recent Development History

### Git State & Commits
- **Active Branch**: `feat/vercel-api-integration`
- **Latest Remote Commits on `origin/feat/vercel-api-integration`**:
  - `da713f1031588912c0d7fc6633d61718270c1160`: `feat(db,shared,api): add voting schema, validation, and API routes`
  - `ccf0736ae8f24faa85e1e4f5a30f2c93f480d0fc`: `feat(api,db): add voting repository, drizzle snapshot, and voting tests`
  - `f66ddb6094ed5b0b7ed84ec564bcde00e9172d03`: `feat(web): add voting navigation and API error messages`
  - `6e4d62d1b24abb55a429ef3e101fd4622a674553`: `feat(web): link voting management from dashboard and admin console`
  - `c15b311965964db21bd2989566ac5be5e903a99a`: `feat(web): add admin voting management dashboard`
  - `54603069a6ba6ba60e8cec943fe6dbcd6660b8dd`: `feat(web): add public voting overview and archive pages`
  - `8c882a8080db266a2ec515252c67e2fc05008549`: `feat(web): add voting detail and sealed ballot submission page`
- **Latest Local Commit on `feat/vercel-api-integration`**:
  - `903c5b4`: `feat: implement voting and kingdom decision system` (consolidating the 26 files staged and committed locally).
- **Working Tree**: Completely clean (`git status -s` is empty).

### Latest Test, Typecheck, and Build Verification Results
- **Unit & Integration Tests**:
  - `@dragonhold/db`: **9/9 tests passed** (0 failures, duration ~3.2s).
  - `@dragonhold/api`: **26/26 tests passed** (0 failures, duration ~5.0s).
  - **Total**: **35/35 tests passing**.
- **Typecheck (`pnpm typecheck`)**:
  - `@dragonhold/db`: OK.
  - `@dragonhold/shared`: OK.
  - `@dragonhold/api`: OK.
  - `@dragonhold/web`: OK.
  - **Zero TypeScript errors** across the monorepo.
- **Production Build (`pnpm --filter @dragonhold/web build`)**:
  - Next.js 16.4.5 Turbopack production build succeeded in 1.2s.
  - All 10 application routes compiled cleanly (Static & Dynamic routes verified).

---

## 8. Pending Tasks and Roadmap

### Priority 1: Execute Migration & Seed against Neon Production (Requires User Approval)
- **Objective**: Run migration `0002_voting_system.sql` and `packages/db/src/seed.ts` against the production database so the super admin account and voting tables exist in Neon.
- **Commands**:
  ```bash
  DATABASE_URL="<production-connection-string>" pnpm db:migrate
  DATABASE_URL="<production-connection-string>" \
  SEED_ADMIN_USERNAME="<username>" \
  SEED_ADMIN_EMAIL="<email>" \
  SEED_ADMIN_PASSWORD="<password>" \
  pnpm db:seed
  ```
- **Rule**: NEVER run these commands without explicit instruction and approval from the user.

### Priority 2: End-to-End Production Verification
1. Access `https://dragonhold.my.id/login` and authenticate with the seeded Super Admin account.
2. Confirm citizen pass `DH-000001` displays on `/dashboard`.
3. Open `/admin/voting` and create a test draft session.
4. Open the session, submit a sealed citizen ballot on `/voting/[id]`, close the session, and verify confidentiality before publishing results.

### Priority 3: Re-enlistment Strategy (Private Beta vs Public Onboarding)
- Evaluate whether to re-open registration under an invitation model or invite-code system, or keep public registration disabled.

---

## 9. Development Guidelines & Constraints for Future Agents

Future AI agents working on Dragonhold must adhere strictly to these rules:

### 1. Security and Confidentiality
- **NEVER** inspect, read, print, or modify `/home/sakti/Dragonhold/.env` or any file containing secret tokens or credentials.
- **NEVER** expose passwords, Argon2 hashes, API keys, or database URLs in chat responses or commit messages.
- Always use the documented Argon2id configuration (`@node-rs/argon2`) to prevent password hashing mismatches.

### 2. Architectural Integrity
- Keep the current architecture: Next.js App Router frontend with catch-all `/api/[[...route]]` invoking Hono serverless functions.
- **DO NOT** introduce external background services, microservices, separate VPS hosts, Redis clusters, or WebSockets unless explicitly requested by the user.
- All code must remain compatible with Vercel serverless execution.
- Preserve existing security layers: Origin Guard, CORS, HttpOnly cookie authentication, and role-based route middleware.

### 3. Database Safety
- **DO NOT** execute migrations or seeds against Neon Production without explicit user instruction and authorization.
- When generating schema changes, use `pnpm db:generate` to produce declarative SQL migrations and update Drizzle meta snapshots together.
- All database writes affecting multiple entities (such as user + citizen or vote + counter) must run inside a database transaction (`db.transaction`).

### 4. Code Quality & Testing
- Run `pnpm test` and `pnpm typecheck` before pushing any changes.
- Ensure all tests in `@dragonhold/db` and `@dragonhold/api` pass with 0 failures.
- Verify production build with `pnpm --filter @dragonhold/web build` when touching web routes or UI components.

### 5. Git & VCS Hygiene
- Use Git conventional commit messages (`feat: ...`, `fix: ...`, `chore: ...`).
- When pushing to GitHub via MCP tools, push sequentially in small batches to avoid ref race conditions.
- Keep the local working tree clean.

---

## 10. Current Project State & Next Steps

### Current State
- The codebase is clean, fully committed locally on branch `feat/vercel-api-integration`, and all files are pushed to GitHub `origin/feat/vercel-api-integration`.
- All 35 tests are passing.
- Typecheck and Turbopack production builds pass with zero errors.
- Public registration is securely locked (`403 REGISTRATION_DISABLED`).
- Seed script is fully hardened and tested.
- Voting & Kingdom Decision system is complete and ready for database migration.

### Immediate Next Steps for the Next AI Agent
1. **Greet the User & Acknowledge State**: Inform the user that the project is in a clean, tested state on branch `feat/vercel-api-integration`.
2. **Confirm Neon Production Operations**: Ask the user if they would like to execute the pending migration (`0002_voting_system.sql`) and seed script (`pnpm db:seed`) against their Neon Production database to initialize the Super Admin account and voting tables.
3. **Verify Super Admin Sign-in**: Assist the user in verifying their login on Vercel once the production database is seeded.
4. **Follow User Direction**: Proceed with testing or the next roadmap feature based on the user's instructions.

