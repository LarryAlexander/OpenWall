# OpenWall

OpenWall is an open-source, offline-first family dashboard that runs on hardware people already own.

The first release is intentionally small: a household can create family members, see today's shared schedule, assign simple tasks, and keep using the board after the network disappears. No account, subscription, or vendor-owned display is required.

> Project status: local MVP implemented and under validation. It has not been published or deployed.

## Product promise

**A calm, glanceable home board that keeps the family oriented—even when the internet is down.**

OpenWall is not intended to copy Skylight's branding or interface. It addresses the same broad household-coordination problem with a local-first, hardware-agnostic, community-owned product.

## Current MVP

- household setup with named, color-coded members
- a wall-friendly “Today” view
- locally created schedule items
- assignable, completable household tasks
- automatic local persistence
- installable PWA behavior
- verified offline reload after the first successful visit
- responsive layouts for a wall display, tablet, and phone
- export and import of household data as a local backup

Calendar-provider sync, multi-device sync, meals, groceries, photos, AI, and home automation are roadmap features—not MVP claims.

## Implementation

- React and TypeScript
- Vite
- IndexedDB through Dexie
- a Vite PWA/service-worker integration
- date-fns
- Vitest and Testing Library
- Playwright for the critical install/offline journey
- GitHub Actions for checks and a static GitHub Pages demo

GitHub Pages can host the static demo, but it cannot by itself synchronize household data between devices.

## Run locally

```sh
pnpm install
pnpm dev
```

Run the complete local verification suite with `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`.

## Project documents

- [Product brief](docs/PRODUCT_BRIEF.md)
- [Roadmap](docs/ROADMAP.md)
- [Product status](docs/PRODUCT_STATUS.md)

## Current decision gate

The implemented MVP remains a **conditional go** until the Today-board experience is tested with households. Public repository creation and GitHub Pages activation are intentionally separate owner-approved steps.
