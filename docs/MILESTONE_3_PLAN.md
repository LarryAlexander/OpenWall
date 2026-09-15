# Milestone 3: Shared household utilities

## Delivered slice

Milestone 3 is delivered as one local-first household utility layer. Week
planning, reusable routines, shared lists, meal planning, display scheduling,
and local photo rotation make OpenWall useful across a household's week
without making the Today board noisy.

## Current foundation

The codebase already contains partial support for:

- Week and Lists navigation;
- all-day, school-closure, reminder, holiday, early-dismissal, and personal-day
  schedule kinds;
- recurring schedules;
- routines and routine occurrences;
- household lists and list items;
- meal plans linked to grocery list items;
- device-local display scheduling;
- multiple explicitly selected local photos;
- local persistence and versioned backup/restore.

The first implementation work should consolidate and verify this foundation,
not introduce a second persistence model.

## Current branch progress

- Week now expands daily and weekly schedule recurrence across its seven-day
  grid or mobile agenda.
- Week now includes due household tasks and routine occurrences, with completed
  state visible and actionable from the plan.
- Skipping today's pending routine occurrence removes its actionable task while
  retaining the routine, skipped occurrence, and history record.
- Browser coverage verifies Week and list-item persistence on wall, compact,
  tablet, and phone profiles.
- Meal plans persist through Dexie and backup/restore; ingredients can be added
  to a deduplicated grocery list while retaining their source meal.
- Focus and sleep windows are evaluated on the display device and never added
  to household backups.
- Photos accept multiple explicitly selected files and rotate on the board
  locally every 30 seconds.

## Milestone acceptance criteria

- A household can plan the next seven days with timed and all-day items.
- School closures and other all-day exceptions remain visibly distinct.
- A parent can create a recurring routine, assign it, complete an occurrence,
  and skip one occurrence without deleting the routine.
- A household can create grocery, school, packing, chore, and custom lists,
  add items, complete items, and remove items safely.
- Week, routine, list, and meal records survive reload, offline startup, backup, and
  restore according to their documented scope.
- Today remains a glanceable summary rather than a second full planning board.

## Explicit non-goals for this milestone

- multi-device sync;
- third-party calendar authorization;
- shared photo albums or remote photo sources;
- AI-generated household changes.

## Next review point

Run a realistic school-week household trial with at least two utilities in
regular use. Confirm the Today board remains glanceable, local photo storage is
comfortable for the target devices, and display schedules match the household's
quiet hours before opening Milestone 4 sync implementation.
