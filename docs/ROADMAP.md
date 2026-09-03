# OpenWall Roadmap

Last updated: 2026-09-03

This roadmap orders work by evidence and dependency, not by feature excitement. Dates should be added only after the first vertical slice establishes real delivery speed.

## Milestone 0 — Validate the wall-board experience

**Outcome:** establish that households understand and want the core interaction before building integrations.

- define the primary wall-display dimensions and distance
- create the first-run and Today-board prototype
- test with 5–8 household organizers
- record comprehension, task success, setup friction, and week-long usage intent
- select the open-source license and contribution posture

**Exit:** at least 6 participants complete the core flow unaided and at least 4 express credible intent to keep it visible for a week, or the concept is revised.

## Milestone 1 — Local-first MVP

**Outcome:** one household can rely on one installed device for today's shared plan.

- household and member setup
- locally created schedule items
- assignable household tasks
- glanceable Today board
- IndexedDB persistence
- versioned backup and restore
- installable app shell
- production-build offline reload verification
- responsive wall/tablet/phone layouts
- accessibility baseline and storage-failure recovery
- automated checks and GitHub Pages demo deployment

**Exit:** all MVP acceptance criteria in the product brief pass on at least one desktop browser and one tablet-class mobile browser.

## Milestone 2 — Calendar usefulness

**Outcome:** the board can incorporate schedules people already maintain without compromising local-first behavior.

- evaluate local `.ics` import before provider authorization
- calendar source labeling and per-member mapping
- duplicate detection and import preview
- timezone and daylight-saving test suite
- read-only subscribed-calendar experiment
- conflict and stale-source explanations

**Exit:** a household can import or subscribe to a real calendar safely, understand its source, and recover from errors without losing local items.

## Milestone 3 — Shared household utilities

**Outcome:** OpenWall becomes useful beyond the day's schedule.

- grocery and custom lists
- meal planner linked to grocery items
- reusable task routines
- week view
- focus/sleep schedule for the display
- local photo rotation using explicitly selected files

**Exit:** observed weekly use demonstrates that at least two utilities improve retention without making the Today board noisy.

## Milestone 4 — Optional multi-device sync

**Outcome:** a household can update the same board from multiple devices while retaining ownership and recoverability.

- write a separate decision record for identity, authorization, encryption, conflict resolution, deletion, and recovery
- prototype a documented self-hosted sync service
- define a stable, versioned sync protocol
- add device enrollment, revocation, audit visibility, and export
- test offline edits, concurrent edits, clock skew, failed migrations, and lost-device recovery

**Gate:** this is a high-risk architecture and privacy milestone. It requires explicit approval before implementation. GitHub Pages remains only the client host.

## Milestone 5 — Integrations and extensibility

**Outcome:** the community can connect OpenWall to household systems without forking the core.

- Home Assistant integration
- CalDAV and provider-specific calendar connectors
- documented extension API
- optional NAS/local-network photo sources
- kiosk deployment guides for common hardware
- importers for common household tools

**Exit:** integrations operate with least privilege, clear permission states, revocation, and failure isolation.

## Milestone 6 — Optional assistance

**Outcome:** automation reduces household entry work without taking control away from people.

- review-first extraction from flyers or school schedules
- proposed meal plans and grocery additions
- optional local-model support
- clearly separated hosted-AI adapter
- provenance, confidence, privacy, and Apply/Discard controls

**Gate:** no assistant may silently change the household plan. AI remains removable and is never required for core use.

## Continuous tracks

### Privacy and security

- no telemetry by default
- threat modeling for storage, imports, backups, and sync
- dependency updates and vulnerability response
- clear erase/export flows
- special care for children's data and shared-device access

### Accessibility and inclusion

- keyboard, switch, and screen-reader support
- non-color identity cues
- large type and distance readability
- reduced motion and high contrast
- plain-language household roles without assuming family structure

### Open-source health

- license and contributor guide
- code of conduct and security policy
- issue templates and roadmap labels
- dependency/provenance ledger
- reproducible local setup and releases

### Sustainability

- measure maintainer time and hosting cost
- prefer donations or paid convenience/support over locking local features
- do not introduce a subscription until recurring value and operating cost are evidenced
