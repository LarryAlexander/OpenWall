# OpenWall Guidance Truth and Misleading-Claim Guardrails

Last updated: 2026-09-03

## Purpose

OpenWall guidance must never turn a reasonable assumption into a product claim. Help articles, tours, coach marks, release notes, and update messages should distinguish what works now from what is limited, planned, or dependent on the browser or device.

## Claim labels

- **Available now:** implemented behavior supported by current code or release evidence.
- **Limited:** implemented with an important boundary that appears beside the claim.
- **Planned:** roadmap work that must not be described as available.
- **Device-dependent:** behavior controlled by browser, operating system, permissions, or hardware.

Future Guide content may display these labels when the distinction helps a household make a decision. Ordinary instructions do not need a badge when the surrounding text is already unambiguous.

## High-risk reasonable assumptions

| Topic            | Misleading shorthand to avoid                 | Required truthful explanation                                                                                                                           |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backups          | “Back up your entire board.”                  | Version 2 backups include household records, routines, history, rewards, photos, and board layout when available. Guide preferences remain device-specific. |
| Offline use      | “Always works offline.”                       | Offline startup is expected only after one successful cached visit, and service-worker behavior varies by browser.                                      |
| Local-first      | “OpenWall never contacts a server.”           | Household data has no application backend or telemetry. The app still contacts its static host when loading or checking for an update while online.     |
| Storage safety   | “Your information is permanently saved.”      | Data remains in the current browser profile and can be removed by site-data cleanup, private browsing, storage pressure, or device loss.                |
| Device transfer  | “Restore everything on another device.”       | Version 2 backups transfer supported household records and board layout; device-specific Guide preferences do not transfer. |
| Photos           | “Add family photos.”                          | Photos can be selected, replaced, removed, and persisted locally through the repository; OpenWall does not upload them. Storage/quota failures remain possible. |
| Notes and meals  | “Edit notes and meal plans.”                  | These cards are currently visual placeholders. Editable notes and functional meal planning remain planned work.                                         |
| Calendars        | “Connect your calendar.”                      | Provider connections and `.ics` import are roadmap work, not current functionality.                                                                     |
| Multi-device use | “Keep every screen in sync.”                  | MVP data is local to one browser profile; cross-device synchronization does not exist yet.                                                              |
| Installation     | “Install on any device.”                      | Installation and kiosk controls depend on browser and operating-system support.                                                                         |
| Timezones        | “Countdowns handle every timezone perfectly.” | Countdowns retain an ISO target and use browser `Intl` timezone support; ambiguous daylight-saving transitions still require household review.          |
| Validation       | “Family tested” or “production ready.”        | Household usability and physical wall-display testing remain Larry-owned and must not be claimed before evidence is recorded.                           |

## Content review workflow

1. Draft each new guide or release claim from implemented behavior, not roadmap intent.
2. Identify storage, network, permission, device, timezone, and recovery assumptions.
3. Label or rewrite every limited, planned, or device-dependent statement.
4. Check the claim against code, current product status, and available verification evidence.
5. Review links and actions to ensure help cannot silently mutate household data.
6. Record product limitations in the related help article and release note, close to the benefit claim.
7. Re-audit guidance whenever persistence, backup schema, service-worker behavior, or integrations change.

## Release gate

Before publishing a release, search all user-facing guidance for claims involving `all`, `always`, `entire`, `every`, `never`, `secure`, `safe`, `synced`, `automatic`, `permanent`, and `production ready`. Each occurrence must be supported, scoped, or rewritten.

Release notes must describe only merged behavior. Automated checks establish build-level evidence; household testing, physical-device behavior, legal review, and public deployment remain separate claims.
