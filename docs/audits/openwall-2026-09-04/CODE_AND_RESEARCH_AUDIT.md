# OpenWall Code and Research Audit

- **Date:** 2026-09-04
- **Audited revision:** `25e11811e114312290dca1187f48248a567f6858`
- **Live site:** <https://larryalexander.github.io/OpenWall/>
- **Scope:** product flow, responsive UX, persistence, backup/restore, accessibility, PWA installation/offline behavior, security posture, CI, and public deployment
- **Method:** source inspection, live HTTP/manifest/service-worker inspection, current primary-source research, existing automated test evidence, and GitHub workflow evidence
- **Excluded at owner request:** fresh screenshot and physical-device audit

## Executive verdict

OpenWall is a credible and unusually honest public prototype. The static application is live over HTTPS, the service worker precaches the app shell, household records survive tested reloads in IndexedDB, board and preference state survive tested reloads in local storage, and the UI explicitly discloses that there is no account or cross-device synchronization.

It is not yet safe to describe the local-first experience as durable. The largest gap is that the most distinctive user work—the freeform board layout and countdown cards—is excluded from backup and stored in an unversioned localStorage record. Browser storage remains best-effort, save failures are not communicated consistently, and the PWA manifest lacks the explicit raster icon sizes required by Chromium's documented installability criteria.

**Recommended gate:** keep the public-prototype label. Resolve P1 persistence/install findings before asking households to rely on OpenWall for a week.

## What is working well

- The product boundary is stated plainly: GitHub Pages delivers application files while household data remains in the current browser.
- Household replacement uses one Dexie transaction across household, member, schedule, and task tables.
- Imported backups are schema-checked and rejected before replacement when malformed or mixed across households.
- Destructive household replacement and erasure require confirmation.
- The service worker uses prompt-based updates and precaches the built application shell.
- The mobile bottom navigation now reserves visible destinations for Today, Guide, and Settings.
- Member identity combines names, symbols, and colors instead of relying on color alone.
- The onboarding tour includes a focus trap, Escape handling, focus restoration, reduced-motion styling, and restart controls.
- CI runs lint, unit tests, a production build, and critical Chromium flows at wall and phone sizes.
- The deployed site is served over HTTPS with HSTS, and the repository contains licensing, contribution, conduct, security, and dependency records.

## Prioritized findings

### P1 — Resolve before household reliance

#### 1. Backup does not protect the actual corkboard

Board placement, sizing, locking, notes, meals, photo placeholders, and countdown configuration are written to `openwall-board-{householdId}` in localStorage. `OpenWallBackup` only contains household, members, schedule items, and tasks. A backup can therefore restore the underlying household while losing the board users spent time arranging.

This boundary is disclosed in Settings, which is good, but it still conflicts with the strongest product promise: a customizable, dependable local-first board.

**Recommendation:** define a versioned `BoardState` schema, move it behind a repository, and include it in backup preview, export, validation, replacement, and migration tests.

#### 2. Household storage is best-effort, but the UI only reports app-shell caching

`offlineReady` records that a service worker is active or has emitted its offline-ready callback. It does not query `navigator.storage.persisted()`, request `navigator.storage.persist()`, estimate quota, or prove that IndexedDB/localStorage is protected from eviction.

Current browser guidance says IndexedDB, Cache Storage, localStorage, and service workers can be evicted under storage pressure unless persistent storage is granted. Caching the shell and protecting household data are separate states.

**Recommendation:** show two honest statuses in Settings—“app available offline” and “household storage protection.” Offer a user-triggered persistence request after setup, display granted/denied/unavailable outcomes, and retain backup guidance.

#### 3. Storage failures can be invisible or strand an interaction

Board writes catch localStorage failures and deliberately keep the in-memory board running, but no user-visible warning explains that the change was not saved. IndexedDB save/delete calls generally await the repository without a shared error boundary or actionable recovery notice. A rejected write can leave an editor open or produce an unhandled promise with no clear next step.

**Recommendation:** centralize persistence errors in an application service, preserve the last known durable state, announce failures through `role="alert"`, and offer Retry plus Export when possible. Add quota-denied and IndexedDB-unavailable tests.

#### 4. Chromium installation may not meet documented icon requirements

The generated manifest contains only SVG icons declared with `sizes: "any"`. Current Chromium documentation identifies explicit 192×192 and 512×512 icons as installability requirements. SVG is useful as an additional scalable asset, but it should not be the only evidence for the direct install prompt OpenWall advertises.

**Recommendation:** add real 192×192 and 512×512 PNG icons, a maskable 512×512 PNG, and an Apple touch icon; then verify `beforeinstallprompt` and installed presentation on real Chrome Android, Edge/Chrome desktop, and Safari iOS.

#### 5. Arrange mode is drag-only

Moving and resizing cards depends on pointer-drag handlers. There is no keyboard or single-pointer alternative such as directional move buttons, numeric position/size controls, or an accessible arrangement sheet. WCAG 2.2 Success Criterion 2.5.7 requires a non-dragging alternative unless dragging is essential.

**Recommendation:** add a focused card-arrangement panel with Move left/right/up/down, Grow/Shrink, Bring forward/back, Lock, and Remove. Keep dragging as the fast pointer path.

#### 6. Schedule editing uses the current device timezone rather than the household timezone

The schedule editor constructs a local `Date` from form fields and converts it to UTC with `toISOString()`. The household has an explicit timezone, but that timezone is not used to interpret the entered wall time. Restoring or editing from a device in another timezone can shift the intended household schedule.

**Recommendation:** convert schedule form values using the household timezone, store the instant plus explicit display timezone semantics, and test daylight-saving boundaries and cross-timezone editing.

### P2 — Resolve during the next hardening increment

#### 7. Offline readiness is both durable capability state and dismissible notification state

Closing the “Ready to use offline” message sets `offlineReady` to false even though the persisted readiness key remains true. Settings may temporarily report “Finish one online visit” until reload, then the notification can reappear. Capability and announcement visibility should not share one boolean.

**Recommendation:** keep immutable capability state separate from a dismissed-notice key.

#### 8. Household erase leaves associated board data behind

Erasure deletes the IndexedDB database but does not remove `openwall-board-{householdId}`. The orphan is not immediately reachable after the household disappears, but it remains on the device and can reappear if the same household identifier is restored.

**Recommendation:** include the household-specific board key in the confirmed erase transaction/cleanup path while preserving explicitly device-wide appearance and Guide preferences.

#### 9. Board local state has no runtime schema or migration path

Stored board JSON is cast directly to `BoardWidget[]`. Parsing failures fall back to defaults, but structurally valid malformed records are not validated, versioned, migrated, or recoverable through a preview.

**Recommendation:** validate with a versioned schema and preserve a recoverable copy before migration or reset.

#### 10. Generic dialogs and the add-card tray do not match the tour's accessibility quality

The tour traps focus and restores it correctly. The generic event/task/confirmation dialog listens for Escape but does not trap or restore focus, and the add-card tray has neither behavior. Background controls remain reachable to keyboard and assistive-technology users despite `aria-modal="true"`.

**Recommendation:** extract one tested modal primitive with initial focus, Tab containment, Escape, trigger restoration, background inertness, and scroll locking.

#### 11. Selection state is often visual-only

Main-navigation buttons do not expose `aria-current`, member filters do not expose `aria-pressed`, and several Guide category chips communicate selection only through CSS classes.

**Recommendation:** expose programmatic current/pressed states and add keyboard assertions.

#### 12. Validation errors are announced but not connected to their fields

Editor errors use `role="alert"`, but affected fields do not receive `aria-invalid` or `aria-describedby`. Users can hear that something is wrong without a direct field relationship.

**Recommendation:** connect each validation message to the relevant field and move focus to the first invalid control on submission.

#### 13. Version education has drifted

Settings derives the current version from the newest release entry, but Guide still displays `OpenWall 0.1.0` and only marks release `0.1.0` as seen when release history opens. The public package and newest release entry are `0.3.0`.

**Recommendation:** use a single exported product version everywhere and mark the currently displayed latest release dynamically.

#### 14. Service-worker update notification has a startup race

`registerSW()` can dispatch `openwall:update-ready` before React mounts and attaches its listener. Offline readiness has a later `serviceWorker.ready` recovery path; update readiness does not.

**Recommendation:** keep PWA lifecycle state in a shared module/store or pass it into the React root rather than relying on one-shot window events.

### P3 — Quality, performance, and operations

#### 15. Mobile safe-area insets are not applied to the fixed bottom navigation

The 72px bar is fixed directly to `bottom: 0`. Devices with home indicators can reduce usable target space or visually crowd labels.

**Recommendation:** add `env(safe-area-inset-bottom)` to height/padding and match the page's bottom inset.

#### 16. Settings is a very long undifferentiated mobile page

Installation, connectivity, appearance, backup, privacy, reset, and erasure are stacked into one long surface. Critical backup actions can sit several screens below the entry point.

**Recommendation:** add a compact Settings index or collapsible category sections, keeping storage protection and backup near the top.

#### 17. The production JavaScript bundle is large for reused household hardware

The current production build reports a roughly 508 kB minified JavaScript chunk before compression. Older tablets and wall computers are core target devices.

**Recommendation:** lazy-load Guide, release history, appearance tooling, and editor surfaces; establish a bundle budget in CI.

#### 18. Dependency vulnerability monitoring is not enabled

The lockfile is committed and installs are frozen, but GitHub's Dependabot alerts endpoint reports that alerts are disabled. The attempted package audit did not return usable evidence during this review, so the absence of vulnerabilities is not established.

**Recommendation:** enable dependency graph/Dependabot alerts, add a scheduled audit appropriate to project policy, and review action-version warnings.

#### 19. Deployment checks are narrower than CI

CI runs lint, tests, build, and wall/phone browser checks. The manually triggered Pages workflow installs and builds but does not itself require the corresponding CI revision to be green or rerun the browser checks.

**Recommendation:** make deployment depend on a successful protected CI workflow for the exact commit, or reuse a verified build artifact.

## Flow health from source and automated evidence

1. **Welcome and sample/setup entry — Healthy.** Two clear paths, privacy boundary, validation, and phone install education exist.
2. **Today board glance experience — Healthy for prototype use.** The dashboard reflows into stacked cards below 900px and retains large wall presentation above it.
3. **Add and arrange cards — At risk.** Pointer behavior and reload persistence are tested, but keyboard/non-drag operation and durable backup are missing.
4. **Schedule and task editing — Partial.** Core create/edit/complete flows persist, while timezone interpretation and storage-failure recovery need hardening.
5. **Guide and onboarding — Mostly healthy.** Search, tour, release history, and focused tour accessibility are strong; version state has drifted.
6. **Settings and mobile installation education — Partial.** The data boundary is unusually clear, but the mobile page is long and install assets need real-device proof.
7. **Backup, restore, and erasure — At risk.** Core records are schema-validated and transactional; board/countdown state is excluded and erasure leaves its local key behind.
8. **Offline reopening — Healthy within tested limits.** The app shell and saved household reopen in automated Chromium after a successful online visit; long-term storage durability is not established.
9. **Public delivery and CI — Healthy with operational gaps.** HTTPS, HSTS, reproducible install, build, unit tests, and wall/phone flows pass; dependency alerts and deploy-to-CI coupling are missing.

## Evidence reviewed

- Local and remote `main` both resolved to `25e11811e114312290dca1187f48248a567f6858` at audit start.
- GitHub CI run `33825264774` passed install, lint, 21 unit tests, production build, and 14 Chromium end-to-end flows across wall and phone profiles.
- GitHub Pages deployment run `33825336551` completed successfully for the same revision.
- Live HTML, manifest, JavaScript bundle, CSS bundle, service worker, precache entries, HTTPS, and HSTS were inspected directly.
- The generated manifest used relative `start_url` and `scope`, matching the repository subpath deployment.
- Firecrawl search was attempted but returned an out-of-credits response. Research continued through current primary documentation and Context7's current Vite PWA documentation.
- GitHub's Dependabot API reported that alerts are disabled; no “zero vulnerabilities” claim is made.

## Current research basis

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Trigger installation from your PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [MDN: Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [MDN: StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
- [web.dev: Storage for the web](https://web.dev/articles/storage-for-the-web)
- [Dexie: StorageManager guidance](https://dexie.org/docs/StorageManager)
- [W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Chrome: Installable manifest requirements](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest)
- [GitHub: Securing Pages with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Vite PWA React integration](https://github.com/vite-pwa/docs/blob/main/frameworks/react.md)
- [Skylight Calendar features](https://skylight.zendesk.com/hc/en-us/articles/48778850390171-Calendar-Features)
- [Hearth Display features](https://hearthdisplay.com/pages/features)
- [DAKboard](https://dakboard.com/site)
- [MagicMirror²](https://magicmirror.builders/)

## Verification limits

- No fresh visual screenshot audit was performed because the owner explicitly asked to skip it.
- No physical iPhone, iPad, Android, kiosk, assistive-technology, 200% zoom, or week-long household test was performed.
- Automated Chromium flows do not establish Safari/WebKit behavior or full WCAG conformance.
- A live install prompt was not proven on supported physical hardware.
- Browser eviction and long-idle retention were not simulated.

## Recommended implementation sequence

1. Version and back up the complete board, including countdowns.
2. Separate offline-shell readiness from persistent household-storage protection.
3. Add visible write-failure recovery and complete erase semantics.
4. Repair PWA icons and verify real-device installation.
5. Add non-drag arrangement controls and a shared accessible modal primitive.
6. Correct household-timezone schedule entry and expand date-boundary tests.
7. Remove version drift, PWA event races, and selection-state accessibility gaps.
8. Improve mobile Settings structure, safe-area handling, bundle size, dependency monitoring, and deployment gating.
