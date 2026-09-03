# OpenWall Next Phase: A Living Household Board

Last updated: 2026-09-03

## Outcome

Turn the visual corkboard into a dependable, editable household surface. Every card should hold real data, persist locally, survive backup and restore, and remain understandable from across the room.

The experience has three explicit modes:

1. **Glance:** read and use the board without accidentally moving anything.
2. **Arrange:** move, resize, lock, duplicate, or remove cards with undo available.
3. **Edit:** change one card's content and behavior in a focused sheet.

## Priority 1 — Real widget foundation

Replace the prototype-only board layout with a versioned `BoardWidget` record stored behind the existing repository layer.

Each widget needs:

- a stable local UUID and widget type;
- position, size, rotation, layer order, and locked state;
- type-specific configuration and content;
- created and updated timestamps;
- schema validation and safe defaults;
- inclusion in export, restore preview, sample reset, and household reset;
- a graceful unsupported-widget card for backups created by future versions.

Board interactions:

- explicit Save/Done feedback after arranging;
- undo and redo for layout changes;
- duplicate, bring forward, send backward, lock, and remove actions;
- keyboard movement and resizing in Arrange mode;
- optional alignment guides and soft edge snapping;
- reset-layout preview before replacement;
- no accidental canvas movement while using a card.

## Priority 2 — Functional countdown card

The countdown becomes a real clock derived from a target instant, not saved display text.

### Card data

```ts
type CountdownWidgetConfig = {
  title: string
  targetAt: string
  timezone: string
  displayMode: "auto" | "days" | "digital"
  completionMessage?: string
}
```

### Display behavior

- More than 48 hours away: show large remaining days plus the target date.
- Between 48 hours and one hour: show `1d 08h 24m`.
- Under one hour: show a digital `42:18` minutes-and-seconds clock.
- Completed: show the completion message and exact finished time; never display a negative number.
- Respect the household display timezone while retaining the target as an ISO-8601 instant.
- Update only as frequently as the visible precision requires to avoid unnecessary wall-display work.
- Pause visual urgency when reduced motion is enabled.

### Editing flow

The edit sheet asks for title, date, time, timezone, display style, and completion message. It includes a live card preview, validation for past dates, and an explicit choice to keep or remove a completed countdown.

### Acceptance

- The clock remains correct after sleep, reload, daylight-saving changes, and offline use.
- A target date can be changed without recreating the card.
- Screen readers receive a useful phrase instead of rapidly changing announcements.
- Fake timers cover days, hours, minutes, completion, and timezone boundaries.

## Priority 3 — Make every current card useful

### Notes

- editable title and body;
- paper color and optional member marker;
- pin/unpin and duplicate;
- URL detection without automatic network previews.

### Meals

- meal name, serving time, cook, and short preparation note;
- mark as planned, cooking, or served;
- promote a meal into the future weekly meal planner.

### Photos

- explicitly choose a local image;
- crop and focal-point controls;
- optional caption;
- honest warning that browser permission or storage cleanup can affect local files.

### Schedule and tasks

- edit actions available from the card without entering Arrange mode;
- configurable card filters such as member, date range, and incomplete-only;
- compact and comfortable density choices;
- clear empty states and hidden-item counts when a filter is active.

## Priority 4 — Board usability and personality

- Widget gallery grouped by **Plan**, **Remember**, **Celebrate**, and **Display**.
- Starter layouts: Daily rhythm, Busy family, Minimal, and Blank canvas.
- A lightweight board background picker using bundled textures and solid colors.
- Optional grid and freeform placement; freeform remains the default character.
- Consistent card menus and edit sheets across widget types.
- Full-screen presentation mode with controls hidden until touch, pointer movement, or keyboard focus.
- Phone mode becomes a companion editing list rather than a tiny draggable canvas.
- Tablet mode supports both reading and arrangement.

## Priority 5 — New household cards

After the foundation is stable:

- grocery and custom checklists;
- weekly weather summary with a clearly labeled source and cached last update;
- rotating announcements;
- habit or routine checklist without scores, streak pressure, or child surveillance;
- school-day packing list;
- shared links and QR cards;
- clock, date, and quiet-hours cards;
- local photo rotation;
- `.ics` calendar import preview.

## Delivery slices

### Slice A — Persistent widgets

Repository, schemas, backup support, card editing shell, and migration from the current prototype layout.

### Slice B — Countdown done properly

Create/edit flow, time calculations, live rendering, completion behavior, and focused tests.

### Slice C — Notes and board controls

Editable notes, duplicate/layer actions, undo/redo, keyboard arrangement, and snap guides.

### Slice D — Household utility cards

Meals, lists, schedule/task filters, and phone companion editing.

## Guardrails

- Local-first operation remains mandatory.
- Cards do not silently fetch or transmit household information.
- New permissions are requested only when a feature needs them and after a plain-language explanation.
- Community widgets eventually use a documented, versioned capability boundary; arbitrary third-party scripts are not loaded into the household board.
- Wall readability wins over fitting more cards onto the screen.

## Recommended next implementation

Build Slice A and Slice B together as the next vertical increment. That proves the architecture with one visibly meaningful feature: a countdown that a household can create, edit, watch, back up, restore, and trust offline.
