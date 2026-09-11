# OpenWall parent-life audit

Date: 2026-09-10  
Surface: `https://larryalexander.github.io/OpenWall/`  
Audience: a parent or household organizer managing children, school, work, chores, and a shared wall display

## Evidence reviewed

1. The live first-launch screen.
2. The live sample household board.
3. The live Add to the schedule dialog.
4. The live Settings and Guide views.
5. The supplied pegboard photo at `/Users/lathekid/Downloads/81077240637__E9FE2F26-ECAC-443F-A052-D7A317C0675A-preview.HEIC`.
6. The user's summary of the supplied `Call with Ikea.m4a` recording.

The Notes app currently reports **No Transcript** for the recording. The audio was not uploaded to a transcription service, so this audit does not claim a direct audio transcription. The findings attributed to the conversation come from the user's supplied summary: school closure dates, schedule-linked countdowns, unlocked side panels, history, recurring modules, a real calendar, child rewards, household expansion, and an editable photo module.

## Overall finding

OpenWall has a strong emotional foundation: the warm corkboard, large type, member chips, live countdown, and persistent left rail make the product feel like a family place rather than a productivity spreadsheet. The pegboard photo validates that direction. It also exposes the product promise the current prototype has not yet met: the rail implies a family system spanning today, future planning, lists, and settings, while the live app only delivers Today, Guide, and Settings. Week and Lists are visibly marked “Soon.”

For a busy parent, the current experience answers **“What is happening today?”** but not yet **“What should I prepare for next week, what repeats, what did we miss, and who owns it?”** The next phase should expand time, ownership, recurrence, and history before adding a large number of decorative widgets.

## Step-by-step journey audit

| Step | Parent task | Health | Evidence and finding |
|---|---|---|---|
| 1 | Open the wall and understand the day | Good | The first screen explains the privacy promise and offers sample/setup clearly. The sample board is glanceable and visually calm. |
| 2 | See the whole household | Good with a gap | Member chips and accessible symbols work well. The board currently filters schedule and tasks, but there is no personal home, private view, or per-person layout. |
| 3 | Plan a school week | Blocked | Week is disabled and labeled Soon. The schedule form accepts a date and times but has no all-day event, school closure, category, recurrence, or multi-day range. |
| 4 | Handle a closure or exception | Missing | There is no first-class “School closed,” holiday, early dismissal, teacher workday, sick day, or exception model. A parent would have to fake one as a generic timed event. |
| 5 | Add something that repeats | Missing | Chores and events are one-off records. There is no recurrence rule, skip-this-occurrence action, or “next occurrence” preview. |
| 6 | Connect a schedule item to a countdown | Partial | Countdown cards are live and editable, but a countdown is separately configured and not generated from a schedule item. Dates can drift or be duplicated. |
| 7 | Review what already happened | Missing | There is no history board, completed-event archive, missed-task view, or weekly recap. A parent cannot answer “Did we do that?” without remembering or searching elsewhere. |
| 8 | Give a child something they can own | Partial | A child can be assigned a task and complete it, but there is no personal surface, reward feedback, age-appropriate language, or parent-controlled reward policy. |
| 9 | Add a useful family module | Partial | The tray offers note, checklist, schedule, meal, countdown, and photo-style cards. The photo card is currently a visual placeholder with no select, upload, favorite, caption, or delete workflow. |
| 10 | Recover from a busy day | Good foundation | Local storage, backups, Guide, offline messaging, and Settings are honest and useful. The backup currently excludes board layout and countdown cards, which should be made more visible during restore planning. |

## Side panel audit and proposed information architecture

The rail should become a dependable set of destinations. Keep the first three primary and move less frequent tools into More so the wall remains calm.

| Destination | Job to be done | Release priority |
|---|---|---|
| Today | See current day, next item, urgent reminders, and completion progress | Current |
| Week | Plan seven days, school closures, recurring events, and linked countdowns | P0 |
| History | Review past events, completed chores, missed items, and weekly summaries | P1 |
| Lists | Open reusable chore, grocery, packing, and classroom lists | P0 |
| People | Add adults and children, set symbols, roles, defaults, and personal preferences | P0 |
| Rewards | Show each child's earned stars and parent-defined goals | P2 |
| Photos | Manage the local photo board and selected albums | P1 |
| Guide | Explain the product and current release | Current |
| Settings | Privacy, backup, appearance, install, reset, and data management | Current |
| More | A compact drawer for History, Rewards, Photos, and future integrations | P1 |

The disabled Week and Lists buttons should become active in the first useful feature release. A “Soon” label is a promise; leaving it in the main rail makes the missing capability feel like a broken product rather than a roadmap.

## Recommended product sequence

### P0: Make the schedule useful for school life

Add a calendar data model that distinguishes:

- timed event;
- all-day event;
- school closure or holiday;
- reminder;
- recurring event or chore;
- countdown target.

Store calendar dates separately from times and the household display timezone. Add day, week, and month/agenda views, a clear “school closed” visual treatment, and a link that can create or update a countdown from an event. A closure should be visible on Today even when no timed items exist.

### P0: Add reusable routines and lists

Make a list module that supports reusable templates such as Morning routine, Bedtime, School bag, Grocery run, and Chores. Each occurrence needs an assignee, due date, completion state, and optional star value. A parent should be able to skip one occurrence without deleting the routine.

### P0: Introduce people as owners, not only filters

Extend household members with role (`adult` or `child`), age-appropriate display preferences, default view, and optional personal color/symbol choices. Let cards target Everyone, selected people, or a single person. Start with shared visibility; defer private data until an explicit privacy model exists.

### P1: Build the history board

History should be a calm timeline with filters for person, date range, type, completed, skipped, and missed. It should explain retention and stay local. A weekly recap can show completed routines and upcoming exceptions without turning the wall into a scoreboard.

### P1: Make Photos real

Replace the placeholder with an explicit local-photo flow: choose one or more files, preview, crop or fit, add an optional caption, mark favorite, remove, and explain browser storage limits. Do not imply that a NAS, iCloud, or shared album is connected until it actually is.

### P2: Add a gentle rewards system

Use stars as private encouragement rather than competition. Parents define which chores or routines earn stars; a child sees their own total, recent wins, and one or more parent-defined goals. Avoid public rankings, automatic punishment, or rewards that silently change household data. Include pause, correction, and reset controls.

## Data shape to plan before implementation

The existing `ScheduleItem` should grow through a versioned migration rather than ad hoc fields. Plan for `kind`, `allDay`, `date`, `startsAt`, `endsAt`, `recurrence`, `schoolStatus`, `countdownLinkId`, `memberIds`, and `source`. Plan separate records for `Routine`, `RoutineOccurrence`, `HistoryEntry`, `PhotoCard`, and `RewardLedgerEntry`. Every record needs local UUIDs, created/updated timestamps, and an explicit household ID.

The key rule is that a repeated template and an individual occurrence are different things. Editing “every Tuesday” must not rewrite last Tuesday; skipping one occurrence must not delete the routine.

## Parent-centered acceptance checks

- A parent can mark tomorrow as a school closure in under 30 seconds.
- A recurring chore can be created once, assigned to a child, skipped for one date, and completed on the next date.
- A schedule event can create a linked countdown without duplicate manual entry.
- A parent can open Week, Lists, People, History, and Settings from the rail without encountering a disabled destination for a shipped feature.
- A child can identify their own assigned work without relying on color alone.
- A parent can see what was completed, skipped, or missed last week.
- A photo card has a real local file workflow and honest storage messaging.
- A reward can be corrected or removed by a parent and is never silently inferred from unrelated activity.
- Every new record survives reload, offline startup, export, and restore according to its documented scope.

## Questions for the next tester conversation

1. What is the first thing you need to know on a Monday morning: school status, departures, chores, or appointments?
2. Which items repeat every week, and which exceptions cause the most stress?
3. Should a child see the entire shared board, a personal board, or both?
4. What should “history” help you prove: completed chores, past schedules, missed work, or family memories?
5. Should stars represent effort, completion, or a parent-selected reward?
6. For photos, is the source the iPad camera roll, a shared album, or a local folder?
7. Which two side-panel destinations would you use every week?

## Evidence limits

The live audit used the current public build and screenshots captured during this run. It did not test physical iPad touch latency, screen-reader output, browser storage failure, file selection, or real offline reload on the supplied device. The attached pegboard photo was inspected visually; it supports the persistent-rail and wall-display observations but does not establish behavior. The audio recording remained without a Notes transcript, so its direct wording and tone still need a later transcript or human review.
