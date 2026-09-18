# ADR 0002: Milestone 4 sync security and protocol review

- **Status:** Proposed
- **Date:** 2026-09-14
- **Scope:** Optional LAN or managed-cloud multi-device sync
- **Depends on:** [ADR 0001](0001-lan-first-multi-device-sync.md)

## Context

OpenWall currently stores household records in one browser profile through
Dexie/IndexedDB and exports a versioned whole-household backup. GitHub Pages is
only a static client host. Milestone 4 may add an opt-in self-hosted service on
the household LAN or evaluate a managed cloud path such as Firebase, but sync
changes identity, authorization, encryption, deletion, migration, recovery,
cost, support, and data-residency boundaries.

The current snapshot replacement path cannot safely merge concurrent edits. The
current records also do not carry device, operation, revision, or tombstone
metadata. This ADR therefore records the decisions that must be settled before
implementation, not an authorization to build sync.

## Provisional principles

1. Local-only mode remains complete and is the default.
2. GitHub Pages never becomes the household sync backend.
3. Sync is opt-in, visible, reversible, and recoverable through export.
4. The first slice syncs small structured household records only; photos and
   other large binary assets stay local until separately designed.
5. Every mutation must be retryable and idempotent without relying on wall-clock
   ordering alone.
6. Deletion is a first-class operation with tombstones and a documented
   retention/recovery policy.
7. No sync success claim is made until two-device offline/concurrent/recovery
   tests and owner-controlled manual checks pass.
8. The local-first product-completion track can proceed independently of sync.
   A cloud convenience must not become a prerequisite for the core household
   workflow.

## Decisions required

### Identity and authorization

Define the household identifier, creator/admin authority, device identity,
member roles, least-privilege capabilities, and whether a child device can
write all synced entity classes. Enrollment must be approved by an existing
authorized device or by an equivalent user-held recovery process. Revocation
must prevent future accepted writes from that device and must be visible in an
audit view.

### Encryption and recovery

Choose what is encrypted on the client, which metadata the service can see,
how device keys are provisioned, how a household key is wrapped for devices,
and how recovery works after loss of the last enrolled device. The design must
state what happens when the recovery secret is lost; “encrypted” must not imply
that recovery is automatic.

### Operation and conflict model

Choose stable entity identity, operation identity, causal/revision metadata,
duplicate handling, retry semantics, and deterministic behavior under
concurrent edits. Define entity-specific rules for schedules, tasks, routines,
occurrences, lists, meals, rewards, history, activities, members, and household
metadata. User-visible conflicts must be reviewable when automatic merge is not
safe.

### Deletion and recovery

Define tombstone retention, delete-versus-edit behavior, restore behavior,
service-side export, client-side export, and whether an administrator can
recover a deleted record. Revocation, erase, and disable-sync flows must not
silently delete the local household.

### Versioning and migrations

Define protocol negotiation, unsupported-version behavior, additive versus
breaking schema changes, failed migration recovery, and compatibility between
old clients and a newer service. A protocol version must not be inferred from
the app version alone.

### Transport and service boundary

Confirm LAN-only scope, service discovery, address changes, transport security,
pairing, rate limits, logging, service storage permissions, and restart/backup
behavior. Explicitly test whether the public HTTPS Pages origin can reach the
LAN service in the supported wall/tablet/phone browsers, including mixed-content
blocking, local-network permission, CORS/private-network headers, and
certificate trust. The service must not be bundled into or deployed as part of
the public static client without a later explicit decision.

### Managed-cloud alternative: Firebase candidate

Firebase is a candidate implementation path, not a decision. A potential
composition is Firebase Authentication, Firestore, and narrowly justified
Cloud Functions, with Firebase Storage deferred for photos and other large
blobs. The candidate offers managed reachability, authentication, rules, and
operational tooling, but introduces accounts, cloud-held metadata or
ciphertext, vendor dependence, billing exposure, support obligations, and
additional privacy/deletion requirements.

If evaluated, the design must preserve Dexie as a useful local cache/source for
the UI, use explicit operations/outbox/cursors/tombstones rather than whole
snapshot mirroring, and define client-side conflict behavior. Firebase's
offline behavior and same-document last-write-wins semantics are not by
themselves an acceptable OpenWall conflict policy.

The feasibility work must model 250 monthly active users versus 250
households, peak reads/writes, authentication method, functions, storage,
downloads, backups, monitoring, budget alerts, and account deletion. It must
use the Firebase Emulator and fictional data before any production project.
The owner must choose LAN, Firebase cloud, hybrid, or defer before cloud
implementation, credentials, or user-facing cloud-sync claims are introduced.

## Alternatives to evaluate

- server-authoritative whole-snapshot replacement: simple but unsafe for
  offline/concurrent edits and inconsistent with local-first recovery;
- last-write-wins records: simple but clock-sensitive and capable of silently
  discarding household changes;
- append-only operations with client-side merge: more work but supports
  retries, audit, tombstones, and explicit conflict handling;
- cloud-first identity and storage: candidate for evaluation because it may
  improve reachability and reduce service setup, but it expands availability,
  account, privacy, cost, and vendor obligations beyond the first same-home
  experiment.

## Required evidence before approval

The [Milestone 4 risk review](../MILESTONE_4_RISK_REVIEW.md) is the current
evidence and risk-register baseline for this ADR.

- threat model covering an untrusted LAN peer, stolen device, revoked device,
  malicious client, replayed operation, service compromise, and lost recovery
  material;
- protocol fixtures for duplicate, delayed, reordered, concurrent, delete/edit,
  clock-skew, and unknown-version cases;
- a written data boundary showing exactly which fields leave the browser;
- a service backup/restore and client export/restore procedure;
- a rollback path that leaves existing local-only use intact;
- owner review of the proposed identity, encryption, conflict, deletion, and
  recovery rules.
- Firebase Emulator and Security Rules evidence if the managed-cloud path is
  selected for implementation;
- a documented 250-user cost and operating model, including a budget-alert and
  disable/exit plan.

## Approval

Implementation, dependency additions, Dexie sync migrations, network access,
Firebase project creation, service deployment, and user-facing sync claims
remain blocked until this ADR is approved and the corresponding milestone plan
gate is signed off.
