# Changelog

All notable changes to OpenWall are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Touch-friendly card reordering in Arrange mode on tablet and phone layouts.
- Responsive Arrange controls for moving cards up or down and making them shorter or taller when gesture dragging is inconvenient.
- Automated overflow coverage for common iPad portrait and landscape sizes.
- Maintainer guidance for deciding when and how to update this changelog.

### Changed

- Responsive corkboard layouts now fit the available screen width without forcing horizontal clipping.
- Tablet portrait layouts use the complete bottom navigation and account for device safe areas.

### Fixed

- Corrected an end-to-end test selector that caused a GitHub Actions run to fail after opening Guide.
- Made touch dragging use a larger grab surface and resilient pointer handling in Safari and embedded browsers.
- Kept the actively manipulated card above overlapping neighbors so drag and resize handles remain reachable.

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
