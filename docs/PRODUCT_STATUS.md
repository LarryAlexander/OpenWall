# OpenWall Product Status

- **Date:** 2026-09-03
- **Lifecycle stage:** Verify (Stage 5), with household validation outstanding
- **Gate:** Conditional
- **Active milestone:** Household usability validation
- **Product owner:** Larry Alexander

## Product truth

- OpenWall is a greenfield, open-source, offline-first family-dashboard concept.
- It is planned as a conventional web PWA, not a Flutter application.
- The public GitHub Pages demo will be a static client; MVP household data will remain in the current browser profile.
- A local application, public repository, and GitHub Pages deployment now exist. Household validation and final brand clearance remain outstanding.

## Work completed

- Defined the product promise, initial user, problem, and differentiation hypothesis.
- Bounded a local-first MVP and its non-goals.
- Defined a primary journey, critical states, and observable acceptance criteria.
- Proposed a staged roadmap through optional sync, integrations, and assistance.
- Completed a proportional commercial-feasibility baseline.
- Implemented onboarding, sample data, a freeform Today corkboard, movable/resizable/lockable cards, an add-card tray, member filters, schedule and task editing, task completion, settings, backup/restore, local reset, responsive reading layouts, dark mode, and PWA packaging.
- Implemented the optional OpenWall Guide tour, searchable offline help, release history, one-time contextual coach marks, PWA post-update education, and device-local guide preferences.
- Added a mobile-focused install and connectivity guide with device-aware steps, an available native install prompt, explicit single-browser data boundaries, and persistent offline-readiness status.
- Added explicit guidance truth guardrails covering backup boundaries, browser storage, offline prerequisites, device-dependent installation, placeholder cards, and unvalidated product claims.
- Added Apache-2.0 licensing, contributor and security policies, dependency provenance, continuous integration, and an opt-in Pages deployment workflow.
- Published the public `LarryAlexander/OpenWall` repository and deployed the static demo through GitHub Pages.

## Evidence and verification

- **Performed:** production TypeScript build; lint; unit coverage of backups, IndexedDB repository behavior, appearance preferences, install-platform guidance, and offline-readiness state; end-to-end setup, sample, household/task persistence, appearance persistence, board-card persistence, offline reload, mobile connectivity education, settings, erase-confirmation, and safe-arrangement flows across wall and phone browser profiles.
- **Not performed:** user interviews, physical wall-device testing, full assistive-technology audit, name/trademark search, or legal review.

## Filled assumptions

- “OpenWall” is a working title based on the workspace name.
- The MVP is local-only and single-browser-profile by design.
- The initial differentiation is privacy, hardware choice, offline behavior, and freedom from mandatory accounts/subscriptions.
- React, TypeScript, Vite, Dexie, and a PWA integration are the implemented MVP stack.

## Decisions required before publication

1. Conduct the planned household usability sessions.
2. Decide whether validation findings require interface changes before publication.
3. Review validation findings before labeling the project production-ready.

## Launch, marketing, and operations

- Initial distribution is a public source repository plus GitHub Pages demo.
- No monetization is planned for MVP.
- A contribution guide, security policy, code of conduct, and provenance ledger should accompany the first public code release.
- Public publishing requires explicit owner authorization.

## Commercial feasibility

- **Selling route:** free/open-source core; future donations, sponsorship, managed hosting, or support are hypotheses only.
- **Customer/demand evidence:** category demand exists, but OpenWall-specific demand is unvalidated.
- **Differentiation:** local-first, hardware-agnostic, no mandatory account, open source.
- **Distribution gate:** static demo is feasible; cross-device sync is not supplied by GitHub Pages.
- **Unit economics:** not applicable to MVP beyond maintainer time and minimal static hosting; not yet measured.
- **Dependency/IP posture:** original implementation planned; license and dependency ledger outstanding.
- **Decision:** conditional go for prototype and local-first vertical slice.

## Risks and blockers

- Scope could expand into a broad smart-home platform before the daily household workflow is proven.
- Browser storage can be cleared by users or the operating system; backup/restore and honest messaging are mandatory.
- PWA installation and offline behavior vary by browser and must be validated on target hardware.
- Calendar authorization and multi-device sync materially expand privacy and security scope.
- The working name has not been checked for conflicts.

## Success signal

- **Baseline:** no users or runtime product.
- **Validation target:** 6 of 8 participants complete the core prototype flow unaided; 4 of 8 express credible week-long use intent.
- **MVP target:** complete setup-to-offline-reload journey in five minutes on a wall display and tablet-class browser.
- **Latest:** not measured.

## Next milestone

Test the implemented freeform corkboard experience with 5–8 household organizers and revise it from observed evidence.

## Human-only action

Run household and physical-device testing, then decide whether the project is ready to move beyond its public prototype label.
