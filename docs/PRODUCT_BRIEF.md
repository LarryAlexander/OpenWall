# OpenWall Product Brief

Last updated: 2026-09-03

## Product truth

- **Product and format — confirmed:** an open-source, offline-first family dashboard delivered first as a PWA.
- **Working title — confirmed for MVP:** OpenWall. Naming and trademark clearance have not been completed.
- **Owner — confirmed:** Larry Alexander.
- **Target user — inferred:** a household organizer who currently coordinates schedules and responsibilities across calendars, messages, paper, and memory.
- **Painful problem — inferred:** the household lacks one calm, visible source of truth that children and adults can understand at a glance.
- **Product promise — proposed:** a calm, glanceable home board that keeps the family oriented, even when the internet is down.
- **Current alternatives — observed:** dedicated family-calendar hardware, general smart displays, shared calendar apps, task apps, whiteboards, and DIY Home Assistant dashboards.
- **Initial success metric — proposed:** a new household can set up members, add one schedule item, assign one task, complete it, then reload offline and see the same state—all within five minutes.

## Evidence and assumptions

### Confirmed

- The product should be free and open source.
- The public demo should be hosted from GitHub.
- A conventional web/PWA stack is preferred over Flutter.
- Offline usefulness is central rather than decorative.
- The long-term concept includes schedules, chores, meals, lists, photos, optional AI, and home integrations.

### Inferred

- Existing screens such as old tablets, touch displays, laptops, and mini-PC kiosks are the first hardware targets.
- Privacy, local control, and avoiding mandatory subscriptions are primary differentiators.
- The first release should prove shared orientation and household participation, not broad integration coverage.

### Assumed for planning

- The first GitHub Pages demo stores data only in the current browser profile.
- No accounts, cloud backend, analytics, ads, or third-party calendar authorization are included in the first release.
- Sample data can be reset without affecting user-created data once a household is created.

### Undecided

- Final name, domain, logo, and trademark posture.
- Whether calendar import begins with a local `.ics` file or waits until a later milestone.
- Which display size and orientation is the primary design target.
- Whether future sync is peer-to-peer, self-hosted, managed, or supports more than one approach.

### Cheapest falsification test

Put a clickable, representative “Today” board in front of 5–8 household organizers. Ask each person to explain what everyone is doing today, add an item, and mark a task complete without instruction. Continue only if at least 6 can complete the flow and at least 4 say they would leave it visible in a shared space for a week.

## Current milestone

- **Lifecycle stage:** Verify (Stage 5); household validation remains outstanding.
- **Goal:** validate the implemented local-first household-board experience with real household organizers.
- **Included:** members, today's schedule, household tasks, local persistence, backup/restore, installability, offline reload, responsive wall/tablet/phone presentation.
- **Non-goals:** third-party calendar sync, accounts, remote multi-device sync, push notifications, meal planning, groceries, photos, AI, Home Assistant, native mobile apps, payments, and dedicated hardware.

### MVP acceptance criteria

1. A first-time user can create a household and at least two members.
2. Each member has a distinct name and accessible color treatment.
3. The user can add, edit, and remove a schedule item locally.
4. The user can assign a task and mark it complete from the wall view.
5. Closing and reopening the app preserves the household state.
6. After one successful online load, the app shell and saved data work without a network connection.
7. The UI provides clear first-run, empty, populated, validation-error, storage-error, and offline states.
8. Keyboard operation, visible focus, semantic labels, contrast, reduced motion, and 200% text zoom are checked.
9. The user can export a versioned backup and restore it with validation and a confirmation step.
10. Automated tests cover the data model, persistence, and core task journey; the offline reload is manually and automatically exercised in a production build.

## Primary experience

1. **Welcome:** explain local-only storage before the user enters household information.
2. **Household setup:** name the household and add members with suggested accessible colors.
3. **Today board:** show date, current time, upcoming schedule, and assigned tasks without requiring navigation.
4. **Quick add:** add a schedule item or task in a few taps, with sensible defaults.
5. **Participate:** a family member marks a task complete directly on the board.
6. **Recover:** export, validate, and restore a local backup; explain how browser-data deletion affects the app.

## Experience requirements

- Designed for distance viewing and touch targets before information density.
- Never use color as the only member identifier.
- Preserve a read-only glance mode when editing controls are not in use.
- Make offline/local-only status understandable without persistent alarm styling.
- Avoid child surveillance, behavioral scoring, or manipulative reward mechanics in the MVP.
- Treat household data as private by default; do not transmit it in the first release.

## Implemented technical shape

- Static React + TypeScript application built with Vite.
- IndexedDB persistence behind a small storage interface, likely using Dexie.
- Service worker and manifest for installability and cached app-shell behavior.
- Domain model separated from views so a future sync engine does not own product logic.
- Versioned export format and explicit schema migrations from the first public release.
- GitHub Actions for type checking, tests, production build, and GitHub Pages deployment.

### Important constraint

GitHub Pages is suitable for the public static demo, not a shared household backend. The first demo's data remains in one browser profile. Cross-device access requires a later sync architecture and a separate trust/security decision.

## Distribution and business posture

- **Initial route — confirmed:** free public source repository and free GitHub Pages demo.
- **Commercial posture — proposed:** community project first. Possible future sustainability routes include donations, sponsorship, paid managed hosting, or optional support—never required for local core features.
- **Core-value ownership — proposed:** owned core. OpenWall's household model, interaction design, local storage contract, and sync protocol should remain project-controlled; libraries should be replaceable infrastructure.
- **Rights posture — conditional:** Apache-2.0 is selected and direct dependencies are recorded in the provenance ledger. A complete transitive-license review remains a pre-publication check.
- **Data posture — proposed:** local-only by default, no telemetry in MVP, explicit export/erase controls, and no sensitive sample data in the public demo.

## Commercial-feasibility gate

| Dimension            | Status         | Current evidence                                                                                                           | Cheapest next test                                                           |
| -------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Customer             | Conditional    | The category targets families coordinating schedules and responsibilities; no OpenWall interviews yet.                     | Interview 5–8 household organizers.                                          |
| Demand               | Conditional    | Commercial products show category demand, but not demand for this implementation.                                          | One-week MVP trial with intent survey.                                       |
| Competition          | Conditional    | Dedicated devices combine calendars, tasks, lists, meals, and apps. DIY tools trade ease for control.                      | Compare setup and daily-use journeys across 3 direct and 3 DIY alternatives. |
| Differentiation      | Conditional    | Local-first, hardware-agnostic, no mandatory account, and open source are meaningful hypotheses.                           | Test which promise changes adoption intent.                                  |
| Core-value ownership | Passed for MVP | The implemented core is original product logic and UX; third-party libraries are replaceable infrastructure.               | Recheck when architecture or core dependencies change.                       |
| Product design       | Conditional    | The core journey is implemented and visually inspected, but has not been observed with target households.                  | Usability-test the Today board.                                              |
| Technical            | Conditional    | The production build, IndexedDB persistence, and Chromium offline reload pass; physical target hardware remains untested.  | Run the production build on the intended wall device and Safari/iPadOS.      |
| Distribution         | Conditional    | A manual GitHub Pages workflow exists, but no public repository or deployment has been authorized.                         | Publish and verify Pages after approval.                                     |
| Monetization         | Not reviewed   | The project is free/open source; sustainability is undecided.                                                              | Decide whether funding is needed after adoption signal.                      |
| Economics            | Not reviewed   | MVP static hosting can be low cost; maintenance and support load are unknown.                                              | Track issue volume and maintainer hours during alpha.                        |
| Rights               | Conditional    | Apache-2.0 and a direct-dependency ledger are in place; transitive licenses and the name need review before publication.   | Run a release license audit and name search.                                 |
| Trust and risk       | Conditional    | Local-only reduces exposure; backup validation and destructive confirmations are implemented, while deeper review remains. | Threat-model storage and export before public release.                       |
| Execution            | Conditional    | The complete local MVP builds and automated checks pass; ongoing maintenance capacity is unmeasured.                       | Run household validation and record maintainer effort.                       |

**Decision: conditional go** for a local-only proof of value. Do not claim validated demand, secure sync, or production readiness yet.
