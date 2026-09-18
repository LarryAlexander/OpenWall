# ADR 0001: LAN-first multi-device sync

- **Status:** Proposed
- **Date:** 2026-09-14
- **Scope:** Future Milestone 4 architecture

## Decision

OpenWall's first multi-device sync design will prioritize devices on the same
household Wi-Fi network. It will preserve the current local-only mode and will
not require Bluetooth, a hosted account, or newly purchased hardware.

The initial prototype may run the sync service on an existing Mac. If the
workflow proves useful, the service can later be packaged for an always-on
home device such as a NAS, Raspberry Pi, or Mac mini.

## Operating model

- Each device keeps its own local IndexedDB database and remains usable while
  the network or sync service is unavailable.
- A local sync service coordinates encrypted changes between household devices.
- Wi-Fi is the primary transport. Bluetooth may assist with setup in the
  future, but it is not part of the sync protocol.
- GitHub Pages remains a static client host; it does not become the household
  sync server.
- Remote or cellular-data sync is a later opt-in extension, not a requirement
  for the first prototype.

## Initial data boundary

The first sync experiment should focus on structured household records:
schedules, tasks, routines, lists, completions, and other small records that
the household explicitly chooses to share. Appearance, Guide state, browser
permissions, and other device-specific preferences remain local by default.

Photos and other large binary assets are excluded from the first sync slice.
They require separate decisions about encrypted blob storage, quotas,
deletion, and recovery.

## Security and recovery requirements

Before implementation, Milestone 4 must define:

- household identity and device enrollment;
- client-side encryption and key recovery;
- device revocation and lost-device handling;
- stable record identifiers, tombstones, and conflict resolution;
- schema migration and protocol versioning;
- export, restore, and audit visibility.

This record does not authorize sync implementation. It records the starting
direction for the later high-risk architecture review.

The detailed review and approval gates are tracked in the
[Milestone 4 plan](../MILESTONE_4_PLAN.md) and
[ADR 0002](0002-milestone-4-sync-security-and-protocol.md). Until ADR 0002 is
approved, OpenWall remains local-only and single-browser-profile by design.

## Alternatives considered

- **Bluetooth-first:** rejected as the primary transport because of range,
  reliability, background-execution, and browser constraints.
- **Cloud-first sync:** deferred because it introduces hosted identity,
  availability, and privacy obligations before the household workflow is
  validated.
- **Shared iCloud or JSON database files:** rejected because concurrent browser
  writes and partial file synchronization do not provide safe record-level
  conflict handling.
- **Peer-to-peer browser sync with no local service:** useful as an experiment,
  but too dependent on an awake, reachable peer for a reliable household
  product.
