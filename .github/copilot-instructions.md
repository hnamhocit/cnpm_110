# GitHub Copilot Instructions - Film Contest Monorepo

## Mandatory Context & Specifications
You are working on FilmContest-AI, a specialized platform for Analog Film Photography Contests.

Before generating code, modifying schemas, or creating API endpoints, you MUST reference:
1. `docs/srs.md` - Master Software Requirements Specification (Use cases, business rules BR-01 to BR-25, error messages MSG001 to MSG028).
2. The specific module document in `docs/`:
   - `docs/01-auth-and-rbac.md` -> Authentication & RBAC
   - `docs/02-analog-master-data.md` -> Master Data
   - `docs/03-contest-lifecycle.md` -> Contests & Criteria (BR-08 timeline, BR-15 100% weight, BR-20 quorum)
   - `docs/04-film-logbook.md` -> Film Rolls & Frame Logs (BR-04 physical frame limits)
   - `docs/05-submission-and-proof.md` -> Submissions & Negative Proof (BR-06, BR-07, BR-19 48h limit)
   - `docs/06-ai-verification.md` -> AI verification ($P_{AI} \ge 0.75$, pHash)
   - `docs/07-blind-judging.md` -> Double-blind judging (BR-12), Score discrepancy (BR-14)
   - `docs/08-archive-and-exhibition.md` -> Result immutability (BR-16), Watermarked preview (BR-17)
   - `docs/09-api-contracts.md` -> Shared DTOs and API envelopes
   - `docs/10-database-and-storage.md` -> PostgreSQL schema, pgvector, digital_assets

## Core Conventions
- **Runtime & Package Manager**: Always use `bun` (`bun --filter <app> dev`, `bun install`). Never use `npm` or `yarn`.
- **Double-Blind Judging**: Ensure API responses for the `JUDGE` role NEVER contain participant personal identifiable information.
- **Physical Limits**: Enforce physical format limitations (Khổ 135: max 39 frames; Khổ 120_645: max 16 frames).
- **Soft Delete**: Always preserve records with `is_deleted = true`.
