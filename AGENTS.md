<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

---

# 🤖 MANDATORY AI CODING AGENT INSTRUCTIONS (CONTEXT & SPEC GUARD)

> [!CAUTION]
> **CRITICAL RULE FOR ALL AI ASSISTANTS (Cursor, GitHub Copilot, Claude, Devin, Antigravity, ChatGPT, etc.)**:
> **BEFORE writing, modifying, or suggesting ANY code, database schema, or API endpoint in this repository, you MUST FIRST read**:
> 1. [`docs/srs.md`](docs/srs.md) - The Master Software Requirements Specification.
> 2. The corresponding module specification in `docs/` (`01-auth-and-rbac.md` to `10-database-and-storage.md`) related to your current task.
>
> **NEVER ASSUME OR GUESS BUSINESS LOGIC.** All domain logic, database tables, field types, constraints, and API contracts are strictly specified in the `docs/` folder.

## 1. Domain & Business Rules Mapping (SSOT)

Always map your task to the Single Source of Truth before coding:
- **Master SRS**: [`docs/srs.md`](docs/srs.md) (Actors, Use Cases UC-01 to UC-43, Business Rules BR-01 to BR-25, App Messages MSG001 to MSG028)
- **Module 01 (Auth & RBAC)**: [`docs/01-auth-and-rbac.md`](docs/01-auth-and-rbac.md) (JWT, Refresh Token Rotation, RBAC Matrix, Brute-force lockout)
- **Module 02 (Analog Master Data)**: [`docs/02-analog-master-data.md`](docs/02-analog-master-data.md) (Film Stocks, Cameras, Lenses, Labs, Soft delete)
- **Module 03 (Contest Lifecycle)**: [`docs/03-contest-lifecycle.md`](docs/03-contest-lifecycle.md) (Timeline order BR-08, 100% weight validation BR-15, Quorum BR-20, Conflict of Interest BR-21, 6-state machine)
- **Module 04 (Film Logbook)**: [`docs/04-film-logbook.md`](docs/04-film-logbook.md) (Film rolls, Frame logs, Physical frame limits BR-04/BR-23, Push/Pull ISO, Offline sync)
- **Module 05 (Submission & Proof)**: [`docs/05-submission-and-proof.md`](docs/05-submission-and-proof.md) (Photo technical standards BR-07, Duplicate check BR-05, Mandatory 48h proof countdown BR-19, Mandatory reason BR-18, 5 metadata fields BR-22)
- **Module 06 (AI Verification)**: [`docs/06-ai-verification.md`](docs/06-ai-verification.md) (AI-generated flag P_AI >= 75% BR-09, pHash Hamming <= 5 BR-10, pgvector)
- **Module 07 (Blind Judging)**: [`docs/07-blind-judging.md`](docs/07-blind-judging.md) (Double-blind DTO stripping BR-12, Judge independence BR-13, Score discrepancy alert > 30% BR-14, Score average BR-25)
- **Module 08 (Archive & Exhibition)**: [`docs/08-archive-and-exhibition.md`](docs/08-archive-and-exhibition.md) (Result immutability BR-16, Dual digital asset storage BR-17)
- **Module 09 (Shared API Contracts)**: [`docs/09-api-contracts.md`](docs/09-api-contracts.md) (Standard response envelopes, DTOs, Zod schemas)
- **Module 10 (Database & Storage)**: [`docs/10-database-and-storage.md`](docs/10-database-and-storage.md) (PostgreSQL 16+, pgvector, digital_assets, S3/R2 presigned URLs)

## 2. Inviolable Core Constraints

- **Double-Blind Protection (BR-12)**: NEVER return participant personal identity (`fullName`, `email`, `avatarUrl`, `userId`) in any endpoint called by the `JUDGE` role. Strip identity at the backend DTO/serialization layer.
- **Physical Film Limits (BR-04, BR-23)**: Frame numbers MUST NOT exceed physical limits: Format `135` (max 39), `120_645` (max 16), `120_66` (max 12), `120_67` (max 10), `4x5` (max 1).
- **Negative Proof 48h Countdown (BR-19)**: When proof is requested, participant has exactly 48 hours to upload. Overdue submissions automatically transition to `DISQUALIFIED_NO_PROOF`.
- **Criteria Weights (BR-15)**: Sum of criterion weights per category must equal exactly 100% ($1.0000$).
- **Result Immutability (BR-16)**: Once a contest transitions to `PUBLISHED`, all scores, awards, and submissions are read-only.
- **Soft Delete Only (BR-03)**: Never perform hard `DELETE` queries on core domain entities. Update `is_deleted = TRUE` instead.

## 3. Monorepo & Tooling Rules

- **Package Manager**: Use `bun` exclusively (`bun install`, `bun dev`, `bun run build`). NEVER use `npm`, `yarn`, or `pnpm`.
- **Workspaces**:
  - `apps/api`: Hono on Bun runtime, Drizzle ORM, PostgreSQL.
  - `apps/web`: Next.js 16 (App Router), React 19, Tailwind CSS v4, Biome.
  - `apps/mobile`: Flutter (Dart), Riverpod, GoRouter.
  - `packages/*`: Shared configs (`typescript-config`, `eslint-config`).
- **Commands**: Run workspace-targeted commands using `bun --filter <workspace> <command>` (e.g. `bun --filter api dev`).

