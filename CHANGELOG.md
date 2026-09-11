# Changelog

All notable changes to OpenWall are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Touch-first mobile personal home with member switching, quick task/schedule actions, and a dedicated path back to the full corkboard.
- Family Rewards upgrade with configurable Star values, member balances, streaks, levels, reward shop, shared goals, weekly progress, activity feed, reactions, child approval states, and parent corrections.
- Device-only parent PIN unlock for protected reward actions, with 15-minute sessions and no backup/export of the PIN.
- Version 3 local persistence and backups for reward definitions, goals, redemptions, activities, reactions, and migration-safe task values.
- Child-profile approval preferences, task-level Star values, reward redemption requests, and shared goal progress are persisted locally.
- Explicit “Update now” action for detected PWA releases, with an in-progress state and safe fallback reload; household data remains in the local repository across updates.
- Visible **Add person** control beside the board’s member filters, available after setup and linked to the People editor.

### Added

- An eight-person fictional testing household available from onboarding and Settings for responsive and member-filter testing.
- Working Week, Calendar, Lists, History, People, Rewards, and Photos destinations replacing the previous disabled placeholders.
- Richer schedule metadata and local dashboard views for future household planning.
- A dependency-free changelog guard that blocks user-visible deployments without an Unreleased entry.
- Version 2 backup metadata for board widgets, schedule kinds, member roles, routines, history, rewards, and local photos.
- Schedule-linked countdown cards that stay synchronized with future events.
- Repository-backed local photo metadata and parent-correctable reward adjustments.
- Person filtering in History for quick, household-friendly review.
- Weekly routines now require and retain an explicit weekday.
- Added a dependency-free service-worker fallback so cached app-shell behavior remains available on static hosting.

### Changed

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

### Changed

- Card manipulation controls now stay hidden until hover, keyboard focus, or touch selection.
- Removed the separate Arrange mode: cards can now be moved directly from their persistent grip, while selecting or hovering reveals size, lock, and remove controls.
- Tablet and phone cards now reorder by direct dragging instead of manual up/down buttons.
- Responsive corkboard layouts now fit the available screen width without forcing horizontal clipping.
- Tablet portrait layouts use the complete bottom navigation and account for device safe areas.

### Fixed

- Corrected calendar, history, activity, and upcoming labels that could display clock values where formatted dates were expected.
- Prevented long labels and button text from colliding by enforcing flexible text wrapping, stable icon sizing, and minimum-width containment.
- Corrected an end-to-end test selector that caused a GitHub Actions run to fail after opening Guide.
- Made touch dragging use a larger grab surface and resilient pointer handling in Safari and embedded browsers.
- Kept the actively manipulated card above overlapping neighbors so drag and resize handles remain reachable.
- Replaced the unreliable drag-resize handle with explicit smaller and larger controls that work with touch, mouse, and keyboard.

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
