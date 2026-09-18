# Milestone 4 risk review

## Scope and review posture

This review covers the proposed optional same-home LAN sync described in
[ADR 0001](decisions/0001-lan-first-multi-device-sync.md) and the decision
gates in [ADR 0002](decisions/0002-milestone-4-sync-security-and-protocol.md).
It is an engineering risk review, not legal clearance, security certification,
or a claim that sync exists.

The intended users are household organizers and family members, including
possible child or teen profiles. Relevant data includes member names and roles,
schedules, tasks, routines, lists, meals, rewards, activity/history records,
and locally selected photos. The current distribution route is a static PWA on
GitHub Pages. The proposed service would be self-hosted on an existing home
computer and would be opt-in.

No jurisdiction, retention period, threat tolerance, service operator, or
recovery owner has been formally selected. Those omissions are decision inputs,
not assumptions that a later implementation may silently fill in.

## Current evidence

- `src/types.ts:5-329` defines household records with `householdId` and some
  timestamps, but no device identity, operation identity, revision, actor,
  tombstone, or sync cursor.
- `src/db.ts:48-126` defines Dexie schema versions through version 5, and
  `src/db.ts:136-168` exposes whole-record save/delete methods rather than an
  operation log or sync boundary.
- `src/db.ts:213-274` implements `replace()` by clearing local tables and
  repopulating them transactionally. That supports restore, not concurrent
  merge or safe remote replacement.
- `src/backup.ts:129-214` validates and emits a readable schema-version 5
  household snapshot. The backup includes optional photos and board widgets;
  it is not an encrypted key-management container.
- `src/App.tsx:2541-2664` tells users that data stays on the device, offers
  readable export/restore, and labels the current state “Local only.” The
  existing “Sync local data” action refreshes the browser's local copy; it is
  not multi-device synchronization.
- No sync server, network client, enrollment flow, cryptographic dependency,
  audit view, device revocation flow, or sync-specific UI exists today.

## Data-flow boundary

### Current behavior

```text
GitHub Pages static app -> browser/PWA -> Dexie/IndexedDB
                                      -> readable local backup on user export
Selected weather lookup ----------------> Open-Meteo, with local cached result
```

The current app does not upload household records. The proposed first sync
experiment may add:

```text
Browser A -- encrypted sync envelope + required protocol metadata --> LAN service
Browser B <-- encrypted sync envelope + cursor/ack metadata -------- LAN service
```

The exact fields visible to the service, including household/device IDs,
record type, timestamps, sizes, and membership metadata, remain an approval
decision. The first slice must exclude inline photo data and other large blobs
until a separate data, quota, deletion, and recovery design exists.

## Risk register

| ID | Risk and classification | Why it matters | Required control and evidence | Gate |
| --- | --- | --- | --- | --- |
| R1 | Key loss or key theft — critical | A lost last device could make the household unrecoverable; a copied key could expose all synced records. | Define key generation, wrapping, storage, rotation, revocation, destruction, and recovery-loss behavior. Test lost-device recovery and backup restore with no plaintext key leakage. | Blocker |
| R2 | False end-to-end-encryption claim — critical | A service that can decrypt or forge records is materially different from one that only relays opaque ciphertext. | Specify encrypted fields, authenticated metadata, device authentication, operation signatures or equivalent integrity, and what the server can observe or alter. Obtain cryptographic review. | Blocker |
| R3 | Malicious or compromised LAN service — high | Same-home network presence does not prove service identity or authorization. A rogue peer could replay, inject, suppress, or observe metadata. | Use authenticated transport plus application authorization, replay/idempotency controls, least-privilege service storage, and a documented trust model. Test rogue service, replay, and revoked device cases. | Blocker |
| R4 | Static client compromise — high | A malicious or compromised app update can read browser-held keys and household data while the app is running. Client-side encryption cannot compensate for an untrusted client. | Define release/update trust controls, dependency review, CSP and browser security posture, key exposure limits, and incident recovery. Do not claim protection against a compromised client. | Blocker |
| R5 | Concurrent edits silently lost — high | Whole-snapshot replacement or timestamp-only last-write-wins can discard a parent’s or child’s offline change. | Use operation IDs, causal/revision metadata, deterministic entity-specific merge rules, and visible manual conflict review. Test delayed, duplicated, reordered, concurrent, and clock-skewed operations. | Blocker |
| R6 | Delete/edit resurrection — high | A stale device can recreate a record after another device deletes it, or a restore can unintentionally undo deletion. | Define tombstones, retention, delete-vs-edit precedence, restore semantics, and audit visibility. Test offline deletion followed by reconnect and restore. | Blocker |
| R7 | Authorization enforced only in the UI — high | A child or revoked device could submit writes directly if the service trusts client labels or hidden controls. | Make authorization server-verifiable and bind operations to enrolled device capabilities and household membership. Test direct unauthorized requests, role changes, and revocation. | Blocker |
| R8 | Plaintext or overbroad backup exposure — high | Current backups are readable JSON and can contain household records, photos, and board weather data. Sync keys or service credentials must not be casually added to that export. | Decide whether backups are plaintext, passphrase-protected, or contain only encrypted key envelopes. Clearly label backup contents and test export, restore, and secret-loss behavior. | Blocker |
| R9 | Metadata leakage — medium/high | Even opaque payloads may reveal household size, record types, timing, device presence, or activity patterns. | Minimize service-visible metadata, document residual leakage, avoid unnecessary logs, and define log retention/deletion. Test what a service operator can infer. | Review |
| R10 | Service recovery and operational failure — high | A self-hosted service can be stopped, moved, corrupted, or upgraded independently of the client. | Document service storage, backup/export, restart, upgrade, shutdown, and corruption recovery. Prove unsent local operations survive service loss. | Blocker |
| R11 | Browser/device capability drift — medium | PWA storage, Web Crypto support, local-network permissions, and certificate handling vary by browser/device. | Define supported browsers and degraded local-only behavior. Test configured wall, compact, tablet, and phone profiles plus offline startup. | Review |
| R12 | Child/minor and household privacy obligations — high/unknown | Names, schedules, rewards, and activity/history may concern minors; legal obligations vary by jurisdiction and deployment model. | Obtain qualified privacy/legal review before public sync, minimize data, document retention/erase, and avoid surveillance or behavioral-scoring claims. | Blocker for public release |
| R13 | Board/layout semantics unclear — medium | A wall layout that works on one viewport may be harmful or confusing on another device. | Decide whether layout is shared, per-device, or split into household content and local presentation. Test different dimensions and conflict behavior. | Review |
| R14 | Public HTTPS client to LAN service may be unavailable or inconsistent — critical/unknown | GitHub Pages is a secure public origin, while a home service is likely a private HTTP origin or uses a certificate that household browsers do not trust. Fetch/XHR/WebSocket requests can be blocked by mixed-content and local-network protections before application authentication runs. | Build a browser matrix proof for Pages origin to loopback, `.local`, private-IP, and locally trusted HTTPS endpoints. Verify CORS/private-network headers, permission prompts, certificate setup, Safari/WebKit behavior, and failure messaging. Keep a same-origin/local-hosted fallback as an explicit option. | Blocker |

## Critical launch blockers

Milestone 4 must not ship or be advertised as available until R1–R8, R10, and
R14 have approved controls and evidence. R12 also blocks public distribution
until qualified privacy/legal review covers the actual jurisdictions and user
model.

The following are explicitly not sufficient by themselves:

- the service being on the home Wi-Fi network;
- a browser being able to resolve or ping the service address;
- HTTPS without application-level device authorization;
- AES-GCM or another standard primitive without a complete key lifecycle;
- a green unit/build test suite without two-device recovery tests;
- a local backup that has not been restored and inspected;
- a UI that hides unauthorized buttons without server enforcement.

## Evidence-based design constraints

Current authoritative guidance supports the following constraints without
settling the final protocol:

- The [W3C Web Cryptography Level 2 Recommendation](https://www.w3.org/TR/webcrypto-2/)
  exposes primitives including AES-GCM, AES-KW, HKDF, PBKDF2, key import/export,
  and key agreement. API availability does not decide key custody, recovery,
  authorization, or application protocol safety.
- OWASP's [Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
  starts with the threat model, recommends authenticated modes where available,
  and treats key storage and separation from data as architectural concerns.
- OWASP's [Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
  requires an explicit lifecycle for generation, distribution, storage,
  compromise, recovery, and destruction; it warns against plaintext key
  storage and calls for integrity protection on stored keys.
- OWASP's [Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
  distinguishes server identity from client identity. A protected transport
  therefore does not replace device enrollment and authorization.
- [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
  treats key management and recovery as application-specific responsibilities;
  recovery must be designed rather than assumed.

These sources are engineering guidance, not a formal security assessment or
legal determination for OpenWall.

## Transport feasibility gate

The proposed public-client-to-LAN path is not yet an approved deployment
assumption:

- The [W3C Mixed Content specification](https://www.w3.org/TR/mixed-content/)
  treats programmatic requests such as XMLHttpRequest/fetch as blockable when a
  secure page attempts to use an insecure resource. An `http://192.168.x.x`
  service therefore cannot be assumed reachable from the HTTPS Pages client.
- Current [local-network access guidance](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access)
  describes secure-context restrictions, browser permission state, and
  address-space handling. Support and permission UX must be tested rather than
  inferred from one browser.
- Chrome's [Private Network Access documentation](https://developer.chrome.com/blog/private-network-access-preflight)
  describes secure-context requirements and a server opt-in preflight model;
  its rollout status has changed over time, so the service must tolerate both
  current and future enforcement.
- A local `localhost` service is a useful same-device harness, but it does not
  prove that a wall display or tablet can reach a service hosted on another
  household computer.

The first transport experiment should test these four paths independently:

1. Pages HTTPS origin to same-device loopback;
2. Pages HTTPS origin to a private-IP HTTP service;
3. Pages HTTPS origin to a locally trusted HTTPS service;
4. a same-origin app served by the local service to another household device.

The result must record browser, version, device, address, permission state,
certificate/trust setup, CORS response, and failure mode. Until this matrix is
green for the supported wall/tablet/phone profiles, protocol work may use a
local fixture or same-origin harness but must not claim that the public Pages
client can sync over LAN.

## Accepted risks for the architecture-review phase

- There is no sync exposure today because the current product remains
  local-only and no service or network client exists.
- A development-only LAN prototype may use fictional data and a deliberately
  narrow threat boundary, but it must not be presented as production-safe or
  enabled in the public Pages demo.
- The first design may defer photo/blob synchronization and shared board
  layout; deferral must be visible rather than represented as complete sync.

## Required specialist review

- Independent security/cryptography review of the key, enrollment, operation
  integrity, revocation, and recovery design before implementation approval.
- Qualified privacy/legal review for actual launch jurisdictions, minors,
  retention, deletion, household roles, and self-hosted operator obligations.
- Platform/browser review if the design relies on Web Crypto algorithms,
  persistent storage, local-network permissions, or PWA update behavior beyond
  the configured test profiles.

## Next action

Resolve the transport feasibility gate and the other blocker decisions in ADR
0002 using this register, then request explicit owner approval. Only after
approval should Slice B add protocol types and deterministic fixtures; no
current risk justifies modifying the local data schema or adding a network
dependency yet.
