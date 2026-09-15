# OpenWall Agent Guide

## Project

OpenWall is a React/TypeScript offline-first family dashboard delivered as a
PWA. Household data is stored in the current browser profile through Dexie and
IndexedDB. GitHub Pages hosts the static client; it does not provide household
data synchronization.

## Working rules

- Read the relevant source and docs before changing behavior; preserve
  unrelated working-tree changes.
- Keep proposals inside the active milestone. For architecture, persistence,
  authentication, synchronization, privacy, or dependency changes, update or
  add an ADR under `docs/decisions/` and review the product-status implications
  before implementation.
- Keep the MVP local-first, hardware-agnostic, and usable after network loss.
- Do not imply that household records are uploaded or synchronized when the
  implementation only uses local browser storage.
- Never put real household information in source, fixtures, tests, screenshots,
  issues, or commits. Use fictional household data only.
- Keep external fetches narrowly scoped and truthful. Weather uses Open-Meteo
  only after a place or one-time location lookup is selected; it does not
  require an API key.
- Treat persistence, backup formats, migrations, sync, authentication,
  privacy, deployment, and destructive reset behavior as high-risk changes.
  Update the relevant docs, tests, and rollback notes before implementation.
- When changing user-visible behavior, update `CHANGELOG.md` and keep product
  status and guidance claims aligned with verified behavior.
- Prefer existing React, Dexie, and PWA patterns over new abstractions or
  dependencies.
- Follow `CONTRIBUTING.md` for contribution scope and `SECURITY.md` for
  vulnerability handling; do not expose suspected vulnerabilities in public
  issues.

## Verification

Run the narrowest useful check during iteration. Before handoff for a normal
feature change, run:

```sh
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm check:changelog
```

`pnpm build` includes the TypeScript project check. E2E coverage uses the
configured wall, compact, tablet, and phone browser profiles. Do not claim
physical wall-device, assistive-technology, or multi-week household validation
unless it was actually performed.

CI uses Node 22, pnpm 10, a frozen lockfile, and Chromium/WebKit Playwright
installations. Match that environment when reproducing CI failures locally.

## Important locations

- `src/App.tsx`: primary application UI and interactions
- `src/db.ts`: Dexie persistence and schema
- `src/backup.ts`: versioned local backup and restore validation
- `src/types.ts`: shared domain types
- `e2e/openwall.spec.ts`: browser journey coverage
- `docs/GUIDANCE_TRUTH_POLICY.md`: user-facing claim and boundary guardrails
- `docs/PRODUCT_STATUS.md`: current evidence, risks, and milestone status
- `docs/decisions/`: architectural decision records
- `docs/AGENT_INSTRUCTION_SET.md`: detailed agent workflow and evidence rules

## Handoff

Report files changed, verification performed, unperformed manual checks, and
any residual risk. Keep commits focused and do not push or deploy unless the
user explicitly requests it.
