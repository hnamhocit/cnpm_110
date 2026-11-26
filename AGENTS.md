<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

---

# CINEGEN repository instructions

Before writing or proposing code, schemas, or API changes, read the master SRS and the modules relevant to the task. Apply any workspace-specific `AGENTS.md` as well.

- The [SRS](docs/srs.md) governs business requirements and message codes. Use its [module index](docs/srs.md#4-module-specifications-mapping-chỉ-mục-ánh-xạ-module-chi-tiết) to find the relevant technical design and map each change to the applicable UC and BR.
- Apply the SRS business rules before implementation, especially soft deletion, session revocation, blind judging, criteria weights, result immutability, proof deadlines, and film frame limits.
- For API work, check [Module 09](docs/ai/09-api-contracts.md), [OpenAPI](docs/openapi.yaml), and [Hono route registrations](apps/api/src/index.ts). OpenAPI marks registered operations as `mounted` and pending contracts as `planned`. Verify implementation against the relevant SRS rules.
- When requirements or contracts disagree, identify the difference and follow the governing document. Missing business rules, routes, or DTOs need an explicit decision before implementation.

## Documentation placement

- Keep `docs/ai/` focused on technical specifications and instructions for AI implementation. Record progress, bugs, review notes, test results, and acceptance evidence in `docs/progress/checklist.md`.

## Monorepo & Tooling Rules

- **Package Manager**: Use `bun` exclusively (`bun install`, `bun dev`, `bun run build`). NEVER use `npm`, `yarn`, or `pnpm`.
- **Workspaces**:
  - `apps/api`: Hono on Bun runtime, Drizzle ORM, PostgreSQL.
  - `apps/web`: Next.js 16 (App Router), React 19, Tailwind CSS v4, Biome.
  - `apps/mobile`: Flutter (Dart), Riverpod, GoRouter.
  - `packages/*`: Shared configs (`typescript-config`, `eslint-config`).
- **Commands**: Use `bun --filter <workspace> <command>` for JS workspaces (e.g. `bun --filter api dev`). Run Flutter commands from `apps/mobile`.

