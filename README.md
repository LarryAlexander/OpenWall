# OpenWall

OpenWall is an open-source, offline-first family dashboard that runs on hardware people already own.

The first release is intentionally small: a household can arrange a freeform corkboard of useful cards, see today's shared schedule, assign simple tasks, and keep using the board after the network disappears. No account, subscription, or vendor-owned display is required.

> Project status: public MVP deployed on GitHub Pages and awaiting household validation.

## Product promise

**A calm, glanceable home board that keeps the family oriented—even when the internet is down.**

OpenWall is not intended to copy Skylight's branding or interface. It addresses the same broad household-coordination problem with a local-first, hardware-agnostic, community-owned product.

## Current MVP

- household setup with named, color-coded members
- a wall-friendly freeform corkboard with movable, resizable, lockable cards
- schedule, task, note, meal, countdown, welcome, and photo-style cards
- a protected Arrange mode and an add-card tray
- an optional 60-second orientation tour with remembered dismissal
- searchable offline Help and a bundled What’s New history
- one-time contextual tips for arranging, adding cards, countdowns, offline readiness, and backups
- locally created schedule items
- assignable, completable household tasks
- automatic local persistence
- device-aware installation guidance for iPhone, iPad, Android, computers, and wall displays
- a plain-language explanation of what GitHub Pages, local browser storage, and offline mode each do
- installable PWA behavior with remembered offline-readiness status
- verified offline reload after the first successful visit
- responsive layouts for a wall display, tablet, and phone
- export and import of household data as a local backup

Calendar-provider sync, multi-device sync, meals, groceries, photos, AI, and home automation are roadmap features—not MVP claims.

## Implementation

- React and TypeScript
- Vite
- IndexedDB through Dexie
- a Vite PWA/service-worker integration
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
- [Next phase: a living household board](docs/NEXT_PHASE.md)
- [Guidance truth and misleading-claim guardrails](docs/GUIDANCE_TRUTH_POLICY.md)
- [Product status](docs/PRODUCT_STATUS.md)

## Current decision gate

The implemented MVP remains a **conditional go** until the corkboard experience is tested with households. The repository and Pages demo are public; household validation is the next evidence gate.
