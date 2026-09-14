# Changelog

All notable changes to OpenWall are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added a Family Inbox rail with prioritized task, reminder, routine, reward, and storage attention items, plus acknowledge/snooze actions and role-aware member badges.
- Added a real Week agenda/grid, recurring routine occurrence records, shared household lists, expanded History actions, linked schedule countdowns, and local photo board actions.
- Expanded the eight-person fictional test bench with future closures, seeded history, pending approval, list items, routines, and countdown data.
- Expanded schema-version 4 backups and Dexie persistence for lists, routine occurrences, attention state, board layout, and expanded household records.
- Touch-first mobile personal home with member switching, quick task/schedule actions, and a dedicated path back to the full corkboard.
- Family Rewards upgrade with configurable Star values, member balances, streaks, levels, reward shop, shared goals, weekly progress, activity feed, reactions, child approval states, and parent corrections.
- Device-only parent PIN unlock for protected reward actions, with 15-minute sessions and no backup/export of the PIN.
- Version 3 local persistence and backups for reward definitions, goals, redemptions, activities, reactions, and migration-safe task values.
- Child-profile approval preferences, task-level Star values, reward redemption requests, and shared goal progress are persisted locally.
- Detected PWA releases can be installed through the Settings update action, with an in-progress state and safe fallback reload; household data remains in the local repository across updates.
- Visible **Add person** control beside the board’s member filters, available after setup and linked to the People editor.
- Working Clock and Mini calendar board widgets in place of the disabled More Widgets placeholder.
- Settings now keeps backup, local-data sync, and PWA update controls together, with honest local-only sync messaging and responsive action sizing.
- Rewards layouts now keep introductions, profiles, approval controls, and shop forms in stable responsive rows instead of squeezing text into narrow columns.
- Added content-driven vertical spacing between Rewards containers and removed fixed navigation heights so cards and navigation can grow naturally with their content.
- Kept the People “Everyone” filter button sized to its label across responsive card breakpoints.
- Added a persistent Settings “Update app” action with clear checking, ready, current, offline, and failure status messaging while preserving local household data.
- Added a Weather board module with explicit city or device-location setup, Fahrenheit/Celsius units, current conditions, a five-day forecast, cached readings, and stale-data messaging.
- Documented the weather data source and privacy boundary in Guide; selected coordinates and cached readings stay in the local board backup and are never uploaded by OpenWall.

- An eight-person fictional testing household available from onboarding and Settings for responsive and member-filter testing.
- Working Week, Calendar, Lists, History, People, Rewards, and Photos destinations replacing the previous disabled placeholders.
- Richer schedule metadata and local dashboard views for future household planning.
- Expanded the dependency-free changelog guard to inspect the full commit range and block user-visible deployments without an Unreleased entry.
- Versioned backup metadata for board widgets, schedule kinds, member roles, routines, history, rewards, and local photos.
- Schedule-linked countdown cards that stay synchronized with future events.
- Repository-backed local photo metadata and parent-correctable reward adjustments.
- Person filtering in History for quick, household-friendly review.
- Weekly routines now require and retain an explicit weekday.
- Added a dependency-free service-worker fallback so cached app-shell behavior remains available on static hosting.

### Changed

- Today now keeps future plans visible in a compact Upcoming rail, while Inbox stays reserved for actionable work.
- Board layout and photos use the repository as their source of truth so normal reloads, backups, and app updates preserve the same household state.
- Weather refreshes are user-initiated and network-dependent; the card keeps its last successful local reading available when the device is offline.

- Rebuilt Calendar as a traditional six-week month grid with previous/next navigation, a Today shortcut, selected-day agenda, event markers, and date-aware quick add.
- Reworked complex People, routines, rewards, and upcoming sections so controls stack cleanly instead of bunching on tablet and phone widths.
- Expanded household navigation so future plans and personal views are discoverable beyond Today.
- Added a documented `Changelog: none` exception for internal-only changes.

- A physical tear-off animation when removing a card, with reduced-motion support.
- Extra visible tacks on locked cards so their protected state reads naturally on the corkboard.
- Touch-friendly card reordering by direct dragging on tablet and phone layouts.
- Reliable smaller and larger controls on every layout.
- Automated overflow coverage for common iPad portrait and landscape sizes.
- Maintainer guidance for deciding when and how to update this changelog.

- Card manipulation controls now stay hidden until hover, keyboard focus, or touch selection.
- Removed the separate Arrange mode: cards can now be moved directly from their persistent grip, while selecting or hovering reveals size, lock, and remove controls.
- Tablet and phone cards now reorder by direct dragging instead of manual up/down buttons.
- Responsive corkboard layouts now fit the available screen width without forcing horizontal clipping.
- Tablet portrait layouts use the complete bottom navigation and account for device safe areas.

### Fixed

- Allowed CI and Pages changelog checks to inspect the complete commit range instead of failing against a shallow checkout.
- Installed both Chromium and WebKit in CI so the configured wall, phone, and iPad browser projects can all run.
- Corrected calendar, history, activity, and upcoming labels that could display clock values where formatted dates were expected.
- Prevented long labels and button text from colliding by enforcing flexible text wrapping, stable icon sizing, and minimum-width containment.
- Corrected overlapping History filters and rows, Rewards form alignment, People button sizing, tablet navigation footprint, broken-photo fallback states, and Rewards “View plan” navigation.
- Corrected an end-to-end test selector that caused a GitHub Actions run to fail after opening Guide.
- Made touch dragging use a larger grab surface and resilient pointer handling in Safari and embedded browsers.
- Kept the actively manipulated card above overlapping neighbors so drag and resize handles remain reachable.
- Replaced the unreliable drag-resize handle with explicit smaller and larger controls that work with touch, mouse, and keyboard.
- Corrected Today schedule/task text, board member controls, calendar highlights, and theme-colored actions so light, dark, and custom themes keep labels readable against their surfaces.
- Fixed portrait and tablet Calendar layouts so the month toolbar, weekdays, selected-day agenda, upcoming list, and seven-column date grid stay full width instead of collapsing into narrow vertical strips.
- Fixed portrait and tablet People layouts so the add-member description, name field, and action stay readable instead of being squeezed into the icon column.
- Added consistent spacing and wrapping between Rewards profile actions so Add star and View plan remain distinct touch targets.

## [0.3.0] - 2026-09-03

### Added

- Optional onboarding tour, searchable offline Guide, contextual coach marks, and bundled release notes.
- Device-aware installation education and plain-language offline and local-storage explanations.
- Appearance controls for themes, board surfaces, corners, text size, and motion.
- Live, timezone-aware countdown cards with editable display modes.

### Changed

- Expanded the original Today view into a customizable, freeform corkboard dashboard.

[Unreleased]: https://github.com/LarryAlexander/OpenWall/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/LarryAlexander/OpenWall/releases/tag/v0.3.0
