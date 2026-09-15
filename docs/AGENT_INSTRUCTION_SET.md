# OpenWall Agent Instruction Set

This document supplements the root [`AGENTS.md`](../AGENTS.md). It describes
how an agent should reason about OpenWall work and how to report evidence.

## Mission and product boundary

Optimize for a calm, glanceable household board that remains useful when the
network disappears. Preserve these MVP boundaries:

- The app is a React/TypeScript PWA, not a native Flutter application.
- Household records are local to the current browser profile through Dexie and
  IndexedDB.
- GitHub Pages serves static assets; it is not a sync backend.
- Same-home LAN/Wi-Fi synchronization is a planned Milestone 4 direction, not
  an implemented capability.
- Weather is an optional, narrowly scoped network feature. It must not be used
  as a reason to weaken local persistence or claim household-data upload.

## Operating loop

For every task:

1. Identify the requested outcome, affected user flow, and current milestone.
2. Inspect the relevant implementation, tests, documentation, and working-tree
   state before proposing changes.
3. Classify the task:
   - **Simple:** make the smallest safe edit and run a focused check.
   - **Standard:** state a short plan, follow existing patterns, and run the
     relevant unit/build/browser checks.
   - **High-risk:** write or update a plan and ADR, identify migration and
     rollback implications, and obtain approval before implementation.
4. Implement the smallest complete slice. Avoid speculative sync, accounts,
   AI, calendar authorization, or automation work.
5. Verify behavior at the narrowest useful level, then run the full local gate
   when the change is user-visible or spans multiple areas.
6. Report what is proven, what is inferred, and what still requires a person
   or physical device.

## Data, persistence, and privacy

- Treat `src/db.ts`, `src/backup.ts`, and shared types as a coordinated data
  contract.
- For schema or backup changes, update the versioning logic, migration or
  restore tests, user guidance, product status, and changelog together.
- Preserve user data during normal upgrades. Destructive reset or deletion must
  be explicit, targeted, and recoverable where practical.
- Use fictional household members, tasks, meals, and photos in fixtures and
  examples. Never copy real family information into the repository.
- Keep selected photos local. Do not introduce upload, telemetry, or account
  requirements without an approved privacy and security design.

## UI and interaction quality

- Preserve the wall-display, tablet, and phone layouts and test all configured
  browser profiles for responsive behavior changes.
- Prefer direct manipulation on the corkboard. Keep controls discoverable on
  touch and keyboard, and do not rely on hover alone for essential actions.
- Cover loading, empty, error, offline, permission-denied, and populated states
  when a feature has those states.
- Keep labels, help, onboarding, and settings truthful about browser-local
  storage, backup limits, installation, and connectivity.
- Do not claim visual, physical-device, assistive-technology, or household
  validation unless that validation actually happened.

## Documentation and decisions

- Update `CHANGELOG.md` for user-visible changes.
- Keep `README.md`, `docs/GUIDANCE_TRUTH_POLICY.md`, and
  `docs/PRODUCT_STATUS.md` consistent with the shipped behavior and evidence.
- Record architecture, persistence, sync, privacy, security, dependency, and
  deployment decisions in `docs/decisions/`.
- Keep roadmap ideas visibly separate from implemented features and mock or
  placeholder states.

## Git and release discipline

- Inspect `git status` before editing and preserve unrelated changes.
- Keep commits focused and descriptive. Do not rewrite history, reset the
  worktree, or delete files without explicit authorization.
- Run the repository checks described in `AGENTS.md` before handoff when
  practical. CI uses Node 22, pnpm 10, a frozen lockfile, and Playwright
  Chromium/WebKit installations.
- Do not push, deploy, publish, or merge unless the user explicitly requests
  that external state change.

## Handoff format

End implementation work with:

- a short outcome summary;
- important files changed;
- commands and results that were actually run;
- manual or device validation not performed;
- residual risks and the next evidence gate, if any.
