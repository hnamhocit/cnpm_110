# Claude Code Instructions - Film Contest Monorepo

## Mandatory Context & Specifications
You are working on **FilmContest-AI** (Analog Photography Contest Management Platform).

Before writing, modifying, or planning any code in this repository, you MUST ALWAYS consult:
1. `docs/srs.md` - Master Software Requirements Specification.
2. The relevant module specification in `docs/`:
   - `docs/01-auth-and-rbac.md` -> Auth, RBAC, JWT, Accounts
   - `docs/02-analog-master-data.md` -> Film stocks, Cameras, Lenses, Labs
   - `docs/03-contest-lifecycle.md` -> Contests, Categories, Scoring Criteria, Timeline Order (BR-08), 100% Weight (BR-15), Quorum (BR-20)
   - `docs/04-film-logbook.md` -> Film rolls, Frame logs, Physical frame limits (BR-04, BR-23), Push/Pull ISO
   - `docs/05-submission-and-proof.md` -> Submissions, Negative proof (BR-06), 48h Deadline (BR-19), File standard (BR-07)
   - `docs/06-ai-verification.md` -> AI verification ($P_{AI} \ge 0.75$, pHash)
   - `docs/07-blind-judging.md` -> Double-blind judging (BR-12), Score variance alert (BR-14), Final score average (BR-25)
   - `docs/08-archive-and-exhibition.md` -> Result immutability (BR-16), Dual digital asset storage (BR-17)
   - `docs/09-api-contracts.md` -> Shared DTOs and API envelopes
   - `docs/10-database-and-storage.md` -> PostgreSQL 16+, pgvector schema, digital_assets table

## Inviolable Rules & Commands
- **Package Manager**: Use `bun` exclusively (`bun install`, `bun dev`, `bun run build`). Do NOT use `npm`, `yarn`, or `pnpm`.
- **Double-Blind Protection (BR-12)**: NEVER leak participant identity to judges in API DTOs.
- **Physical Frame Limits (BR-04, BR-23)**: Khổ 135 (max 39), Khổ 120 (max 10-16), Khổ 4x5 (max 1).
- **Negative Proof 48h Countdown (BR-19)**: Enforce strict 48-hour timeout.
- **Soft Delete (BR-03)**: Never hard-delete records; update `is_deleted = true`.
