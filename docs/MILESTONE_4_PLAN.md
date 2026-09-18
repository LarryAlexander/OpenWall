# Milestone 4: Product completion and optional multi-device sync

## Status

Architecture review opened on 2026-09-14. Milestone 4 now has two coordinated
tracks: finish the local-first product and evaluate a safe path to optional
multi-device sync. Sync implementation is gated on explicit owner approval
after the security and protocol decisions below are resolved.

Milestone 3 household validation is still outstanding. This review may define
the next architecture safely, but it does not claim that the product is ready
for household sync or that the local MVP has been household-validated.

## Milestone shape

### Track 1 — Make the local-first product good

Finish the product around the existing local repository before adding cloud or
LAN dependencies. The work should prioritize the daily household journey and
release confidence:

- complete and record the Milestone 3 household trial;
- close the most important wall, tablet, phone, keyboard, accessibility, and
  error-state gaps;
- make backup, restore, local reset, storage failure, offline readiness, and
  upgrade guidance clear and recoverable;
- remove placeholder behavior and align product copy, Guide content, status,
  changelog, and demos with verified behavior;
- improve first-run setup, recurring routines, lists, meals, rewards, and the
  Today board through focused household feedback rather than broad feature
  expansion;
- measure the real support, hosting, and maintenance burden before choosing a
  paid convenience or hosted-service offer.

Exit: the local-only product remains useful without an account or network, its
known gaps are recorded, and a focused release-readiness review identifies any
remaining launch blockers.

### Track 2 — Choose and prove a sync path

Evaluate the existing self-hosted LAN direction and a managed cloud variant as
separate product options. Firebase is a candidate cloud path, not a selected
architecture and not an authorization to add accounts, network access, or
cloud dependencies.

## Sync goal if a path is selected

Allow a household to keep the same selected structured records available on
more than one device over the selected LAN or managed-cloud path, while
preserving these properties:

- each device remains useful when the network or sync service is unavailable;
- household data remains owned by the household and recoverable by export;
- GitHub Pages remains a static client host, not a sync backend;
- photos, browser preferences, Guide state, permissions, and other
  device-specific data remain local in the first slice unless explicitly added
  by a later decision;
- users can see sync state, enrolled devices, revocations, conflicts, and
  recovery actions without silent data loss.

## Non-goals for the first slice

- hosted accounts, vendor-managed cloud storage, or cellular synchronization
  in the local-first product before a separate product and privacy decision;
- automatic photo or other large-binary synchronization;
- background sync that requires the app to be continuously open;
- silently choosing a winner for edits to sensitive household records;
- replacing the existing local repository or backup flow;
- implementing encryption, authentication, or a network service before the
  security/protocol ADR is approved.

## Current findings

- The client is a React/TypeScript Vite PWA served statically by GitHub Pages.
- Dexie schema version 5 and `HouseholdSnapshot` are the current local data
  contract. Household records use stable-looking IDs and timestamps, but there
  is no device ID, operation ID, revision, actor, tombstone, or sync cursor.
- `serializeBackup()` emits a versioned whole-household JSON snapshot, while
  `repository.replace()` clears and repopulates local tables in one transaction.
  That is appropriate for restore, not for concurrent synchronization.
- Current structured records include schedules, tasks, routines, routine
  occurrences, lists, list items, meals, history, rewards, activities,
  reactions, attention state, members, and household metadata.
- Photos contain inline data URLs and board widgets can contain weather
  snapshots. These are unsuitable for the first encrypted record-sync slice
  without separate quota, blob, deletion, and recovery decisions.
- No sync server, network client, cryptographic dependency, enrollment flow, or
  sync UI exists in the repository today.

## Product-completion worklist

This worklist is in scope for Milestone 4 and can proceed without selecting a
sync architecture:

- [ ] Run the Milestone 3 household trial and record findings, not just a
  pass/fail impression.
- [ ] Triage the highest-impact usability, responsive-layout, accessibility,
  storage-failure, and offline-readiness issues.
- [ ] Exercise backup, restore, reset, upgrade, and failed-storage paths with
  fictional household data.
- [ ] Audit all user-facing claims against the guidance truth policy and
  remove stale or placeholder language.
- [ ] Define a small release-readiness checklist for the local-only product,
  including support, privacy, licensing, and deployment evidence.
- [ ] Validate the product promise and willingness to pay before committing to
  hosted sync, subscriptions, or a support offer.

## Proposed work sequence

### Slice A — Architecture and threat model

Document and approve the decisions in
[`decisions/0002-milestone-4-sync-security-and-protocol.md`](decisions/0002-milestone-4-sync-security-and-protocol.md):

Use the [Milestone 4 risk review](MILESTONE_4_RISK_REVIEW.md) as the current
scope, data-flow, risk-register, and specialist-review baseline.

1. household identity and membership;
2. device enrollment, capabilities, and revocation;
3. authorization model for parent/admin/child roles;
4. client-side encryption, key wrapping, and recovery;
5. record identity, operation ordering, retries, and idempotency;
6. conflict resolution for each synced entity class;
7. tombstones, retention, and deletion propagation;
8. protocol and schema versioning;
9. export, restore, audit visibility, and lost-device recovery;
10. LAN transport, service discovery, service hardening, and the public
    HTTPS-to-LAN browser feasibility matrix.

Exit: an approved ADR, a threat model with abuse cases, a defined sync
boundary, and a rollback plan that preserves local-only operation.

### Slice B — Protocol and local fixtures

Add pure, dependency-light protocol types and tests without connecting the app
to a network service. The first contract should include:

- protocol version and household identifier;
- client-generated device and operation identifiers;
- encrypted payload envelope and authenticated metadata;
- per-entity revision or causal metadata;
- idempotent push acknowledgement and pull cursor;
- explicit tombstone representation;
- conflict and migration error categories.

The fixture suite must exercise duplicate delivery, out-of-order delivery,
clock skew, concurrent edits, deletes versus edits, unknown protocol versions,
and failed local migrations. It must use fictional household data only.

Exit: protocol tests define behavior independently of HTTP, WebSocket, or any
particular server implementation.

### Slice B0 — Browser transport feasibility

Before connecting protocol fixtures to a service, test the supported wall,
compact, tablet, and phone browser profiles from the public HTTPS Pages origin
against loopback, private-IP HTTP, locally trusted HTTPS, and a same-origin
local-service harness. Record secure-context status, local-network permission,
CORS/private-network response headers, certificate trust, and failure UX.

This slice is a feasibility gate, not a sync implementation. If the public
Pages origin cannot provide a reliable supported path, the approval packet must
choose whether sync clients are served from the local service, use a separately
trusted local origin, or defer LAN sync rather than silently weakening browser
security.

### Slice B1 — Firebase cloud-sync feasibility

Evaluate Firebase as an alternative deployment path for households that want
multi-device access outside the home. This is a feasibility and product-design
slice only. It must not silently replace the LAN-first proposal or change the
local-only default.

The candidate stack is Firebase Authentication without phone/SMS as the first
option, Firestore for small structured records, and optional Cloud Functions
only where a measured server-side need exists. Firebase Hosting is optional;
the current static Pages client remains valid. Photos and other large blobs
stay local until storage, privacy, deletion, export, and cost decisions are
separately approved.

The feasibility packet must answer:

- Is the target 250 monthly active users, 250 households, or another unit?
- Which records are cloud-eligible, and which remain device-local?
- How do local Dexie data, an outbox, an operation log, cursors, tombstones,
  conflicts, export, and account deletion interact?
- What identity, enrollment, revocation, recovery, and child/shared-device
  rules are required?
- What can Firebase Security Rules enforce, and what must remain client-side?
- What is the encryption boundary, and how is recovery handled if the last
  trusted device is lost?
- What happens offline and when two devices edit the same record? Firebase's
  built-in offline behavior cannot be treated as OpenWall's conflict policy.
- What is the measured cost for 250 MAU, 250 households, peak usage, and
  optional photos? Include Firestore reads/writes/deletes, authentication,
  functions, storage, downloads, backups, monitoring, and a budget-alert plan.
- What data-residency, privacy, deletion, support, vendor-lock-in, and
  account-recovery obligations would a paid product assume?

Initial candidate tasks:

- [ ] Build a Firebase Emulator prototype with fictional households and
  Security Rules tests before any production project or real household data.
- [ ] Model collections and append-only operations rather than mirroring the
  whole Dexie snapshot into one mutable document.
- [ ] Test two-device offline edits, retries, duplicate delivery, revocation,
  export, deletion, and recovery.
- [ ] Measure a representative 250-user workload and document quotas, budget
  alerts, and the expected monthly range.
- [ ] Decide whether cloud sync is a separate paid convenience, an optional
  hosted tier, or outside the product scope.
- [ ] Obtain explicit approval of the identity, encryption, conflict,
  deletion, recovery, cost, and privacy design before implementation.

Current references to refresh before implementation: [Firebase pricing](https://firebase.google.com/pricing),
[Firestore quotas and limits](https://firebase.google.com/docs/firestore/quotas),
[Firestore offline data](https://firebase.google.com/docs/firestore/enterprise/enable-offline),
[Firebase Authentication](https://firebase.google.com/docs/auth/), and
[Firebase Security Rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

Exit: the owner has chosen LAN, Firebase cloud, hybrid, or defer; the selected
path has an approved data boundary and recovery model; emulator/rules tests and
two-device evidence exist; and the 250-user cost and operating assumptions are
written down. No production Firebase project or user-facing cloud-sync claim
is required to complete this feasibility slice.

### Slice C — Development-only self-hosted LAN service

After Slice A approval, and only if the owner selects the LAN path, prototype a
separately operated service for a local Mac or another existing household
computer. The service should relay/store only
the minimum encrypted sync envelope needed by the approved protocol, expose
health and protocol-version information, and have a documented setup,
backup/export, upgrade, and shutdown procedure.

The first service must be opt-in and development-only. It must not be deployed
to GitHub Pages, enabled for the public demo, or required for normal app
startup. Service authentication, TLS or equivalent LAN protection, rate
limits, logging, and storage permissions must be explicit in the approved
design.

Exit: two fictional client profiles can enroll, make offline edits, reconnect,
converge according to the approved rules, export the household, and recover
after the service is stopped and restarted.

### Slice D — Opt-in client integration

Only after the selected protocol, transport, and service slices pass their
gates, add a clearly opt-in Settings flow for enrollment, sync status, device
list, revocation, conflict review, export, and disable/reset behavior. A LAN
implementation may also need a service address. The existing local repository
remains the source of truth for the UI and remains fully
usable when sync is disabled or unavailable.

Exit: browser coverage proves local-first startup, offline edits, reconnect,
retry, duplicate delivery, conflict presentation, revocation, export, and
disable-without-data-loss. No copy or UI may imply that sync exists when it is
not configured.

## Proposed file areas after approval

Planning only currently touches documentation. The likely implementation
surface, subject to the approved ADR, is:

- `src/types.ts`: versioned sync metadata and protocol contracts;
- `src/db.ts`: additive outbox, cursor, tombstone, and device-enrollment
  persistence with a Dexie migration;
- `src/backup.ts`: explicit treatment of sync metadata, keys, and audit data;
- new pure protocol/merge modules and unit tests;
- new service directory outside the static client bundle, with its own tests,
  setup, storage, and security documentation;
- `src/App.tsx` and focused UI modules for opt-in enrollment and sync status;
- `e2e/openwall.spec.ts`: local-only and configured-sync journeys;
- `docs/GUIDANCE_TRUTH_POLICY.md`, `docs/PRODUCT_STATUS.md`, `README.md`, and
  `CHANGELOG.md` when user-visible behavior is actually introduced;
- a new ADR or an approved revision to the security/protocol ADR for every
  architecture change that affects identity, encryption, deletion, or recovery.

Firebase-specific implementation files are intentionally not authorized by
this plan. If the cloud path is selected, the likely additional surface would
include a separately reviewed Firebase project/configuration, Auth and
Firestore adapters, emulator/rules tests, privacy and deletion documentation,
and cost/usage instrumentation. Secrets and production credentials must never
be committed to the repository.

No schema, dependency, network, credential, or deployment change is authorized
by this planning document.

## Tradeoffs to resolve

| Question | Candidate direction | Main tradeoff |
| --- | --- | --- |
| Transport | HTTPS request/response with a pull cursor; optional live notification later | simpler recovery and testing, but public HTTPS-to-LAN browser access and certificate trust remain a separate feasibility gate |
| Sync model | append-only encrypted operations with client-side merge | strong retry/audit semantics versus more client complexity |
| Service knowledge | server validates membership metadata but cannot read record payloads | better privacy versus harder server-side conflict inspection and search |
| Enrollment | one-time code or QR approved by an existing household admin | clear human control versus setup friction on a wall browser |
| Key recovery | user-held recovery material plus exportable encrypted key envelope | recoverability versus responsibility for the recovery secret |
| Board layout | sync as a separate explicit decision from household records | shared positioning can be useful but device dimensions differ |
| Deployment path | self-hosted LAN, Firebase cloud, hybrid, or defer | reachability and convenience versus privacy, operating cost, and vendor dependence |

These are proposals for review, not settled decisions.

## Verification plan

- Run pure protocol, merge, and migration tests with deterministic clocks and
  simulated delivery failures.
- Run service tests for authorization boundaries, replay/idempotency,
  revocation, encrypted-payload handling, export, restore, and restart.
- Run the existing `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, and
  `pnpm check:changelog` gates after each user-visible integration slice.
- Run configured wall, compact, tablet, and phone browser profiles for local
  offline use and opt-in sync states.
- Manually validate two real devices, router/service restart, clock skew,
  lost-device revocation, and encrypted backup recovery before any release
  claim. These are not proven by browser automation alone.

## Rollback and recovery

- Keep sync behind an opt-in feature boundary and preserve the current local
  code path until the milestone exit review.
- Take a verified local backup before enrollment, schema migration, disable,
  or restore operations.
- Make service shutdown and client disconnect safe: unsent local operations
  remain queued locally, and disabling sync must not clear household records.
- If a protocol or migration proves unsafe, stop the service, disable the
  integration, restore the pre-sync local backup, and remove only the additive
  sync metadata through a documented migration or recovery tool.
- Do not publish, deploy, or advertise sync until the owner approves the ADR
  and the milestone evidence is recorded.

## Approval gate

Before implementation begins, Larry must approve:

1. the household/device identity and role model;
2. the encryption and recovery design;
3. the conflict, deletion, and migration rules;
4. the service transport, storage, and deployment boundary;
5. the first synced entity set and the decision to exclude photos/blobs;
6. the verification and rollback plan.

The owner must also choose whether Firebase is only a feasibility candidate or
an approved product direction, and whether any hosted sync would be a paid
convenience with a defined support and cost boundary.

Until then, OpenWall remains a local-only, single-browser-profile product.
