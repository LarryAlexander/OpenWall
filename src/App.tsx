import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Bell,
  BellRing,
  CheckCircle2,
  Check,
  CloudSun,
  ChevronLeft,
  ChevronRight,
  Circle,
  Compass,
  Download,
  Grip,
  Home,
  Image,
  Leaf,
  LayoutDashboard,
  ListPlus,
  ListChecks,
  Lock,
  LocateFixed,
  MapPin,
  Menu,
  Minus,
  Monitor,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Search,
  StickyNote,
  Sun,
  Timer,
  Trash2,
  Unlock,
  Upload,
  Utensils,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { AppearanceSection } from "./AppearanceSection";
import {
  displayModeAt,
  loadDisplaySchedule,
  saveDisplaySchedule,
  type DisplayMode,
  type DisplaySchedulePreferences,
} from "./displaySchedule";
import {
  DEFAULT_APPEARANCE,
  applyAppearanceToDOM,
  loadAppearancePreferences,
  saveAppearancePreferences,
} from "./appearance";
import { parseBackup, serializeBackup } from "./backup";
import { CoachMark } from "./CoachMark";
import { CountdownCard } from "./CountdownCard";
import { CountdownEditor } from "./CountdownEditor";
import { getCountdownConfig, updateBoardWidgetWithCountdown } from "./countdown";
import { formatDate as format, isSameDay, parseISO } from "./date";
import { repository } from "./db";
import { GuideCard } from "./GuideCard";
import { LATEST_RELEASE } from "./guideData";
import { GuideTour } from "./GuideTour";
import { GuideView } from "./GuideView";
import {
  completeTour,
  dismissTip,
  dismissTour,
  GUIDE_EVENT_START_TOUR,
  isReleaseSeen,
  isTipDismissed,
  loadGuideState,
  markReleaseSeen,
  TIP_IDS,
  type StartTourEventDetail,
} from "./guideState";
import { createEightPersonTestHousehold, createHousehold, createSampleHousehold } from "./sample";
import { dateKey, dateKeysFrom, scheduleOccursOnDate } from "./planning";
import { makeRoutineOccurrence, routineOccursOnDate } from "./routines";
import {
  attentionStateFor,
  deriveAttentionItems,
  memberAttentionCount,
  visibleAttentionItems,
} from "./attention";
import { InstallEducation } from "./InstallEducation";
import {
  isRunningStandalone,
  loadOfflineReadiness,
  rememberOfflineReadiness,
  type BeforeInstallPromptEvent,
} from "./install";
import { WhatsNewNotice } from "./WhatsNewNotice";
import {
  fetchWeather,
  formatWeatherTemperature,
  isWeatherSnapshotStale,
  locationLabel,
  searchWeatherPlaces,
  weatherCondition,
  type WeatherPlace,
} from "./weather";
import type {
  AppearancePreferences,
  BoardWidget,
  BoardWidgetType,
  CountdownWidgetConfig,
  EditorTarget,
  GuideState,
  HouseholdMember,
  HouseholdSnapshot,
  HouseholdTask,
  HistoryEntry,
  PhotoAsset,
  Routine,
  RewardLedgerEntry,
  RewardDefinition,
  RewardGoal,
  RewardRedemption,
  ActivityEntry,
  AttentionItem,
  AttentionState,
  HouseholdList,
  HouseholdListItem,
  MealPlan,
  RoutineOccurrence,
  ScheduleItem,
  WeatherWidgetConfig,
} from "./types";
import { currentStreak, levelForStars, rewardBalance, weeklyRewardBalance, taskStarValue, requiresRewardApproval, hasAwardForTask } from "./rewards";
import { hasParentPin, isParentUnlocked, setParentPin, unlockParentMode } from "./pin";

type View =
  | "today"
  | "inbox"
  | "week"
  | "calendar"
  | "lists"
  | "history"
  | "people"
  | "rewards"
  | "photos"
  | "settings"
  | "guide";
type Notice = { tone: "success" | "warning" | "error"; message: string } | null;
type AppUpdateStatus = "idle" | "checking" | "ready" | "updating" | "current" | "error";
type UpdateAppAction = () => Promise<void>;

const todayInput = () => format(new Date(), "yyyy-MM-dd");
const timeInput = (date = new Date()) => format(date, "HH:mm");
const id = () => crypto.randomUUID();

function getMember(memberId: string, members: HouseholdMember[]) {
  return members.find((member) => member.id === memberId);
}

function Avatar({ member, small = false }: { member: HouseholdMember; small?: boolean }) {
  return (
    <span
      className={`avatar color-${member.colorToken} ${small ? "avatar-small" : ""}`}
      title={member.name}
      aria-label={member.name}
    >
      {member.symbol}
    </span>
  );
}

function Welcome({
  onSample,
  onTestSample,
  onSetup,
  online,
  offlineReady,
}: {
  onSample: () => void;
  onTestSample: () => void;
  onSetup: () => void;
  online: boolean;
  offlineReady: boolean;
}) {
  return (
    <main className="welcome-shell">
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <div className="brand-mark">
            <Home aria-hidden="true" />
          </div>
          <p className="eyebrow">Your home, in one calm view</p>
          <h1 id="welcome-title">Meet OpenWall.</h1>
          <p className="welcome-lede">
            A private family dashboard for the plans and little jobs that keep a home moving. Your
            information stays on this device.
          </p>
          <div className="welcome-actions">
            <button className="primary-button" onClick={onSample}>
              Explore a sample home <ChevronRight aria-hidden="true" />
            </button>
            <button className="secondary-button" onClick={onTestSample}>
              Explore the 8-person test household
            </button>
            <button className="secondary-button" onClick={onSetup}>
              Set up my household
            </button>
          </div>
          <div className="privacy-note">
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>No account needed.</strong> Nothing is sent to a server.
            </span>
          </div>
          <InstallEducation online={online} offlineReady={offlineReady} compact />
        </div>
        <div className="welcome-preview" aria-label="Preview of the OpenWall Today board">
          <div className="preview-date">
            Tuesday <span>03</span>
          </div>
          <div className="preview-card coral">
            <span>8:10</span>
            <strong>School drop-off</strong>
          </div>
          <div className="preview-card sage">
            <span>10:00</span>
            <strong>Design review</strong>
          </div>
          <div className="preview-task">
            <CheckCircle2 />
            <span>Feed Pepper</span>
          </div>
          <div className="preview-task">
            <Circle />
            <span>Bring recycling out</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function Setup({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: (data: HouseholdSnapshot) => void;
}) {
  const [householdName, setHouseholdName] = useState("");
  const [members, setMembers] = useState(["", ""]);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const names = members.map((name) => name.trim()).filter(Boolean);
    if (!householdName.trim()) return setError("Give your household a name.");
    if (names.length < 2) return setError("Add at least two household members.");
    onComplete(createHousehold(householdName.trim(), names));
  };

  return (
    <main className="setup-shell">
      <form className="setup-card" onSubmit={submit}>
        <button
          className="icon-button setup-close"
          type="button"
          onClick={onCancel}
          aria-label="Back"
        >
          <X aria-hidden="true" />
        </button>
        <div className="step-pill">A two-minute setup</div>
        <h1>Who shares this wall?</h1>
        <p>Start with the people who need to see today at a glance. You can adjust this later.</p>
        <label>
          Household name
          <input
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
            placeholder="The Rivera Home"
            autoFocus
          />
        </label>
        <fieldset>
          <legend>Household members</legend>
          <div className="member-inputs">
            {members.map((name, index) => (
              <label className="member-input" key={index}>
                <span className={`avatar color-${["sage", "coral", "gold", "sky"][index % 4]}`}>
                  {index + 1}
                </span>
                <span className="sr-only">Member {index + 1}</span>
                <input
                  value={name}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  placeholder={index === 0 ? "Your name" : "Another person"}
                />
                {members.length > 2 && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      setMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    aria-label={`Remove member ${index + 1}`}
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
              </label>
            ))}
          </div>
          {members.length < 6 && (
            <button
              type="button"
              className="text-button"
              onClick={() => setMembers((current) => [...current, ""])}
            >
              <Plus /> Add another person
            </button>
          )}
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button full" type="submit">
          Create our board <ChevronRight />
        </button>
        <p className="fine-print">
          Saved only in this browser. OpenWall does not create an online account.
        </p>
      </form>
    </main>
  );
}

function Sidebar({
  view,
  onView,
  compact,
  onToggle,
  attentionCount = 0,
}: {
  view: View;
  onView: (view: View) => void;
  compact: boolean;
  onToggle: () => void;
  attentionCount?: number;
}) {
  return (
    <aside className={`sidebar ${compact ? "sidebar-compact" : ""}`}>
      <div className="sidebar-brand">
        <span className="mini-mark">
          <Home />
        </span>
        <strong>OpenWall</strong>
      </div>
      <nav aria-label="Main navigation">
        <button className={view === "today" ? "active" : ""} onClick={() => onView("today")}>
          <Sun />
          <span>Today</span>
        </button>
        <button className={view === "inbox" ? "active" : ""} onClick={() => onView("inbox")}>
          {attentionCount > 0 ? <BellRing /> : <Bell />}
          <span>Inbox</span>
          {attentionCount > 0 && <b className="nav-badge" aria-label={`${attentionCount} items needing attention`}>{attentionCount > 99 ? "99+" : attentionCount}</b>}
        </button>
        <button className={view === "week" ? "active" : ""} onClick={() => onView("week")}>
          <CalendarDays />
          <span>Week</span>
        </button>
        <button className={view === "lists" ? "active" : ""} onClick={() => onView("lists")}>
          <ListChecks />
          <span>Lists</span>
        </button>
        <button className={view === "calendar" ? "active" : ""} onClick={() => onView("calendar")}>
          <CalendarDays />
          <span>Calendar</span>
        </button>
        <button className={view === "history" ? "active" : ""} onClick={() => onView("history")}>
          <RotateCcw />
          <span>History</span>
        </button>
        <button className={view === "people" ? "active" : ""} onClick={() => onView("people")}>
          <Users />
          <span>People</span>
        </button>
        <button className={view === "rewards" ? "active" : ""} onClick={() => onView("rewards")}>
          <CheckCircle2 />
          <span>Rewards</span>
        </button>
        <button className={view === "photos" ? "active" : ""} onClick={() => onView("photos")}>
          <Image />
          <span>Photos</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <button className={view === "guide" ? "active" : ""} onClick={() => onView("guide")}>
          <Compass />
          <span>Guide</span>
        </button>
        <button className={view === "settings" ? "active" : ""} onClick={() => onView("settings")}>
          <Settings />
          <span>Settings</span>
        </button>
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={compact ? "Expand navigation" : "Collapse navigation"}
        >
          <Menu />
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  );
}

function EventEditor({
  target,
  members,
  householdId,
  onSave,
  onDelete,
  onClose,
}: {
  target: Extract<EditorTarget, { kind: "event" }>;
  members: HouseholdMember[];
  householdId: string;
  onSave: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const current = target.value;
  const initialDate = target.initialDate ? new Date(`${target.initialDate}T09:00:00`) : new Date();
  const start = current ? parseISO(current.startsAt) : initialDate;
  const end = current ? parseISO(current.endsAt) : new Date(initialDate.getTime() + 60 * 60 * 1000);
  const [title, setTitle] = useState(current?.title ?? "");
  const [date, setDate] = useState(format(start, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(timeInput(start));
  const [endTime, setEndTime] = useState(timeInput(end));
  const [allDay, setAllDay] = useState(current?.allDay ?? false);
  const [kind, setKind] = useState<NonNullable<ScheduleItem["kind"]>>(current?.kind ?? "event");
  const [linkCountdown, setLinkCountdown] = useState(Boolean(current?.countdownLinkId));
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"none" | "daily" | "weekly">(current?.recurrence?.frequency ?? "none");
  const [memberIds, setMemberIds] = useState(current?.memberIds ?? []);
  const [notes, setNotes] = useState(current?.notes ?? "");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError("Add a title for this schedule item.");
    if (!date || (!allDay && (!startTime || !endTime))) return setError("Choose a date and time.");
    const startsAt = new Date(`${date}T${allDay ? "00:00" : startTime}:00`);
    const endsAt = allDay ? new Date(startsAt.getTime() + 86_400_000) : new Date(`${date}T${endTime}:00`);
    if (!allDay && endsAt <= startsAt) return setError("End time must be after the start time.");
    const now = new Date().toISOString();
    const itemId = current?.id ?? id();
    onSave({
      id: itemId,
      householdId,
      title: title.trim(),
      memberIds,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      allDay,
      kind,
      countdownLinkId: linkCountdown ? itemId : undefined,
      recurrence: recurrenceFrequency === "none" ? undefined : { frequency: recurrenceFrequency, ...(recurrenceFrequency === "weekly" ? { weekdays: [new Date(`${date}T12:00:00`).getDay()] } : {}) },
      calendarDate: date,
      notes: notes.trim() || undefined,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <Dialog title={current ? "Edit schedule item" : "Add to the schedule"} onClose={onClose}>
      <form onSubmit={submit} className="editor-form">
        <label>
          What’s happening?
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Dentist appointment"
            autoFocus
          />
        </label>
        <div className="form-row">
          <label>
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            Starts
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>
          <label>
            Ends
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Type
            <select value={kind} onChange={(event) => setKind(event.target.value as NonNullable<ScheduleItem["kind"]>)}>
              <option value="event">Event</option>
              <option value="reminder">Reminder</option>
              <option value="school-closure">School closed</option>
              <option value="holiday">Holiday</option>
              <option value="early-dismissal">Early dismissal</option>
              <option value="personal-day">Personal day</option>
            </select>
          </label>
          <label className="choice inline-choice">
            <input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
            All day
          </label>
          <label className="choice inline-choice">
            <input type="checkbox" checked={linkCountdown} onChange={(event) => setLinkCountdown(event.target.checked)} />
            Show countdown
          </label>
          <label>
            Repeat
            <select value={recurrenceFrequency} onChange={(event) => setRecurrenceFrequency(event.target.value as "none" | "daily" | "weekly")}>
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
            </select>
          </label>
        </div>
        <fieldset>
          <legend>Who is this for?</legend>
          <div className="member-choices">
            {members.map((member) => (
              <label className={`choice color-${member.colorToken}`} key={member.id}>
                <input
                  type="checkbox"
                  checked={memberIds.includes(member.id)}
                  onChange={() =>
                    setMemberIds((currentIds) =>
                      currentIds.includes(member.id)
                        ? currentIds.filter((value) => value !== member.id)
                        : [...currentIds, member.id],
                    )
                  }
                />
                <Avatar member={member} small />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Note <span className="optional">Optional</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything helpful for the household"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          {current && (
            <button className="danger-button" type="button" onClick={() => onDelete(current.id)}>
              <Trash2 /> Delete
            </button>
          )}
          <span />
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Save item
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function TaskEditor({
  target,
  members,
  householdId,
  onSave,
  onDelete,
  onClose,
}: {
  target: Extract<EditorTarget, { kind: "task" }>;
  members: HouseholdMember[];
  householdId: string;
  onSave: (item: HouseholdTask) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const current = target.value;
  const [title, setTitle] = useState(current?.title ?? "");
  const [dueDate, setDueDate] = useState(current?.dueDate ?? todayInput());
  const [starValue, setStarValue] = useState(String(current?.starValue ?? 5));
  const [assigneeIds, setAssigneeIds] = useState(current?.assigneeIds ?? []);
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError("Add a title for this task.");
    const now = new Date().toISOString();
    onSave({
      id: current?.id ?? id(),
      householdId,
      title: title.trim(),
      assigneeIds,
      dueDate: dueDate || undefined,
      starValue: Math.max(0, Number(starValue) || 0),
      completedAt: current?.completedAt,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    });
  };
  return (
    <Dialog title={current ? "Edit task" : "Add a household task"} onClose={onClose}>
      <form onSubmit={submit} className="editor-form">
        <label>
          What needs doing?
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Water the plants"
            autoFocus
          />
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label>
          Stars for completion
          <input type="number" min="0" max="999" inputMode="numeric" value={starValue} onChange={(event) => setStarValue(event.target.value)} />
        </label>
        <fieldset>
          <legend>Who can do it?</legend>
          <div className="member-choices">
            {members.map((member) => (
              <label className={`choice color-${member.colorToken}`} key={member.id}>
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(member.id)}
                  onChange={() =>
                    setAssigneeIds((currentIds) =>
                      currentIds.includes(member.id)
                        ? currentIds.filter((value) => value !== member.id)
                        : [...currentIds, member.id],
                    )
                  }
                />
                <Avatar member={member} small />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          {current && (
            <button className="danger-button" type="button" onClick={() => onDelete(current.id)}>
              <Trash2 /> Delete
            </button>
          )}
          <span />
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Save task
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={ref}
      >
        <header>
          <h2 id="dialog-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

const defaultBoardWidgets: BoardWidget[] = [
  { id: "welcome", type: "welcome", x: 2, y: 2, w: 40, h: 18, tilt: -0.3, locked: true },
  { id: "schedule", type: "schedule", x: 2, y: 23, w: 51, h: 70, tilt: 0 },
  { id: "tasks", type: "tasks", x: 55, y: 7, w: 29, h: 50, tilt: 0.35 },
  {
    id: "note",
    type: "note",
    x: 85,
    y: 10,
    w: 13,
    h: 29,
    tilt: 1.2,
    text: "Library books back by Friday",
  },
  {
    id: "meal",
    type: "meal",
    x: 57,
    y: 61,
    w: 25,
    h: 28,
    tilt: -0.45,
    text: "Taco night\n6:30 PM",
  },
  {
    id: "countdown",
    type: "countdown",
    x: 84,
    y: 45,
    w: 14,
    h: 25,
    tilt: 0.7,
    countdown: {
      title: "Trip to the beach",
      targetAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      displayMode: "auto",
      completionMessage: "At the beach!",
    },
  },
  { id: "photo", type: "photo", x: 84, y: 73, w: 14, h: 22, tilt: -1.1 },
];

function TextWidgetEditor({
  widget,
  onSave,
  onDelete,
  onClose,
}: {
  widget: BoardWidget;
  onSave: (widget: BoardWidget) => void;
  onDelete?: (widget: BoardWidget) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(widget.text ?? "");
  const isNote = widget.type === "note";
  return <Dialog title={isNote ? "Edit sticky note" : "Edit meal"} onClose={onClose}><form className="editor-form" onSubmit={(event) => { event.preventDefault(); onSave({ ...widget, text: text.trim() || "Add a note" }); }}><label>{isNote ? "Note text" : "Tonight’s plan"}<textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder={isNote ? "Remember to..." : "Taco night\n6:30 PM"} /></label><div className="dialog-actions"><span />{onDelete && <button className="danger-button" type="button" onClick={() => onDelete(widget)}><Trash2 aria-hidden="true" /> Remove {isNote ? "note" : "meal"}</button>}<button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">Save card</button></div></form></Dialog>;
}

function MobilePersonalHome({
  snapshot,
  memberId,
  onSelectMember,
  onComplete,
  onEdit,
}: {
  snapshot: HouseholdSnapshot;
  memberId: string | null;
  onSelectMember: (id: string | null) => void;
  onComplete: (task: HouseholdTask) => void;
  onEdit: (target: EditorTarget) => void;
}) {
  const member = snapshot.members.find((candidate) => candidate.id === memberId) ?? snapshot.members[0];
  const selectedId = member?.id;
  const events = snapshot.scheduleItems
    .filter((item) => item.memberIds.includes(selectedId ?? "") || item.memberIds.length === 0 || item.memberIds.length === snapshot.members.length)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);
  const tasks = snapshot.tasks
    .filter((task) => task.assigneeIds.includes(selectedId ?? ""))
    .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)))
    .slice(0, 5);
  const stars = member ? rewardBalance(member.id, snapshot.tasks, snapshot.rewards ?? []) : 0;
  const routines = (snapshot.routines ?? []).filter((routine) => routine.assigneeIds.includes(selectedId ?? ""));
  return (
    <section className="mobile-personal-home" aria-labelledby="mobile-home-title">
      <div className="mobile-personal-header">
        <div>
          <p className="eyebrow">Your day</p>
          <h2 id="mobile-home-title">{member ? `${member.name}'s plan` : "Household plan"}</h2>
        </div>
        {member && <div className={`mobile-stars color-${member.colorToken}`} aria-label={`${stars} Stars`}>⭐ {stars}</div>}
      </div>
      <div className="mobile-member-switcher" aria-label="Choose a personal view">
        {snapshot.members.map((candidate) => (
          <button key={candidate.id} className={candidate.id === selectedId ? "selected" : ""} onClick={() => onSelectMember(candidate.id)}>
            <Avatar member={candidate} small /> <span>{candidate.name}</span>
          </button>
        ))}
      </div>
      <div className="mobile-personal-grid">
        <section className="mobile-personal-card">
          <div className="mobile-card-heading"><h3>Tasks</h3><span>{tasks.filter((task) => task.completedAt).length}/{tasks.length}</span></div>
          {tasks.length ? tasks.map((task) => <button key={task.id} className={`mobile-task-row ${task.completedAt ? "completed" : ""}`} onClick={() => onComplete(task)}><span>{task.completedAt ? "✓" : "○"}</span><span>{task.title}</span><small>+{taskStarValue(task)} ⭐</small></button>) : <p className="mobile-empty">No tasks assigned yet.</p>}
          <button className="text-button" onClick={() => onEdit({ kind: "task" })}>Add a task <Plus /></button>
        </section>
        <section className="mobile-personal-card">
          <div className="mobile-card-heading"><h3>Coming up</h3><span>{events.length}</span></div>
          {events.length ? events.map((item) => <button key={item.id} className="mobile-event-row" onClick={() => onEdit({ kind: "event", value: item })}><span>{item.allDay ? "All day" : format(parseISO(item.startsAt), "h:mm a")}</span><strong>{item.title}</strong></button>) : <p className="mobile-empty">Nothing scheduled yet.</p>}
          <button className="text-button" onClick={() => onEdit({ kind: "event" })}>Add to schedule <Plus /></button>
        </section>
        <section className="mobile-personal-card mobile-routines-card">
          <div className="mobile-card-heading"><h3>Routines</h3><span>{routines.length}</span></div>
          {routines.length ? routines.map((routine) => <div className="mobile-routine-row" key={routine.id}><RotateCcw /><span><strong>{routine.title}</strong><small>{routine.frequency.replace("school-days", "school days")}</small></span></div>) : <p className="mobile-empty">No routines assigned yet.</p>}
        </section>
      </div>
      <p className="mobile-personal-hint">Your private Stars, tasks, and schedule stay on this device. Open the Board tab for the full corkboard.</p>
    </section>
  );
}

function WeatherWidget({
  widget,
  onSave,
}: {
  widget: BoardWidget;
  onSave: (widget: BoardWidget) => void;
}) {
  const config: WeatherWidgetConfig = widget.weather ?? { units: "fahrenheit" };
  const snapshot = config.snapshot;
  const [locationQuery, setLocationQuery] = useState(config.location?.name ?? "");
  const [places, setPlaces] = useState<WeatherPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  // Keep the card glanceable on first add. Location setup is explicit through
  // the card action so a newly added weather module never interrupts the wall.
  const [editorOpen, setEditorOpen] = useState(false);
  const [units, setUnits] = useState(config.units ?? "fahrenheit");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setLocationQuery(config.location?.name ?? "");
    setUnits(config.units ?? "fahrenheit");
  }, [config.location?.name, config.units]);

  const saveLocation = async (place: WeatherPlace) => {
    setLoading(true);
    setError("");
    const location = {
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      ...(place.timezone ? { timezone: place.timezone } : {}),
      ...(place.country ? { country: place.country } : {}),
      ...(place.admin1 ? { admin1: place.admin1 } : {}),
    } satisfies NonNullable<WeatherWidgetConfig["location"]>;
    try {
      const nextSnapshot = await fetchWeather(location, units);
      onSave({ ...widget, weather: { ...config, location, units, snapshot: nextSnapshot } });
      setEditorOpen(false);
      setPlaces([]);
    } catch {
      setError("Weather could not be loaded. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!config.location) {
      setEditorOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nextSnapshot = await fetchWeather(config.location, units);
      onSave({ ...widget, weather: { ...config, units, snapshot: nextSnapshot } });
    } catch {
      setError("Couldn’t refresh weather. The last saved forecast is still available.");
    } finally {
      setLoading(false);
    }
  };

  const search = async () => {
    if (locationQuery.trim().length < 2) {
      setError("Enter at least two letters to search for a place.");
      return;
    }
    setSearching(true);
    setError("");
    try {
      const matches = await searchWeatherPlaces(locationQuery);
      setPlaces(matches);
      if (!matches.length) setError("No places matched that search. Try a nearby city.");
    } catch {
      setError("Location search needs an internet connection. You can try again or use device location.");
    } finally {
      setSearching(false);
    }
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError("This browser does not provide device location. Search for a city instead.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void saveLocation({
          name: "Current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLoading(false);
        setError("Location permission was not granted. Search for a city instead.");
      },
      { enableHighAccuracy: false, maximumAge: 15 * 60_000, timeout: 10_000 },
    );
  };

  const currentCondition = snapshot ? weatherCondition(snapshot.current.weatherCode) : null;
  const stale = isWeatherSnapshotStale(snapshot, now);
  const unitLabel = snapshot?.units === "celsius" || units === "celsius" ? "km/h" : "mph";

  return (
    <div className="weather-widget-content">
      <header className="weather-widget-heading">
        <div>
          <span className="weather-kicker"><CloudSun aria-hidden="true" /> Weather</span>
          <h2>{snapshot ? locationLabel(snapshot.location) : "Plan around the weather"}</h2>
        </div>
        <div className="weather-widget-actions">
          <button className="icon-button" type="button" onClick={() => setEditorOpen(true)} aria-label="Change weather location"><MapPin /></button>
          <button className="icon-button" type="button" onClick={() => void refresh()} disabled={loading} aria-label="Refresh weather"><RefreshCw className={loading ? "weather-refresh-icon" : ""} /></button>
        </div>
      </header>
      {!snapshot ? (
        <div className="weather-empty-state">
          <span className="weather-empty-icon" aria-hidden="true">🌤️</span>
          <strong>{config.location ? "Forecast not loaded yet" : "Add a place to see the forecast"}</strong>
          <p>Weather is fetched only when you ask and the last successful reading is saved on this device.</p>
          <button className="primary-button" type="button" onClick={() => setEditorOpen(true)}>Set location</button>
        </div>
      ) : (
        <>
          <div className="weather-current" aria-label={`${currentCondition?.label ?? "Current conditions"}, ${formatWeatherTemperature(snapshot.current.temperature, snapshot.units)}`}>
            <span className="weather-condition-icon" aria-hidden="true">{currentCondition?.icon}</span>
            <div><strong>{formatWeatherTemperature(snapshot.current.temperature, snapshot.units)}</strong><span>{currentCondition?.label}</span></div>
            <dl><div><dt>Feels like</dt><dd>{formatWeatherTemperature(snapshot.current.apparentTemperature, snapshot.units)}</dd></div><div><dt>Wind</dt><dd>{Math.round(snapshot.current.windSpeed)} {unitLabel}</dd></div></dl>
          </div>
          <div className="weather-forecast" aria-label="Five day forecast">
            {snapshot.daily.slice(0, 5).map((day) => {
              const condition = weatherCondition(day.weatherCode);
              return <div className="weather-day" key={day.date}><time dateTime={day.date}>{format(parseISO(day.date), "EEE")}</time><span aria-label={condition.label}>{condition.icon}</span><strong>{formatWeatherTemperature(day.temperatureMax, snapshot.units)}</strong><small>{formatWeatherTemperature(day.temperatureMin, snapshot.units)}</small>{day.precipitationProbability > 0 && <em>{Math.round(day.precipitationProbability)}%</em>}</div>;
            })}
          </div>
          <footer className={`weather-status ${stale ? "is-stale" : ""}`}>
            <span>{stale ? "Last reading may be out of date" : "Updated just now"}</span>
            <small>{stale ? <>Refresh when you are online · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Forecast via Open-Meteo</a> · {snapshot.timezone}</> : <><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Forecast via Open-Meteo</a> · {snapshot.timezone}</>}</small>
          </footer>
        </>
      )}
      {error && <p className="weather-error" role="alert">{error}</p>}
      {editorOpen && (
        <Dialog title="Weather location" onClose={() => setEditorOpen(false)}>
          <form className="editor-form weather-location-form" onSubmit={(event) => { event.preventDefault(); void search(); }}>
            <p>Choose a city or allow a one-time device location lookup. OpenWall stores the selected coordinates and forecast on this device; it does not upload household data.</p>
            <label>Search for a city or town<input autoFocus value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Baltimore" /></label>
            <div className="weather-location-actions"><button className="primary-button" type="submit" disabled={searching}>{searching ? "Searching…" : <><Search aria-hidden="true" /> Search places</>}</button><button className="secondary-button" type="button" onClick={useDeviceLocation} disabled={loading}><LocateFixed /> Use my location</button></div>
            {places.length > 0 && <div className="weather-place-results" aria-label="Place search results">{places.map((place) => <button type="button" key={`${place.latitude}-${place.longitude}`} onClick={() => void saveLocation(place)}><MapPin /><span><strong>{place.name}</strong><small>{[place.admin1, place.country].filter(Boolean).join(", ")}</small></span><ChevronRight /></button>)}</div>}
            <label>Temperature units<select value={units} onChange={(event) => setUnits(event.target.value as WeatherWidgetConfig["units"])}><option value="fahrenheit">Fahrenheit (°F)</option><option value="celsius">Celsius (°C)</option></select></label>
            <div className="dialog-actions"><span /><button className="secondary-button" type="button" onClick={() => setEditorOpen(false)}>Cancel</button></div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

function TodayBoard({
  snapshot,
  filterId,
  attentionItems,
  onFilter,
  onView,
  onManagePeople,
  onEdit,
  onComplete,
  guideState,
  onStartTour,
  onDismissGuideCard,
  onDismissTip,
  postUpdateIntent,
  onSeeWhatsNew,
  onDismissWhatsNew,
  onAcknowledgeAttention,
  onSnoozeAttention,
  onBoardLayoutChange,
  displayMode,
  suppressTips = false,
}: {
  snapshot: HouseholdSnapshot;
  filterId: string | null;
  attentionItems: AttentionItem[];
  onFilter: (id: string | null) => void;
  onView: (view: View) => void;
  onManagePeople: () => void;
  onEdit: (target: EditorTarget) => void;
  onComplete: (task: HouseholdTask) => void;
  guideState: GuideState;
  onStartTour: (trigger?: HTMLElement | null) => void;
  onDismissGuideCard: () => void;
  onDismissTip: (tipId: string) => void;
  postUpdateIntent: boolean;
  onSeeWhatsNew: () => void;
  onDismissWhatsNew: () => void;
  onAcknowledgeAttention: (item: AttentionItem) => void;
  onSnoozeAttention: (item: AttentionItem) => void;
  onBoardLayoutChange?: (widgets: BoardWidget[]) => void;
  displayMode: DisplayMode;
  suppressTips?: boolean;
}) {
  const [today, setToday] = useState(() => new Date());
  const photos = [...(snapshot.photos ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (photos.length < 2) {
      setPhotoIndex(0);
      return;
    }
    const timer = window.setInterval(() => setPhotoIndex((current) => (current + 1) % photos.length), 30_000);
    return () => window.clearInterval(timer);
  }, [photos.length]);
  useEffect(() => {
    if (photoIndex >= photos.length) setPhotoIndex(0);
  }, [photoIndex, photos.length]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [removingWidgetId, setRemovingWidgetId] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [cardJustAdded, setCardJustAdded] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<BoardWidget | null>(null);
  const [editingTextWidget, setEditingTextWidget] = useState<BoardWidget | null>(null);
  const [pendingTextWidgetRemoval, setPendingTextWidgetRemoval] = useState<BoardWidget | null>(null);
  const [widgets, setWidgets] = useState<BoardWidget[]>(() => {
    const source = snapshot.boardWidgets?.length ? snapshot.boardWidgets : defaultBoardWidgets;
    return source.map((w) => {
      if (w.type === "countdown") {
        const cfg = getCountdownConfig(w, snapshot.household.timezone);
        return updateBoardWidgetWithCountdown(w, cfg);
      }
      return w;
    });
  });

  const events = snapshot.scheduleItems.filter(
    (item) =>
      (item.calendarDate ?? format(parseISO(item.startsAt), "yyyy-MM-dd")) === todayInput() &&
      (!filterId || item.memberIds.length === 0 || item.memberIds.includes(filterId)),
  );
  const tasks = snapshot.tasks
    .filter(
      (task) =>
        (!task.dueDate || task.dueDate === todayInput()) &&
        (!filterId || task.assigneeIds.length === 0 || task.assigneeIds.includes(filterId)),
    )
    .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)));
  const next = events.find((item) => parseISO(item.endsAt) > today);
  const upcomingEvents = snapshot.scheduleItems
    .filter((item) => {
      const dateKey = item.calendarDate ?? format(parseISO(item.startsAt), "yyyy-MM-dd");
      return dateKey > todayInput() && (!filterId || item.memberIds.includes(filterId));
    })
    .sort((a, b) => (a.calendarDate ?? a.startsAt).localeCompare(b.calendarDate ?? b.startsAt))
    .slice(0, 5);
  const currentMeal = snapshot.mealPlans?.find((meal) => meal.date === todayInput());

  useEffect(() => {
    void repository.saveBoardLayout({
      id: snapshot.household.id,
      householdId: snapshot.household.id,
      widgets,
      updatedAt: new Date().toISOString(),
    }).catch(() => {
      // The board remains interactive when IndexedDB is unavailable.
    });
    onBoardLayoutChange?.(widgets);
  }, [widgets, snapshot.household.id, onBoardLayoutChange]);

  // Schedule-linked countdowns are materialized on the board automatically.
  // The schedule remains the source of truth, so editing the event updates the card.
  useEffect(() => {
    const linked = snapshot.scheduleItems.filter((item) => item.countdownLinkId);
    if (!linked.length) return;
    setWidgets((current) => {
      let changed = false;
      const next = [...current];
      for (const item of linked) {
        const widgetId = `countdown-linked-${item.id}`;
        const target = item.allDay || item.calendarDate
          ? new Date(`${item.calendarDate ?? format(parseISO(item.startsAt), "yyyy-MM-dd")}T00:00:00`).toISOString()
          : item.startsAt;
        const config: CountdownWidgetConfig = {
          title: item.title,
          targetAt: target,
          displayMode: "auto",
          completionMessage: "It’s here!",
          timezone: snapshot.household.timezone,
        };
        const index = next.findIndex((widget) => widget.id === widgetId);
        if (index >= 0) {
          const widget = next[index];
          if (JSON.stringify(widget.countdown) !== JSON.stringify(config)) {
            next[index] = { ...widget, countdown: config };
            changed = true;
          }
        } else {
          next.push({ id: widgetId, type: "countdown", x: 68, y: 72, w: 16, h: 22, tilt: 0.5, countdown: config });
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [snapshot.scheduleItems, snapshot.household.timezone]);

  const saveBoardWidgets = (next: BoardWidget[]) =>
    repository.saveBoardLayout({
      id: snapshot.household.id,
      householdId: snapshot.household.id,
      widgets: next,
      updatedAt: new Date().toISOString(),
    }).catch(() => undefined);

  const applyBoardWidgets = async (next: BoardWidget[]) => {
    await saveBoardWidgets(next);
    setWidgets(next);
    onBoardLayoutChange?.(next);
  };

  const updateWidget = (widgetId: string, patch: Partial<BoardWidget>) => {
    const next = widgets.map((widget) => (widget.id === widgetId ? { ...widget, ...patch } : widget));
    setWidgets(next);
    void saveBoardWidgets(next);
    onBoardLayoutChange?.(next);
  };

  const removeWidget = (widgetId: string) => {
    if (removingWidgetId) return;
    setRemovingWidgetId(widgetId);
    setActiveWidgetId(widgetId);
    const next = widgets.filter((item) => item.id !== widgetId);
    void saveBoardWidgets(next);
    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    window.setTimeout(
      () => {
        setWidgets(next);
        onBoardLayoutChange?.(next);
        setRemovingWidgetId(null);
        setActiveWidgetId(null);
      },
      reduceMotion ? 40 : 520,
    );
  };

  const resizeWidgetBy = (widget: BoardWidget, element: HTMLElement | null, delta: number) => {
    if (window.matchMedia("(max-width: 1279px)").matches) {
      const currentHeight = widget.stackedHeight ?? element?.offsetHeight ?? 220;
      const next = widgets.map((candidate) => candidate.id === widget.id
        ? { ...candidate, stackedHeight: Math.max(150, Math.min(720, currentHeight + delta * 15)) }
        : candidate);
      setWidgets(next);
      onBoardLayoutChange?.(next);
      void saveBoardWidgets(next);
      return;
    }
    const nextWidth = Math.max(12, Math.min(94, widget.w + delta));
    const nextHeight = Math.max(18, Math.min(94, widget.h + delta));
    const next = widgets.map((candidate) => candidate.id === widget.id
      ? {
          ...candidate,
          x: Math.min(widget.x, 96 - nextWidth),
          y: Math.min(widget.y, 96 - nextHeight),
          w: nextWidth,
          h: nextHeight,
        }
      : candidate);
    setWidgets(next);
    onBoardLayoutChange?.(next);
    void saveBoardWidgets(next);
  };

  const beginMove = (event: React.PointerEvent, widget: BoardWidget) => {
    if (widget.locked || !boardRef.current) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can be unavailable in older embedded browsers; document listeners still work.
    }
    const board = boardRef.current.getBoundingClientRect();
    const start = { pointerX: event.clientX, pointerY: event.clientY, ...widget };
    const isStackedBoard = window.matchMedia("(max-width: 1279px)").matches;
    const draggedElement = event.currentTarget.closest<HTMLElement>("[data-widget-id]");

    setActiveWidgetId(widget.id);
    setDraggingWidgetId(widget.id);

    const move = (moveEvent: PointerEvent) => {
      if (isStackedBoard) {
        draggedElement?.style.setProperty(
          "--drag-offset-y",
          `${moveEvent.clientY - start.pointerY}px`,
        );
        return;
      }
      const dx = ((moveEvent.clientX - start.pointerX) / board.width) * 100;
      const dy = ((moveEvent.clientY - start.pointerY) / board.height) * 100;
      updateWidget(widget.id, {
        x: Math.max(0, Math.min(98 - widget.w, start.x + dx)),
        y: Math.max(0, Math.min(96 - widget.h, start.y + dy)),
      });
    };
    const stop = (stopEvent: PointerEvent) => {
      if (isStackedBoard) {
        const cards = Array.from(
          boardRef.current?.querySelectorAll<HTMLElement>("[data-widget-id]") ?? [],
        ).filter((card) => card.dataset.widgetId !== widget.id);
        const beforeId = cards.find(
          (card) => stopEvent.clientY < card.getBoundingClientRect().top + card.offsetHeight / 2,
        )?.dataset.widgetId;

        setWidgets((current) => {
          const moved = current.find((item) => item.id === widget.id);
          if (!moved) return current;
          const remaining = current.filter((item) => item.id !== widget.id);
          const insertionIndex = beforeId
            ? remaining.findIndex((item) => item.id === beforeId)
            : remaining.length;
          remaining.splice(insertionIndex < 0 ? remaining.length : insertionIndex, 0, moved);
          void saveBoardWidgets(remaining);
          onBoardLayoutChange?.(remaining);
          return remaining;
        });
        draggedElement?.style.removeProperty("--drag-offset-y");
      }
      setDraggingWidgetId(null);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", cancel);
    };
    const cancel = () => {
      draggedElement?.style.removeProperty("--drag-offset-y");
      setDraggingWidgetId(null);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", cancel);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", cancel);
  };

  const addWidget = (type: BoardWidgetType) => {
    const defaults: Record<BoardWidgetType, Pick<BoardWidget, "w" | "h" | "text">> = {
      welcome: { w: 38, h: 18 },
      schedule: { w: 45, h: 58 },
      tasks: { w: 28, h: 43 },
      note: { w: 17, h: 26, text: "Add your note here" },
      countdown: { w: 17, h: 23 },
      meal: { w: 22, h: 25, text: "Tonight’s dinner\nAdd a plan" },
      photo: { w: 18, h: 25 },
      clock: { w: 20, h: 22 },
      calendar: { w: 28, h: 34 },
      weather: { w: 24, h: 30 },
    };
    let added: BoardWidget = {
      id: `${type}-${crypto.randomUUID()}`,
      type,
      x: 40 + (widgets.length % 4) * 4,
      y: 28 + (widgets.length % 5) * 5,
      tilt: type === "note" ? -1.1 : 0,
      ...defaults[type],
    };
    if (type === "countdown") {
      const cfg: CountdownWidgetConfig = {
        title: "Something good",
        targetAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        displayMode: "auto",
        completionMessage: "It’s here!",
        timezone: snapshot.household.timezone,
      };
      added = updateBoardWidgetWithCountdown(added, cfg);
    }
    const next = [...widgets, added];
    void applyBoardWidgets(next);
    setTrayOpen(false);
    setActiveWidgetId(added.id);
    setCardJustAdded(true);
  };

  const renderWidget = (widget: BoardWidget) => {
    if (widget.type === "welcome")
      return (
        <div className="cork-welcome">
          <p className="eyebrow">{snapshot.household.name}</p>
          <h1>{format(today, "EEEE")}</h1>
          <p>
            {format(today, "MMMM d")} <span>·</span> {format(today, "h:mm a")}
          </p>
        </div>
      );
    if (widget.type === "schedule")
      return (
        <>
          <WidgetHeading
            kicker="Schedule"
            title="Today’s rhythm"
            icon={<CalendarDays />}
            onAdd={() => onEdit({ kind: "event" })}
          />
          {events.length ? (
            <div className="mini-timeline">
              {events.map((item) => {
                const firstMember = getMember(item.memberIds[0], snapshot.members);
                return (
                  <button key={item.id} onClick={() => onEdit({ kind: "event", value: item })}>
                    <time>{item.allDay || item.kind === "school-closure" ? "All day" : format(parseISO(item.startsAt), "h:mm")}</time>
                    <span className={`pin-dot color-${firstMember?.colorToken ?? "sage"}`} />
                    <span>
                      <strong>{item.title}</strong>
                      {item.notes && <small>{item.notes}</small>}
                    </span>
                    {next?.id === item.id && <em>Next</em>}
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays />}
              title="A quiet day"
              body="Nothing is scheduled."
              action="Add one"
              onAction={() => onEdit({ kind: "event" })}
            />
          )}
        </>
      );
    if (widget.type === "tasks")
      return (
        <>
          <WidgetHeading
            kicker="To do"
            title="Little things"
            icon={<ListChecks />}
            onAdd={() => onEdit({ kind: "task" })}
          />
          <p className="task-progress">
            {tasks.filter((task) => task.completedAt).length} of {tasks.length} finished
          </p>
          <div className="cork-task-list">
            {tasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                onClick={() => onComplete(task)}
                className={task.completedAt ? "completed" : ""}
                aria-label={`${task.completedAt ? "Mark incomplete" : "Complete"} ${task.title}`}
              >
                {task.completedAt ? <CheckCircle2 /> : <Circle />}
                <span>{task.title}</span>
              </button>
            ))}
          </div>
        </>
      );
    if (widget.type === "note")
      return (
        <button className="sticky-content widget-editable-content" onClick={() => setEditingTextWidget(widget)} onDoubleClick={() => setEditingTextWidget(widget)} aria-label="Edit sticky note">
          <StickyNote />
          <span>DON’T FORGET</span>
          <p>{widget.text}</p>
          <small className="widget-edit-hint">Double-click to edit</small>
        </button>
      );
    if (widget.type === "meal")
      return (
        <button className="simple-widget meal-widget widget-editable-content" onClick={() => setEditingTextWidget(widget)} onDoubleClick={() => setEditingTextWidget(widget)} aria-label="Edit meal">
          <Utensils />
          <span>Tonight</span>
          <p>{currentMeal?.name ?? widget.text}</p>
          <small className="widget-edit-hint">{currentMeal ? `${currentMeal.status}${currentMeal.servingTime ? ` · ${currentMeal.servingTime}` : ""}` : "Plan meals in Lists"}</small>
        </button>
      );
    if (widget.type === "countdown")
      return (
        <CountdownCard
          widget={widget}
          householdTimezone={snapshot.household.timezone}
          onEdit={setEditingCountdown}
        />
      );
    if (widget.type === "clock")
      return (
        <div className="clock-widget" aria-label={`Current time ${format(today, "h:mm a")}`}>
          <span>Right now</span>
          <strong>{format(today, "h:mm a")}</strong>
          <p>{format(today, "EEEE, MMMM d")}</p>
        </div>
      );
    if (widget.type === "calendar") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return (
        <div className="mini-calendar-widget">
          <span>This month</span>
          <strong>{format(today, "MMMM yyyy")}</strong>
          <div className="mini-calendar-weekdays" aria-hidden="true">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <b key={`${day}-${index}`}>{day}</b>)}
          </div>
          <div className="mini-calendar-days" aria-label={format(today, "MMMM yyyy")}>
            {Array.from({ length: firstDay }, (_, index) => <i key={`blank-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              return <time className={day === today.getDate() ? "is-today" : ""} key={day}>{day}</time>;
            })}
          </div>
        </div>
      );
    }
    if (widget.type === "weather")
      return <WeatherWidget widget={widget} onSave={(next) => updateWidget(next.id, next)} />;
    const storedPhoto = photos[photoIndex];
    return (
      <button className="photo-widget" onClick={() => onView("photos")} aria-label="Open Photos to manage the household photo">
        {storedPhoto ? <img src={storedPhoto.dataUrl} alt={storedPhoto.caption ?? storedPhoto.name} /> : <div className="photo-sky"><Sun /><span /><span /></div>}
        <p>{storedPhoto ? (photos.length > 1 ? `Local photo ${photoIndex + 1} of ${photos.length}` : "A favorite moment") : "Add a favorite photo from Photos"}</p>
      </button>
    );
  };

  const suppressBoardTips = suppressTips || trayOpen || Boolean(editingCountdown);
  const showWhatsNew =
    guideState.tourStatus !== "unseen" &&
    (postUpdateIntent || !isReleaseSeen(guideState, LATEST_RELEASE.version));
  const suppressBoardGuidance =
    suppressBoardTips || guideState.tourStatus === "unseen" || showWhatsNew;

  return (
    <div className={`corkboard-view display-mode-${displayMode}`}>
      <header className="cork-toolbar">
        <div>
          <p className="eyebrow">Open corkboard</p>
          <h1>Your household, your way.</h1>
        </div>
        <div className="toolbar-actions">
          <button className="primary-button" onClick={() => setTrayOpen(true)}>
            <Plus /> Add to board
          </button>
          <button
            className="icon-button toolbar-fullscreen"
            onClick={() => document.documentElement.requestFullscreen?.()}
            aria-label="Open full screen"
          >
            <Monitor />
          </button>
        </div>
      </header>
      {displayMode !== "normal" && <div className={`display-schedule-banner display-${displayMode}`} role="status"><strong>{displayMode === "sleep" ? "Sleep hours" : "Focus hours"}</strong><span>{displayMode === "sleep" ? "The wall is resting until the next display window." : "The wall is showing the essentials for a calmer view."}</span></div>}
      <div className="board-people" aria-label="Filter board by household member">
        <button className={!filterId ? "selected" : ""} onClick={() => onFilter(null)}>
          <Users /> All
        </button>
        {snapshot.members.map((member) => (
          <button
            key={member.id}
            className={`${filterId === member.id ? "selected" : ""} color-${member.colorToken}`}
            onClick={() => onFilter(member.id)}
          >
            <Avatar member={member} small />
            <span>{member.name}</span>
            {memberAttentionCount(member, attentionItems) > 0 && <b className="member-badge" aria-label={`${memberAttentionCount(member, attentionItems)} actionable items for ${member.name}`}>{memberAttentionCount(member, attentionItems)}</b>}
          </button>
        ))}
        <button className="board-people-add" onClick={onManagePeople} aria-label="Add household member" title="Add household member">
          <Plus /> <span>Add person</span>
        </button>
      </div>
      <FamilyAttentionRail
        items={attentionItems}
        members={snapshot.members}
        snapshot={snapshot}
        onView={(nextView) => { onView(nextView); }}
        onComplete={onComplete}
        onAcknowledge={onAcknowledgeAttention}
        onSnooze={onSnoozeAttention}
      />
      {upcomingEvents.length > 0 && (
        <section className="board-upcoming" aria-labelledby="board-upcoming-title">
          <div>
            <p className="section-kicker">Coming up</p>
            <h2 id="board-upcoming-title">Future plans stay visible</h2>
          </div>
          <div className="board-upcoming-list">
            {upcomingEvents.map((item) => (
              <button key={item.id} onClick={() => onEdit({ kind: "event", value: item })}>
                <span className={`event-kind-dot kind-${item.kind ?? "event"}`} aria-hidden="true" />
                <span><strong>{item.title}</strong><small>{item.allDay ? `${item.calendarDate ?? format(parseISO(item.startsAt), "MMM d")} · All day` : format(parseISO(item.startsAt), "MMM d · h:mm a")}</small></span>
              </button>
            ))}
          </div>
          <button className="text-button" onClick={() => onView("calendar")}>Open calendar <ChevronRight aria-hidden="true" /></button>
        </section>
      )}
      <MobilePersonalHome
        snapshot={snapshot}
        memberId={filterId}
        onSelectMember={onFilter}
        onComplete={onComplete}
        onEdit={onEdit}
      />
      {guideState.tourStatus === "unseen" ? (
        <GuideCard onStartTour={onStartTour} onDismiss={onDismissGuideCard} />
      ) : (
        showWhatsNew && (
          <WhatsNewNotice
            release={LATEST_RELEASE}
            isPostUpdate={postUpdateIntent}
            onSeeWhatsNew={onSeeWhatsNew}
            onDismiss={onDismissWhatsNew}
          />
        )
      )}
      {!suppressBoardGuidance &&
      cardJustAdded &&
      !isTipDismissed(guideState, TIP_IDS.CARD_ADDED) ? (
        <CoachMark
          tipId={TIP_IDS.CARD_ADDED}
          kicker="Card added"
          message="Your new card is ready on the corkboard. Drag its top grip to move it, then use the nearby controls to resize, lock, or remove it."
          onDismiss={(tipId) => {
            setCardJustAdded(false);
            onDismissTip(tipId);
          }}
        />
      ) : !suppressBoardGuidance &&
        activeWidgetId &&
        !isTipDismissed(guideState, TIP_IDS.ARRANGE_MODE) ? (
        <CoachMark
          tipId={TIP_IDS.ARRANGE_MODE}
          kicker="Move it naturally"
          message="The board is always editable. Drag a card by its top grip, use minus or plus to resize it, or lock cards you want to keep safely in place."
          onDismiss={onDismissTip}
        />
      ) : null}
      <div
        className="open-corkboard is-direct-manipulation"
        ref={boardRef}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setActiveWidgetId(null);
        }}
      >
        <div className="cork-grain" />
        {widgets.map((widget) => (
          <article
            key={widget.id}
            data-widget-id={widget.id}
            className={`board-widget widget-${widget.type} ${widget.locked ? "is-locked" : ""} ${draggingWidgetId === widget.id ? "is-dragging" : ""} ${removingWidgetId === widget.id ? "is-removing" : ""} ${activeWidgetId === widget.id ? "is-active-widget" : ""} ${widget.stackedHeight ? "has-stacked-height" : ""}`}
            onPointerDownCapture={() => {
              setActiveWidgetId(widget.id);
            }}
            style={{
              left: `${widget.x}%`,
              top: `${widget.y}%`,
              width: `${widget.w}%`,
              height: `${widget.h}%`,
              transform: `rotate(${widget.tilt}deg)`,
              ...(widget.stackedHeight
                ? ({ "--stacked-card-height": `${widget.stackedHeight}px` } as React.CSSProperties)
                : {}),
            }}
          >
            <div
              className="widget-controls"
              aria-label={`${widget.type} card controls`}
              onPointerDown={(event) => {
                const actionButton = (event.target as HTMLElement).closest("button");
                if (actionButton) return;
                beginMove(event, widget);
              }}
            >
              <button
                className="widget-drag-handle"
                disabled={widget.locked}
                onPointerDown={(event) => beginMove(event, widget)}
                aria-label={`Move ${widget.type} card`}
              >
                <Grip />
              </button>
              <button
                className="widget-size-control"
                disabled={widget.locked}
                onClick={(event) =>
                  resizeWidgetBy(
                    widget,
                    event.currentTarget.closest<HTMLElement>("[data-widget-id]"),
                    -4,
                  )
                }
                aria-label={`Make ${widget.type} card smaller`}
              >
                <Minus />
              </button>
              <button
                className="widget-size-control"
                disabled={widget.locked}
                onClick={(event) =>
                  resizeWidgetBy(
                    widget,
                    event.currentTarget.closest<HTMLElement>("[data-widget-id]"),
                    4,
                  )
                }
                aria-label={`Make ${widget.type} card larger`}
              >
                <Plus />
              </button>
              <button
                onClick={() => updateWidget(widget.id, { locked: !widget.locked })}
                aria-label={widget.locked ? "Unlock card" : "Lock card"}
              >
                {widget.locked ? <Lock /> : <Unlock />}
              </button>
              {widget.type !== "welcome" && (
                <button
                  onClick={() => removeWidget(widget.id)}
                  disabled={Boolean(removingWidgetId)}
                  aria-label={`Remove ${widget.type} card`}
                >
                  <X />
                </button>
              )}
            </div>
            <div className="widget-content">{renderWidget(widget)}</div>
          </article>
        ))}
        {displayMode === "sleep" && <div className="display-sleep-overlay" role="status"><Timer aria-hidden="true" /><strong>Sleep hours</strong><span>The wall is resting. It will return for the next focus window.</span></div>}
      </div>
      {trayOpen && (
        <div
          className="widget-tray-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTrayOpen(false);
          }}
        >
          <section
            className="widget-tray"
            role="dialog"
            aria-modal="true"
            aria-labelledby="widget-tray-title"
          >
            <header>
              <div>
                <p className="eyebrow">Make it yours</p>
                <h2 id="widget-tray-title">Add something to the board</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setTrayOpen(false)}
                aria-label="Close widget tray"
              >
                <X />
              </button>
            </header>
            <div className="widget-picker">
              <button onClick={() => addWidget("note")}>
                <span className="picker-icon yellow">
                  <StickyNote />
                </span>
                <strong>Sticky note</strong>
                <small>A quick reminder</small>
              </button>
              <button onClick={() => addWidget("tasks")}>
                <span className="picker-icon sage">
                  <ListChecks />
                </span>
                <strong>Checklist</strong>
                <small>Shared little things</small>
              </button>
              <button onClick={() => addWidget("schedule")}>
                <span className="picker-icon coral">
                  <CalendarDays />
                </span>
                <strong>Schedule</strong>
                <small>What’s happening</small>
              </button>
              <button onClick={() => addWidget("meal")}>
                <span className="picker-icon clay">
                  <Utensils />
                </span>
                <strong>Meal</strong>
                <small>What’s for dinner</small>
              </button>
              <button onClick={() => addWidget("countdown")}>
                <span className="picker-icon sky">
                  <Timer />
                </span>
                <strong>Countdown</strong>
                <small>Something to anticipate</small>
              </button>
              <button onClick={() => addWidget("photo")}>
                <span className="picker-icon plum">
                  <Image />
                </span>
                <strong>Photo</strong>
                <small>A favorite moment</small>
              </button>
              <button onClick={() => addWidget("clock")}>
                <span className="picker-icon">
                  <Timer />
                </span>
                <strong>Clock</strong>
                <small>Live time and date</small>
              </button>
              <button onClick={() => addWidget("calendar")}>
                <span className="picker-icon sage">
                  <LayoutDashboard />
                </span>
                <strong>Mini calendar</strong>
                <small>A month on the board</small>
              </button>
              <button onClick={() => addWidget("weather")}>
                <span className="picker-icon sky">
                  <CloudSun />
                </span>
                <strong>Weather</strong>
                <small>Plan around the forecast</small>
              </button>
            </div>
          </section>
        </div>
      )}
      {editingCountdown && (
        <CountdownEditor
          widget={editingCountdown}
          householdTimezone={snapshot.household.timezone}
          guideState={guideState}
          onDismissTip={onDismissTip}
          onSave={(updated) => {
            updateWidget(updated.id, updated);
            setEditingCountdown(null);
          }}
          onDelete={(widgetId) => {
            setEditingCountdown(null);
            removeWidget(widgetId);
          }}
          onClose={() => setEditingCountdown(null)}
        />
      )}
      {editingTextWidget && (
        <TextWidgetEditor
          widget={editingTextWidget}
          onSave={(updated) => { updateWidget(updated.id, updated); setEditingTextWidget(null); }}
          onDelete={(widget) => { setEditingTextWidget(null); setPendingTextWidgetRemoval(widget); }}
          onClose={() => setEditingTextWidget(null)}
        />
      )}
      {pendingTextWidgetRemoval && (
        <Dialog
          title={`Remove ${pendingTextWidgetRemoval.type === "note" ? "sticky note" : "meal"}?`}
          onClose={() => setPendingTextWidgetRemoval(null)}
        >
          <p className="confirm-copy">This card will be torn from the board. You can add a new one later from Add to board.</p>
          <div className="dialog-actions">
            <span />
            <button className="secondary-button" type="button" onClick={() => setPendingTextWidgetRemoval(null)}>Keep card</button>
            <button
              className="danger-button solid"
              type="button"
              onClick={() => {
                const widget = pendingTextWidgetRemoval;
                setPendingTextWidgetRemoval(null);
                removeWidget(widget.id);
              }}
            >
              Remove card
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function WidgetHeading({
  kicker,
  title,
  icon,
  onAdd,
}: {
  kicker: string;
  title: string;
  icon: React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="widget-heading">
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
      </div>
      <button onClick={onAdd} aria-label={kicker === "To do" ? "Add task" : `Add to ${kicker}`}>
        {icon}
        <Plus />
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <button className="text-button" onClick={onAction}>
        {action} <ChevronRight />
      </button>
    </div>
  );
}

function FamilyAttentionRail({
  items,
  members,
  snapshot,
  expanded = false,
  onView,
  onComplete,
  onAcknowledge,
  onSnooze,
}: {
  items: AttentionItem[];
  members: HouseholdMember[];
  snapshot: HouseholdSnapshot;
  expanded?: boolean;
  onView: (view: View) => void;
  onComplete: (task: HouseholdTask) => void;
  onAcknowledge: (item: AttentionItem) => void;
  onSnooze: (item: AttentionItem) => void;
}) {
  const visible = expanded ? items : items.slice(0, 3);
  const reasonLabel: Record<AttentionItem["reason"], string> = {
    overdue: "Overdue",
    "due-today": "Due today",
    "approval-needed": "Needs a parent",
    missed: "Missed routine",
    "storage-warning": "Storage note",
    "update-ready": "Update ready",
  };
  const openSource = (item: AttentionItem) => {
    if (item.sourceType === "reward") onView("rewards");
    else if (item.sourceType === "schedule") onView("calendar");
    else if (item.sourceType === "routine") onView("lists");
    else onView("lists");
  };
  return (
    <section className={`attention-rail ${expanded ? "attention-rail-expanded" : ""}`} aria-labelledby={expanded ? "inbox-title" : "attention-title"}>
      <div className="attention-rail-heading">
        <div>
          <p className="section-kicker">Family inbox</p>
          <h2 id={expanded ? "inbox-title" : "attention-title"}>{items.length ? `${items.length} things need attention` : "All caught up"}</h2>
          <p>{items.length ? "A calm place for the little things that should not get lost." : "Nothing urgent is waiting for the household right now."}</p>
        </div>
        {!expanded && items.length > 3 && <button className="secondary-button" onClick={() => onView("inbox")}>View all <ChevronRight aria-hidden="true" /></button>}
      </div>
      {visible.length > 0 && (
        <div className="attention-list">
          {visible.map((item) => {
            const task = item.sourceType === "task" ? snapshot.tasks.find((candidate) => candidate.id === item.sourceId) : undefined;
            const names = item.memberIds.map((memberId) => members.find((member) => member.id === memberId)?.name).filter(Boolean).join(", ");
            return (
              <article className="attention-item" key={item.id}>
                <span className={`attention-icon attention-${item.reason}`} aria-hidden="true">
                  {item.reason === "approval-needed" ? <ShieldCheck /> : item.reason === "overdue" || item.reason === "missed" ? <BellRing /> : <Bell />}
                </span>
                <button className="attention-main" onClick={() => openSource(item)}>
                  <span className="attention-reason">{reasonLabel[item.reason]}</span>
                  <strong>{item.title}</strong>
                  <small>{item.summary}{names ? ` · ${names}` : ""}</small>
                </button>
                <div className="attention-actions">
                  {task && !task.completedAt && <button className="primary-button" onClick={() => onComplete(task)} aria-label={`Complete ${task.title}`}><Check aria-hidden="true" /> Complete</button>}
                  <button className="icon-button" onClick={() => onAcknowledge(item)} aria-label={`Acknowledge ${item.title}`}><CheckCircle2 aria-hidden="true" /></button>
                  <button className="icon-button" onClick={() => onSnooze(item)} aria-label={`Snooze ${item.title} for one hour`}><Timer aria-hidden="true" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DashboardView({
  view,
  snapshot,
  filterId,
  attentionItems,
  onFilter,
  onView,
  onEdit,
  onComplete,
  onSaveRoutine,
  onSaveList,
  onSaveListItem,
  onSaveMealPlan,
  onDeleteMealPlan,
  onAddMealIngredients,
  onDeleteList,
  onDeleteListItem,
  onSaveMember,
  onDeleteMember,
  onUpdateRoutine,
  onSaveReward,
  onSaveRewardDefinition,
  onSaveRewardGoal,
  onSaveRedemption,
  onSaveActivity,
  parentUnlocked,
  onRequestParentUnlock,
  onSavePhoto,
  onDeletePhoto,
  onAcknowledgeAttention,
  onSnoozeAttention,
}: {
  view: Exclude<View, "today" | "settings" | "guide">;
  snapshot: HouseholdSnapshot;
  filterId: string | null;
  attentionItems: AttentionItem[];
  onFilter: (id: string | null) => void;
  onView: (view: View) => void;
  onEdit: (target: EditorTarget) => void;
  onComplete: (task: HouseholdTask) => void;
  onSaveRoutine: (routine: Routine) => void;
  onSaveList: (list: HouseholdList) => void;
  onSaveListItem: (item: HouseholdListItem) => void;
  onSaveMealPlan: (mealPlan: MealPlan) => void;
  onDeleteMealPlan: (mealPlan: MealPlan) => void;
  onAddMealIngredients: (mealPlan: MealPlan) => void;
  onDeleteList: (list: HouseholdList) => void;
  onDeleteListItem: (item: HouseholdListItem) => void;
  onSaveMember: (member: HouseholdMember) => void;
  onDeleteMember: (member: HouseholdMember) => void;
  onUpdateRoutine: (routine: Routine) => void;
  onSaveReward: (entry: RewardLedgerEntry) => void;
  onSaveRewardDefinition: (definition: RewardDefinition) => void;
  onSaveRewardGoal: (goal: RewardGoal) => void;
  onSaveRedemption: (redemption: RewardRedemption) => Promise<boolean>;
  onSaveActivity: (entry: ActivityEntry) => void;
  parentUnlocked: boolean;
  onRequestParentUnlock: () => void;
  onSavePhoto: (photo: PhotoAsset) => void;
  onDeletePhoto: (photo: PhotoAsset) => void;
  onAcknowledgeAttention: (item: AttentionItem) => void;
  onSnoozeAttention: (item: AttentionItem) => void;
}) {
  const photos = [...(snapshot.photos ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [calendarQuery, setCalendarQuery] = useState("");
  const [calendarKind, setCalendarKind] = useState<ScheduleItem["kind"] | "">("");
  const visibleEvents = snapshot.scheduleItems
    .filter((item) => !filterId || item.memberIds.length === 0 || item.memberIds.includes(filterId))
    .filter((item) => {
      const query = calendarQuery.trim().toLowerCase();
      return !query || item.title.toLowerCase().includes(query) || item.notes?.toLowerCase().includes(query);
    })
    .filter((item) => !calendarKind || item.kind === calendarKind)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const visibleTasks = snapshot.tasks.filter(
    (task) => !filterId || task.assigneeIds.length === 0 || task.assigneeIds.includes(filterId),
  );
  const today = new Date();
  const weekEnd = new Date(today.getTime() + 7 * 86_400_000);
  const events = view === "week"
    ? visibleEvents.filter((item) => {
        const date = parseISO(item.startsAt);
        return date >= new Date(today.toDateString()) && date < weekEnd;
      })
    : visibleEvents;
  const selectedMember = snapshot.members.find((member) => member.id === filterId);
  const countdownLabel = (item: ScheduleItem) => {
    const target = item.calendarDate ? new Date(`${item.calendarDate}T00:00:00`) : parseISO(item.startsAt);
    const days = Math.ceil((target.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
    if (days < 0) return null;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };
  const [routineTitle, setRoutineTitle] = useState("");
  const [routineMemberId, setRoutineMemberId] = useState(snapshot.members[0]?.id ?? "");
  const [routineFrequency, setRoutineFrequency] = useState<Routine["frequency"]>("daily");
  const [routineWeekday, setRoutineWeekday] = useState(new Date().getDay());
  const [listTitle, setListTitle] = useState("");
  const [listKind, setListKind] = useState<HouseholdList["kind"]>("custom");
  const [listItemTitles, setListItemTitles] = useState<Record<string, string>>({});
  const [mealName, setMealName] = useState("");
  const [mealDate, setMealDate] = useState(todayInput());
  const [mealServingTime, setMealServingTime] = useState("18:00");
  const [mealCookMemberId, setMealCookMemberId] = useState(snapshot.members[0]?.id ?? "");
  const [mealPreparationNote, setMealPreparationNote] = useState("");
  const [mealIngredients, setMealIngredients] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardCost, setRewardCost] = useState("50");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("500");
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [historyType, setHistoryType] = useState<HistoryEntry["entityType"] | "">("");
  const [historyAction, setHistoryAction] = useState<HistoryEntry["action"] | "">("");
  const [historyDate, setHistoryDate] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => todayInput());
  const calendarStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });
  const mealPlans = [...(snapshot.mealPlans ?? [])].sort((a, b) => `${a.date}-${a.servingTime ?? ""}`.localeCompare(`${b.date}-${b.servingTime ?? ""}`));
  const activePhoto = photos[photoIndex] ?? photos[0];

  useEffect(() => {
    if (photos.length < 2) {
      setPhotoIndex(0);
      return;
    }
    const timer = window.setInterval(() => setPhotoIndex((current) => (current + 1) % photos.length), 30_000);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  useEffect(() => {
    if (photoIndex >= photos.length) setPhotoIndex(0);
  }, [photoIndex, photos.length]);

  if (view === "inbox") {
    return (
      <div className="settings-view inbox-view">
        <header>
          <p className="eyebrow">Household attention</p>
          <h1>Family Inbox</h1>
          <p>Actionable reminders, approvals, and missed routines in one calm place.</p>
        </header>
        <FamilyAttentionRail
          items={attentionItems}
          members={snapshot.members}
          snapshot={snapshot}
          expanded
          onView={onView}
          onComplete={onComplete}
          onAcknowledge={onAcknowledgeAttention}
          onSnooze={onSnoozeAttention}
        />
      </div>
    );
  }

  if (view === "people") {
    const saveMemberRole = (member: HouseholdMember, patch: Partial<HouseholdMember>) => {
      if (!parentUnlocked) {
        onRequestParentUnlock();
        return;
      }
      onSaveMember({ ...member, ...patch });
    };
    return (
      <div className="settings-view">
        <header><p className="eyebrow">Household</p><h1>People</h1><p>Choose a person to see their part of the plan.</p></header>
        <div className="settings-grid">
          <section className="settings-card people-all-card"><button className={!filterId ? "primary-button" : "secondary-button"} onClick={() => onFilter(null)}><Users /> Everyone {attentionItems.length > 0 && <b className="member-badge">{attentionItems.length}</b>}</button></section>
          <section className="settings-card add-person-card"><div><h2>Add someone</h2><p>Household members can have their own view and assignments.</p></div><input aria-label="New member name" placeholder="Name" value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} /><button className="primary-button" onClick={() => { if (!newMemberName.trim()) return; onSaveMember({ id: id(), householdId: snapshot.household.id, name: newMemberName.trim(), colorToken: "sky", symbol: newMemberName.trim().charAt(0).toUpperCase(), sortOrder: snapshot.members.length, role: "other" }); setNewMemberName(""); }}>Add member</button></section>
          {snapshot.members.map((member) => (
            <section className="settings-card people-card" key={member.id}>
              <div className={`settings-icon color-${member.colorToken}`}><Avatar member={member} /></div>
              <div><div className="people-name-row"><input aria-label={`Name for ${member.name}`} value={member.name} onChange={(event) => onSaveMember({ ...member, name: event.target.value, symbol: event.target.value.trim().charAt(0).toUpperCase() || member.symbol })} />{memberAttentionCount(member, attentionItems) > 0 && <span className="member-attention-label" aria-label={`${memberAttentionCount(member, attentionItems)} actionable items for ${member.name}`}><Bell /> {memberAttentionCount(member, attentionItems)}</span>}</div><select aria-label={`Role for ${member.name}`} value={member.role ?? "other"} onChange={(event) => saveMemberRole(member, { role: event.target.value as HouseholdMember["role"] })}><option value="parent">Parent</option><option value="admin">Admin</option><option value="child">Child</option><option value="teen">Teen</option><option value="grandparent">Grandparent</option><option value="other">Other</option></select><label className="inline-choice"><input type="checkbox" checked={member.rewardApprovalRequired ?? member.role === "child"} onChange={(event) => saveMemberRole(member, { rewardApprovalRequired: event.target.checked })} /> Approve Stars</label></div>
              <button className={filterId === member.id ? "primary-button" : "secondary-button"} onClick={() => { onFilter(member.id); onView("today"); }}>View plan</button><button className="icon-button" aria-label={`Remove ${member.name}`} onClick={() => onDeleteMember(member)}><Trash2 /></button>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (view === "rewards") {
    const ledger = snapshot.rewards ?? [];
    const definitions = snapshot.rewardDefinitions ?? [];
    const goals = snapshot.rewardGoals ?? [];
    const activities = [...(snapshot.activities ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
    const leaderboard = snapshot.members.map((member) => ({ member, stars: weeklyRewardBalance(member.id, snapshot.tasks, ledger) })).sort((a, b) => b.stars - a.stars);
    const saveDefinition = () => {
      if (!parentUnlocked || !rewardTitle.trim()) return;
      const now = new Date().toISOString();
      onSaveRewardDefinition({ id: id(), householdId: snapshot.household.id, title: rewardTitle.trim(), cost: Math.max(1, Number(rewardCost) || 1), icon: "⭐", active: true, createdAt: now, updatedAt: now });
      setRewardTitle("");
    };
    const saveGoal = () => {
      if (!parentUnlocked || !goalTitle.trim()) return;
      const now = new Date().toISOString();
      onSaveRewardGoal({ id: id(), householdId: snapshot.household.id, title: goalTitle.trim(), targetStars: Math.max(1, Number(goalTarget) || 1), active: true, createdAt: now, updatedAt: now });
      setGoalTitle("");
    };
    return (
      <div className="settings-view rewards-view">
        <header><p className="eyebrow">Celebrate progress</p><h1>Rewards</h1><p>Stars make progress visible without making the family compete for attention.</p></header>
        <section className="rewards-leaderboard settings-card"><div><p className="section-kicker">This week</p><h2>Personal progress</h2><p>Weekly rankings are optional; lifetime Stars and streaks stay with each person.</p></div><div className="leaderboard-list">{leaderboard.slice(0, 5).map(({ member, stars }, index) => <div className="leaderboard-row" key={member.id}><span>{index + 1}</span><Avatar member={member} small /><strong>{member.name}</strong><b>⭐ {stars}</b></div>)}</div></section>
        <div className="settings-grid rewards-profile-grid">{snapshot.members.map((member) => { const stars = rewardBalance(member.id, snapshot.tasks, ledger); const streak = currentStreak(member.id, snapshot.tasks); const pending = ledger.filter((entry) => entry.memberId === member.id && entry.status === "pending"); return <section className="settings-card reward-profile-card" key={member.id}><div className={`settings-icon color-${member.colorToken}`}><Avatar member={member} /></div><div><h2>{member.name}</h2><p>⭐ {stars} Stars · 🔥 {streak}-day streak · Level {levelForStars(stars)}</p><small>{snapshot.tasks.filter((task) => task.completedAt && task.assigneeIds.includes(member.id)).length} tasks completed</small>{pending.length > 0 && <p className="reward-pending">{pending.length} awaiting parent approval</p>}</div><div className="button-row"><button className="primary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveReward({ id: id(), householdId: snapshot.household.id, memberId: member.id, points: 1, reason: "Parent-awarded star", sourceType: "manual", status: "approved", createdAt: new Date().toISOString() }); }}>Add star</button><button className="secondary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveReward({ id: id(), householdId: snapshot.household.id, memberId: member.id, points: -1, reason: "Parent correction", sourceType: "manual", status: "approved", createdAt: new Date().toISOString() }); }}>Remove star</button><button className="secondary-button" onClick={() => { onFilter(member.id); onView("today"); }}>View plan</button></div></section>; })}</div>
        {ledger.some((entry) => entry.status === "pending") && <section className="settings-card reward-approvals"><div><p className="section-kicker">Parent review</p><h2>Approvals</h2><p>Child completions stay pending until a parent confirms the work.</p></div><div className="approval-list">{ledger.filter((entry) => entry.status === "pending").map((entry) => { const member = snapshot.members.find((candidate) => candidate.id === entry.memberId); return <div className="approval-row" key={entry.id}><span><strong>{member?.name ?? "Member"}</strong> completed a task for {entry.points} ⭐</span><div className="button-row"><button className="primary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveReward({ ...entry, status: "approved", approvedBy: "parent", approvedAt: new Date().toISOString() }); }}>Approve</button><button className="secondary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveReward({ ...entry, status: "denied", approvedBy: "parent", approvedAt: new Date().toISOString() }); }}>Needs more work</button></div></div>; })}</div></section>}
        <section className="settings-card rewards-shop"><div><p className="section-kicker">Rewards shop</p><h2>Give Stars somewhere to go</h2><p>Create rewards the household can request when they have enough Stars.</p></div><div className="reward-definition-list">{definitions.filter((reward) => reward.active).map((reward) => { const member = snapshot.members.find((candidate) => candidate.id === filterId) ?? snapshot.members[0]; const balance = member ? rewardBalance(member.id, snapshot.tasks, ledger) : 0; const canRequest = Boolean(member) && balance >= reward.cost; return <div className="reward-definition-row" key={reward.id}><span className="reward-icon">{reward.icon}</span><div><strong>{reward.title}</strong><small>{reward.description ?? "A parent-defined household reward"}</small></div><b>{reward.cost} ⭐</b><button className="secondary-button" disabled={!canRequest} title={canRequest ? `Request for ${member?.name}` : `Need ${Math.max(0, reward.cost - balance)} more Stars`} onClick={() => { if (!member || !canRequest) return; void onSaveRedemption({ id: id(), householdId: snapshot.household.id, rewardId: reward.id, memberId: member.id, cost: reward.cost, status: "requested", requestedAt: new Date().toISOString() }); }}>{canRequest ? "Request" : "Need more Stars"}</button></div>; })}</div>{(snapshot.rewardRedemptions ?? []).filter((redemption) => redemption.status === "requested").map((redemption) => { const member = snapshot.members.find((candidate) => candidate.id === redemption.memberId); const reward = definitions.find((candidate) => candidate.id === redemption.rewardId); const balance = rewardBalance(redemption.memberId, snapshot.tasks, ledger); return <div className="redemption-row" key={redemption.id}><span>{member?.name ?? "Member"} requested {reward?.title ?? "a reward"} for {redemption.cost} ⭐</span><div className="button-row"><button className="secondary-button" disabled={balance < redemption.cost} onClick={async () => { if (!parentUnlocked) return onRequestParentUnlock(); const approved = await onSaveRedemption({ ...redemption, status: "approved", decidedAt: new Date().toISOString(), decidedBy: "parent" }); if (approved) await onSaveReward({ id: id(), householdId: redemption.householdId, memberId: redemption.memberId, points: -redemption.cost, reason: `Redeemed ${reward?.title ?? "reward"}`, sourceType: "redemption", sourceId: redemption.id, status: "approved", createdAt: new Date().toISOString() }); }}>Approve</button><button className="secondary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); void onSaveRedemption({ ...redemption, status: "denied", decidedAt: new Date().toISOString(), decidedBy: "parent" }); }}>Decline</button></div></div>; })}<div className="reward-create-form"><input aria-label="Reward title" placeholder="Reward name" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} /><input aria-label="Reward cost" type="number" min="1" value={rewardCost} onChange={(event) => setRewardCost(event.target.value)} /> <button className="primary-button" onClick={saveDefinition}>{parentUnlocked ? "Add reward" : "Unlock to add"}</button></div></section>
        <section className="settings-card shared-goal-card"><div><p className="section-kicker">Shared goals</p><h2>Cooperative first</h2><p>The whole family can contribute toward something everyone wants.</p></div><div className="goal-list">{goals.filter((goal) => goal.active).map((goal) => { const progress = Math.min(goal.targetStars, ledger.filter((entry) => entry.points > 0).reduce((total, entry) => total + entry.points, 0)); return <div className="goal-row" key={goal.id}><div className="goal-row-heading"><strong>{goal.title}</strong><span>{progress} / {goal.targetStars} ⭐</span></div><div className="goal-progress"><span style={{ width: `${Math.round((progress / goal.targetStars) * 100)}%` }} /></div></div>; })}</div><div className="reward-create-form"><input aria-label="Shared goal title" placeholder="Family movie night" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} /><input aria-label="Shared goal target" type="number" min="1" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} /><button className="primary-button" onClick={saveGoal}>{parentUnlocked ? "Add goal" : "Unlock to add"}</button></div></section>
        <section className="settings-card activity-feed"><div><p className="section-kicker">Family activity</p><h2>Recent wins</h2><p>Encouragement stays visible without turning the board into surveillance.</p></div><div className="activity-list">{activities.length ? activities.map((activity) => <div className="activity-row" key={activity.id}><span>✨</span><span>{activity.summary}</span><small>{format(parseISO(activity.createdAt), "MMM d")}</small><div className="reaction-actions">{(["heart", "clap", "celebrate"] as const).map((reaction) => <button key={reaction} aria-label={`React with ${reaction}`} onClick={() => { const member = snapshot.members.find((candidate) => candidate.id === filterId) ?? snapshot.members[0]; if (member) onSaveActivity({ id: id(), householdId: snapshot.household.id, type: "reaction", entityId: activity.id, memberIds: [member.id], summary: `${member.name} reacted to a family win`, createdAt: new Date().toISOString() }); }}> {reaction === "heart" ? "❤️" : reaction === "clap" ? "👏" : "🎉"}</button>)}</div></div>) : <p>No wins yet—complete a task to start the feed.</p>}</div></section>
      </div>
    );
  }

  if (view === "photos") {
    const addPhotos = (files: FileList | null) => {
      if (!files?.length) return;
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          const photo: PhotoAsset = {
            id: id(),
            householdId: snapshot.household.id,
            name: file.name,
            mimeType: file.type || "image/*",
            dataUrl: String(reader.result),
            sortOrder: photos.length + index,
            createdAt: new Date().toISOString(),
          };
          onSavePhoto(photo);
        };
        reader.readAsDataURL(file);
      });
    };
    return (
      <div className="settings-view">
        <header><p className="eyebrow">Local memories</p><h1>Photos</h1><p>Choose one or more images from this device. OpenWall rotates them locally and does not upload them.</p></header>
        <section className="settings-card photo-manager">
          {activePhoto && !photoLoadFailed ? <img src={activePhoto.dataUrl} alt={activePhoto.caption ?? activePhoto.name} onError={() => setPhotoLoadFailed(true)} /> : <div className="photo-empty"><Image /><p>{photoLoadFailed ? "This saved photo could not be displayed. Choose it again to repair the card." : "No photos selected yet."}</p></div>}
          <div className="photo-manager-actions"><label className="secondary-button">{photos.length ? "Add photos" : "Choose photos"}<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { addPhotos(event.target.files); event.target.value = ""; }} /></label>{activePhoto && <button className="danger-button" onClick={() => { setPhotoLoadFailed(false); onDeletePhoto(activePhoto); }}>Remove selected</button>}</div>
          {photos.length > 0 && <div className="photo-rotation-summary" aria-live="polite"><strong>{photos.length} local photo{photos.length === 1 ? "" : "s"}</strong><span>Board rotation changes every 30 seconds.</span></div>}
          {photos.length > 0 && <div className="photo-thumbnails" aria-label="Selected household photos">{photos.map((photo, index) => <button className={index === photoIndex ? "selected" : ""} key={photo.id} onClick={() => { setPhotoIndex(index); setPhotoLoadFailed(false); }} aria-label={`Show ${photo.name}`}><img src={photo.dataUrl} alt="" /></button>)}</div>}
        </section>
      </div>
    );
  }

  if (view === "history") {
    const entries = [...(snapshot.history ?? [])].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const memberEntries = entries.filter((entry) => (!filterId || entry.memberIds.includes(filterId)) && (!historyType || entry.entityType === historyType) && (!historyAction || entry.action === historyAction) && (!historyDate || entry.occurredAt.slice(0, 10) === historyDate));
    const iconForAction = (action: HistoryEntry["action"]) => action === "completed" || action === "approved" || action === "awarded" ? <CheckCircle2 /> : action === "deleted" ? <Trash2 /> : action === "restored" ? <RotateCcw /> : action === "skipped" || action === "denied" ? <Minus /> : action === "reversed" ? <RotateCcw /> : <Bell />;
    return <div className="settings-view"><header><p className="eyebrow">Household memory</p><h1>History</h1><p>Completed, edited, and restored work stays easy to review.</p></header><section className="settings-card history-card"><div className="filter-row history-filters"><label>Person<select aria-label="Filter history by person" value={filterId ?? ""} onChange={(event) => onFilter(event.target.value || null)}><option value="">Everyone</option>{snapshot.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label>Type<select aria-label="Filter history by type" value={historyType} onChange={(event) => setHistoryType(event.target.value as HistoryEntry["entityType"] | "")}><option value="">Everything</option>{["task", "routine", "schedule", "reward", "photo"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label>Status<select aria-label="Filter history by status" value={historyAction} onChange={(event) => setHistoryAction(event.target.value as HistoryEntry["action"] | "")}><option value="">All changes</option>{["completed", "skipped", "missed", "edited", "deleted", "restored", "approved", "denied", "awarded", "reversed"].map((action) => <option key={action} value={action}>{action}</option>)}</select></label><label>Date<input aria-label="Filter history by date" type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} /></label></div><div className="cork-task-list">{memberEntries.length ? memberEntries.map((entry) => <div className={`history-row history-action-${entry.action}`} key={entry.id}>{iconForAction(entry.action)}<span><strong>{entry.summary}</strong><small>{entry.entityType} · {entry.action}</small></span><time>{format(parseISO(entry.occurredAt), "MMM d, h:mm a")}</time></div>) : <p>No history matches these filters yet.</p>}</div></section></div>;
  }

  const heading = view === "lists" ? "Lists" : view === "calendar" ? "Calendar" : "Week";
  const saveMeal = () => {
    if (!mealName.trim() || !mealDate) return;
    const now = new Date().toISOString();
    onSaveMealPlan({
      id: id(),
      householdId: snapshot.household.id,
      date: mealDate,
      name: mealName.trim(),
      servingTime: mealServingTime || undefined,
      cookMemberId: mealCookMemberId || undefined,
      preparationNote: mealPreparationNote.trim() || undefined,
      ingredientTitles: mealIngredients.split(",").map((item) => item.trim()).filter(Boolean),
      status: "planned",
      createdAt: now,
      updatedAt: now,
    });
    setMealName("");
    setMealPreparationNote("");
    setMealIngredients("");
  };
  if (view === "calendar") {
    const upcoming = visibleEvents.filter((item) => parseISO(item.endsAt) >= today).slice(0, 12);
    const selectedEvents = visibleEvents.filter(
      (item) =>
        (item.calendarDate ?? format(parseISO(item.startsAt), "yyyy-MM-dd")) ===
        selectedCalendarDate,
    );
    const changeMonth = (offset: number) => {
      const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
      setCalendarMonth(next);
      setSelectedCalendarDate(format(next, "yyyy-MM-dd"));
    };
    const returnToToday = () => {
      const current = new Date();
      setCalendarMonth(new Date(current.getFullYear(), current.getMonth(), 1));
      setSelectedCalendarDate(format(current, "yyyy-MM-dd"));
    };
    return (
      <div className="settings-view">
        <header className="dashboard-page-header">
          <div>
            <p className="eyebrow">{selectedMember ? `${selectedMember.name}'s plan` : "Household plan"}</p>
            <h1>Calendar</h1>
            <p>A familiar month view for appointments, school dates, reminders, and family plans.</p>
          </div>
          <button className="primary-button page-primary-action" onClick={() => onEdit({ kind: "event", initialDate: selectedCalendarDate })}>
            <Plus /> Add event
          </button>
        </header>
        <section className="settings-card calendar-card">
          <div className="calendar-toolbar">
            <div>
              <p className="section-kicker">Month</p>
              <h2 aria-live="polite">{format(calendarMonth, "MMMM yyyy")}</h2>
            </div>
            <div className="calendar-navigation" aria-label="Calendar month navigation">
              <button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft /></button>
              <button className="secondary-button" onClick={returnToToday}>Today</button>
              <button className="icon-button" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight /></button>
            </div>
          </div>
          <div className="calendar-filters" aria-label="Calendar filters">
            <label>
              Search schedule
              <input
                aria-label="Search calendar"
                type="search"
                placeholder="Search events and reminders"
                value={calendarQuery}
                onChange={(event) => setCalendarQuery(event.target.value)}
              />
            </label>
            <label>
              Type
              <select
                aria-label="Filter calendar by type"
                value={calendarKind}
                onChange={(event) => setCalendarKind(event.target.value as ScheduleItem["kind"] | "")}
              >
                <option value="">All types</option>
                <option value="event">Events</option>
                <option value="reminder">Reminders</option>
                <option value="school-closure">School closures</option>
                <option value="holiday">Holidays</option>
                <option value="early-dismissal">Early dismissals</option>
                <option value="personal-day">Personal days</option>
              </select>
            </label>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid" role="grid" aria-label={format(calendarMonth, "MMMM yyyy")}>{calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = visibleEvents.filter((item) => (item.calendarDate ?? format(parseISO(item.startsAt), "yyyy-MM-dd")) === key);
            const isOutsideMonth = day.getMonth() !== calendarMonth.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = key === selectedCalendarDate;
            return (
              <div
                className={`calendar-day${isOutsideMonth ? " is-muted" : ""}${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`}
                key={key}
                role="gridcell"
                aria-selected={isSelected}
              >
                <button
                  className="calendar-date-button"
                  onClick={() => {
                    setSelectedCalendarDate(key);
                    if (isOutsideMonth) setCalendarMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                  }}
                  aria-label={`${format(day, "MMMM d, yyyy")}${dayEvents.length ? `, ${dayEvents.length} item${dayEvents.length === 1 ? "" : "s"}` : ""}`}
                >
                  <time dateTime={key}>{format(day, "d")}</time>
                </button>
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 2).map((item) => (
                    <button className={`calendar-event kind-${item.kind ?? "event"}`} key={item.id} onClick={() => onEdit({ kind: "event", value: item })} title={item.title}>
                      <span className="calendar-event-marker" aria-hidden="true" />
                      <span className="calendar-event-title">{item.title}</span>
                    </button>
                  ))}
                  {dayEvents.length > 2 && <button className="calendar-more" onClick={() => setSelectedCalendarDate(key)}>+{dayEvents.length - 2} more</button>}
                </div>
              </div>
            );
          })}</div>
        </section>
        <section className="settings-card selected-day-card">
          <div className="selected-day-heading">
            <div>
              <p className="section-kicker">Selected day</p>
              <h2>{format(new Date(`${selectedCalendarDate}T12:00:00`), "EEEE, MMMM d")}</h2>
            </div>
            <button className="secondary-button" onClick={() => onEdit({ kind: "event", initialDate: selectedCalendarDate })}><Plus /> Add here</button>
          </div>
          <div className="selected-day-list">
            {selectedEvents.length ? selectedEvents.map((item) => (
              <button className="selected-day-event" key={item.id} onClick={() => onEdit({ kind: "event", value: item })}>
                <span className={`event-kind-dot kind-${item.kind ?? "event"}`} aria-hidden="true" />
                <span><strong>{item.title}</strong><small>{item.allDay ? "All day" : format(parseISO(item.startsAt), "h:mm a")}</small></span>
                <ChevronRight />
              </button>
            )) : <p className="calendar-empty-day">Nothing planned. Select <strong>Add here</strong> to schedule something.</p>}
          </div>
        </section>
        <section className="settings-card upcoming-card"><div className="settings-icon"><CalendarDays /></div><div><h2>Upcoming</h2><p>Future plans appear here immediately after saving.</p></div><div className="cork-task-list">{upcoming.length ? upcoming.map((item) => <button className="upcoming-row" key={item.id} onClick={() => onEdit({ kind: "event", value: item })}><span>{item.title}</span><small>{item.allDay ? (item.calendarDate ?? format(parseISO(item.startsAt), "MMM d")) : format(parseISO(item.startsAt), "MMM d · h:mm a")}</small></button>) : <p>No upcoming items yet.</p>}</div></section>
      </div>
    );
  }
  if (view === "week") {
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return day;
    });
    const dayKey = (date: Date) => dateKey(date);
    const weekDateKeys = dateKeysFrom(weekStart, weekDays.length);
    const recurringTasks = (snapshot.routines ?? []).flatMap((routine) =>
      weekDateKeys
        .filter((date) => routineOccursOnDate(routine, date))
        .map((date) => makeRoutineOccurrence(routine, date).task),
    );
    const weekTasks = Array.from(
      new Map(
        [...recurringTasks, ...visibleTasks]
          .filter((task) => task.dueDate && weekDateKeys.includes(task.dueDate))
          .map((task) => [task.id, task] as const),
      ).values(),
    );
    const eventsForDay = (date: Date) => visibleEvents.filter((item) => scheduleOccursOnDate(item, dayKey(date)));
    const tasksForDay = (date: Date) => weekTasks.filter((task) => task.dueDate === dayKey(date));
    return (
      <div className="settings-view week-view">
        <header className="dashboard-page-header">
          <div><p className="eyebrow">{selectedMember ? `${selectedMember.name}'s plan` : "Household plan"}</p><h1>Week</h1><p>A time-based view for the next seven days, including school days and family plans.</p></div>
          <button className="primary-button page-primary-action" onClick={() => onEdit({ kind: "event" })}><Plus /> Add event</button>
        </header>
        <section className="settings-card week-grid-card" aria-label="Weekly calendar">
          <div className="week-grid">
            {weekDays.map((day) => {
              const dayEvents = eventsForDay(day);
              const dayTasks = tasksForDay(day);
              return <section className={`week-day-column${isSameDay(day, today) ? " is-today" : ""}`} key={dayKey(day)}><header><span>{format(day, "EEE")}</span><strong>{format(day, "d")}</strong></header><div className="week-all-day"><small>All day</small>{dayEvents.filter((item) => item.allDay || item.kind === "school-closure").map((item) => <button key={`${item.id}-${dayKey(day)}`} className={`week-event all-day kind-${item.kind ?? "event"}`} onClick={() => onEdit({ kind: "event", value: item })}>{item.title}</button>)}</div><div className="week-timed-events">{dayEvents.filter((item) => !item.allDay && item.kind !== "school-closure").map((item) => <button key={`${item.id}-${dayKey(day)}`} className={`week-event kind-${item.kind ?? "event"}`} onClick={() => onEdit({ kind: "event", value: item })}><time>{format(parseISO(item.startsAt), "h:mm a")}</time><strong>{item.title}</strong></button>)}{dayTasks.map((task) => <button key={task.id} className={`week-event task-event${task.completedAt ? " is-complete" : ""}`} onClick={() => onComplete(task)}><time>{task.completedAt ? "Done" : "Task"}</time><strong>{task.title}</strong></button>)}{!dayEvents.length && !dayTasks.length && <p className="week-empty">Open day</p>}</div><button className="week-add-day" onClick={() => onEdit({ kind: "event", initialDate: dayKey(day) })} aria-label={`Add event on ${format(day, "EEEE, MMMM d")}`}><Plus /> Add</button></section>;
            })}
          </div>
        </section>
        <section className="settings-card week-agenda-card" aria-label="Weekly agenda">
          <div className="week-agenda-list">
            {weekDays.map((day) => {
              const dayEvents = eventsForDay(day);
              const dayTasks = tasksForDay(day);
              return <section className={`week-agenda-day${isSameDay(day, today) ? " is-today" : ""}`} key={dayKey(day)}><header><strong>{format(day, "EEEE, MMMM d")}</strong><button className="text-button" onClick={() => onEdit({ kind: "event", initialDate: dayKey(day) })}><Plus /> Add</button></header>{dayEvents.map((item) => <button className={`week-agenda-event kind-${item.kind ?? "event"}`} key={`${item.id}-${dayKey(day)}`} onClick={() => onEdit({ kind: "event", value: item })}><span>{item.allDay || item.kind === "school-closure" ? "All day" : format(parseISO(item.startsAt), "h:mm a")}</span><strong>{item.title}</strong></button>)}{dayTasks.map((task) => <button className={`week-agenda-event task-event${task.completedAt ? " is-complete" : ""}`} key={task.id} onClick={() => onComplete(task)}><span>{task.completedAt ? "Done" : "Task"}</span><strong>{task.title}</strong></button>)}{!dayEvents.length && !dayTasks.length && <p>Open day</p>}</section>;
            })}
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="settings-view">
      <header><p className="eyebrow">{selectedMember ? `${selectedMember.name}'s plan` : "Household plan"}</p><h1>{heading}</h1><p>{view === "lists" ? "Shared tasks and lists for the household." : "Future plans are visible as soon as they are saved."}</p></header>
      <div className="settings-grid">
        <section className="settings-card"><div className="settings-icon"><CalendarDays /></div><div><h2>Schedule</h2><p>{events.length} item{events.length === 1 ? "" : "s"} visible</p></div><button className="secondary-button" onClick={() => onEdit({ kind: "event" })}><Plus /> Add event</button></section>
        {view === "lists" && <section className="settings-card list-create-card"><div className="settings-icon"><ListPlus /></div><div><h2>Make a shared list</h2><p>Keep groceries, school bags, and household projects together.</p></div><input aria-label="List title" placeholder="Weekend errands" value={listTitle} onChange={(event) => setListTitle(event.target.value)} /><select aria-label="List type" value={listKind} onChange={(event) => setListKind(event.target.value as HouseholdList["kind"])}><option value="custom">Custom</option><option value="grocery">Grocery</option><option value="packing">Packing</option><option value="school">School</option><option value="chores">Chores</option></select><button className="primary-button" onClick={() => { if (!listTitle.trim()) return; const now = new Date().toISOString(); onSaveList({ id: id(), householdId: snapshot.household.id, title: listTitle.trim(), kind: listKind, memberIds: [], createdAt: now, updatedAt: now }); setListTitle(""); }}>Add list</button></section>}
        {view === "lists" && <section className="settings-card routine-builder-card"><div className="settings-icon"><RotateCcw /></div><div><h2>Repeat a routine</h2><p>Create a chore once and keep it on the family’s rhythm.</p></div><input aria-label="Routine title" placeholder="Morning checklist" value={routineTitle} onChange={(event) => setRoutineTitle(event.target.value)} /><select aria-label="Routine frequency" value={routineFrequency} onChange={(event) => setRoutineFrequency(event.target.value as Routine["frequency"])}><option value="daily">Every day</option><option value="weekly">Every week</option><option value="school-days">School days</option></select>{routineFrequency === "weekly" && <select aria-label="Routine weekday" value={routineWeekday} onChange={(event) => setRoutineWeekday(Number(event.target.value))}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select>}<select aria-label="Routine assignee" value={routineMemberId} onChange={(event) => setRoutineMemberId(event.target.value)}>{snapshot.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><button className="primary-button" onClick={() => { if (!routineTitle.trim()) return; const now = new Date().toISOString(); onSaveRoutine({ id: id(), householdId: snapshot.household.id, title: routineTitle.trim(), assigneeIds: [routineMemberId], frequency: routineFrequency, ...(routineFrequency === "weekly" ? { weekdays: [routineWeekday] } : {}), createdAt: now, updatedAt: now }); setRoutineTitle(""); }}>Add routine</button></section>}
        {view === "lists" && <section className="settings-card meal-planner-card"><div className="settings-icon"><Utensils /></div><div><h2>Plan meals</h2><p>Keep the week’s meals and ingredients together. Add ingredients to a grocery list when you are ready.</p></div><div className="meal-planner-form"><input aria-label="Meal name" placeholder="Meal name" value={mealName} onChange={(event) => setMealName(event.target.value)} /><input aria-label="Meal date" type="date" value={mealDate} onChange={(event) => setMealDate(event.target.value)} /><input aria-label="Meal serving time" type="time" value={mealServingTime} onChange={(event) => setMealServingTime(event.target.value)} /><select aria-label="Meal cook" value={mealCookMemberId} onChange={(event) => setMealCookMemberId(event.target.value)}><option value="">Anyone</option>{snapshot.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><input aria-label="Meal preparation note" placeholder="Preparation note" value={mealPreparationNote} onChange={(event) => setMealPreparationNote(event.target.value)} /><input aria-label="Meal ingredients" placeholder="Ingredients, separated by commas" value={mealIngredients} onChange={(event) => setMealIngredients(event.target.value)} /><button className="primary-button" onClick={saveMeal}>Add meal</button></div><div className="meal-plan-list">{mealPlans.length ? mealPlans.map((meal) => { const cook = snapshot.members.find((member) => member.id === meal.cookMemberId); return <article className="meal-plan-row" key={meal.id}><div><strong>{meal.name}</strong><span>{format(parseISO(`${meal.date}T12:00:00`), "EEE, MMM d")}{meal.servingTime ? ` · ${meal.servingTime}` : ""}{cook ? ` · ${cook.name}` : ""}</span>{meal.preparationNote && <small>{meal.preparationNote}</small>}{meal.ingredientTitles.length > 0 && <small>Ingredients: {meal.ingredientTitles.join(", ")}</small>}</div><div className="meal-plan-actions"><select aria-label={`Status for ${meal.name}`} value={meal.status} onChange={(event) => onSaveMealPlan({ ...meal, status: event.target.value as MealPlan["status"], updatedAt: new Date().toISOString() })}><option value="planned">Planned</option><option value="cooking">Cooking</option><option value="served">Served</option></select><button className="secondary-button" onClick={() => onAddMealIngredients(meal)} disabled={!meal.ingredientTitles.length}>Add ingredients</button><button className="icon-button" aria-label={`Remove meal ${meal.name}`} onClick={() => onDeleteMealPlan(meal)}><Trash2 /></button></div></article>; }) : <p className="list-empty">No meals planned yet.</p>}</div></section>}
        {view !== "lists" && events.map((item) => <section className="settings-card" key={item.id}><div className="settings-icon"><CalendarDays /></div><div><h2>{item.title}</h2><p>{item.allDay || item.kind === "school-closure" ? "All day" : format(parseISO(item.startsAt), "EEE, MMM d · h:mm a")}{countdownLabel(item) ? ` · ${countdownLabel(item)}` : ""}</p></div><button className="secondary-button" onClick={() => onEdit({ kind: "event", value: item })}>Edit</button></section>)}
        {view === "lists" && visibleTasks.map((task) => <section className="settings-card" key={task.id}><div className="settings-icon"><ListChecks /></div><div><h2>{task.title}</h2><p>{task.completedAt ? "Complete" : task.dueDate ? `Due ${task.dueDate}` : "No due date"}</p></div><button className={task.completedAt ? "secondary-button" : "primary-button"} onClick={() => onComplete(task)}>{task.completedAt ? "Completed" : "Complete"}</button></section>)}
        {view === "lists" && (snapshot.routines ?? []).map((routine) => <section className="settings-card" key={routine.id}><div className="settings-icon"><RotateCcw /></div><div><h2>{routine.title}</h2><p>Repeats {routine.frequency}; assigned to {routine.assigneeIds.map((memberId) => getMember(memberId, snapshot.members)?.name).filter(Boolean).join(", ")}</p></div><button className="secondary-button" onClick={() => onUpdateRoutine({ ...routine, skippedDates: [...(routine.skippedDates ?? []), todayInput()], updatedAt: new Date().toISOString() })}>Skip today</button></section>)}
        {view === "lists" && (snapshot.lists ?? []).map((list) => {
          const items = (snapshot.listItems ?? []).filter((item) => item.listId === list.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const draft = listItemTitles[list.id] ?? "";
          return <section className="settings-card household-list-card" key={list.id}><div className="settings-icon"><ListChecks /></div><div className="household-list-heading"><h2>{list.title}</h2><p>{list.kind[0].toUpperCase() + list.kind.slice(1)} list · {items.filter((item) => item.completedAt).length}/{items.length} complete</p></div><button className="icon-button list-remove-button" type="button" aria-label={`Remove list ${list.title}`} onClick={() => onDeleteList(list)}><Trash2 /></button><div className="household-list-items">{items.length ? items.map((item) => <div className={`list-item-row ${item.completedAt ? "completed" : ""}`} key={item.id}><input id={`list-item-${item.id}`} type="checkbox" checked={Boolean(item.completedAt)} onChange={() => onSaveListItem({ ...item, completedAt: item.completedAt ? undefined : new Date().toISOString(), updatedAt: new Date().toISOString() })} /><label htmlFor={`list-item-${item.id}`}>{item.title}</label><button className="icon-button" type="button" aria-label={`Remove ${item.title}`} onClick={() => onDeleteListItem(item)}><X /></button></div>) : <p className="list-empty">No items yet.</p>}<div className="list-add-row"><input aria-label={`Add item to ${list.title}`} placeholder="Add an item" value={draft} onChange={(event) => setListItemTitles((current) => ({ ...current, [list.id]: event.target.value }))} /><button className="secondary-button" onClick={() => { if (!draft.trim()) return; const now = new Date().toISOString(); onSaveListItem({ id: id(), listId: list.id, householdId: snapshot.household.id, title: draft.trim(), sortOrder: items.length, createdAt: now, updatedAt: now }); setListItemTitles((current) => ({ ...current, [list.id]: "" })); }}>Add item</button></div></div></section>;
        })}
      </div>
    </div>
  );
}

function SettingsView({
  snapshot,
  onImport,
  onSampleReset,
  onTestSampleReset,
  onHouseholdReset,
  notice,
  onStartTour,
  guideState,
  onDismissTip,
  suppressTips = false,
  appearance,
  onAppearanceChange,
  onAppearanceReset,
  displaySchedule,
  onDisplayScheduleChange,
  online,
  offlineReady,
  installPrompt,
  installed,
  onInstall,
  onSync,
  updateStatus,
  updateStatusMessage,
  onUpdateApp,
  parentUnlocked,
  onRequestParentUnlock,
}: {
  snapshot: HouseholdSnapshot;
  onImport: (file: File) => void;
  onSampleReset: () => void;
  onTestSampleReset: () => void;
  onHouseholdReset: () => void;
  notice: Notice;
  onStartTour: (trigger?: HTMLElement | null) => void;
  guideState: GuideState;
  onDismissTip: (tipId: string) => void;
  suppressTips?: boolean;
  appearance: AppearancePreferences;
  onAppearanceChange: (next: AppearancePreferences) => void;
  onAppearanceReset?: () => void;
  displaySchedule: DisplaySchedulePreferences;
  onDisplayScheduleChange: (next: DisplaySchedulePreferences) => void;
  online: boolean;
  offlineReady: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  onInstall: () => Promise<void>;
  onSync: () => Promise<void>;
  updateStatus: AppUpdateStatus;
  updateStatusMessage: string;
  onUpdateApp: UpdateAppAction;
  parentUnlocked: boolean;
  onRequestParentUnlock: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportData = () => {
    const blob = new Blob([serializeBackup(snapshot, snapshot.boardWidgets)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `openwall-${format(new Date(), "yyyy-MM-dd")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="settings-view">
      <header>
        <p className="eyebrow">Your OpenWall</p>
        <h1>Settings & privacy</h1>
        <p>Everything here stays on this device unless you export it.</p>
      </header>
      {notice && (
        <div className={`notice ${notice.tone}`} role="status">
          {notice.message}
        </div>
      )}
      <nav className="settings-index" aria-label="Settings sections">
        <a href="#settings-install">Install</a>
        <a href="#settings-appearance">Appearance</a>
        <a href="#settings-display-schedule">Display schedule</a>
        <a href="#settings-parent">Parent mode</a>
        <a href="#settings-backup">Backup & restore</a>
        <a href="#settings-updates">Updates</a>
        <a href="#settings-data">Household data</a>
      </nav>
      {!suppressTips && !isTipDismissed(guideState, TIP_IDS.SETTINGS_BACKUP) && (
        <CoachMark
          tipId={TIP_IDS.SETTINGS_BACKUP}
          kicker="Backup & privacy"
          message="OpenWall stores household records and board layout on this device. Export a backup before clearing browser data."
          onDismiss={onDismissTip}
        />
      )}
      <InstallEducation
        id="settings-install"
        online={online}
        offlineReady={offlineReady}
        installPrompt={installPrompt}
        installed={installed}
        onInstall={onInstall}
      />
      <div id="settings-appearance"><AppearanceSection
        preferences={appearance}
        onChange={onAppearanceChange}
        onReset={onAppearanceReset}
      /></div>
      <section id="settings-display-schedule" className="settings-card display-schedule-card">
        <div className="settings-icon"><Timer /></div>
        <div><h2>Display schedule</h2><p>Set quiet sleep hours and calmer focus hours for this display. These preferences stay on this device.</p></div>
        <label className="inline-choice"><input type="checkbox" checked={displaySchedule.enabled} onChange={(event) => onDisplayScheduleChange({ ...displaySchedule, enabled: event.target.checked })} /> Enable display schedule</label>
        <div className="display-schedule-fields">
          <label>Focus starts<input type="time" value={displaySchedule.focusStart} onChange={(event) => onDisplayScheduleChange({ ...displaySchedule, focusStart: event.target.value })} /></label>
          <label>Focus ends<input type="time" value={displaySchedule.focusEnd} onChange={(event) => onDisplayScheduleChange({ ...displaySchedule, focusEnd: event.target.value })} /></label>
          <label>Sleep starts<input type="time" value={displaySchedule.sleepStart} onChange={(event) => onDisplayScheduleChange({ ...displaySchedule, sleepStart: event.target.value })} /></label>
          <label>Sleep ends<input type="time" value={displaySchedule.sleepEnd} onChange={(event) => onDisplayScheduleChange({ ...displaySchedule, sleepEnd: event.target.value })} /></label>
        </div>
        {displaySchedule.enabled && <p className="display-schedule-status" role="status">Current mode: {displayModeAt(new Date(), displaySchedule)} · sleep {displaySchedule.sleepStart}–{displaySchedule.sleepEnd}</p>}
      </section>
      <section id="settings-parent" className="settings-card parent-protection-card">
        <div className="settings-icon"><ShieldCheck /></div>
        <div><h2>Parent mode</h2><p>{parentUnlocked ? "Protected actions are unlocked for 15 minutes on this device." : hasParentPin() ? "Reward edits and approvals are protected by your local parent PIN." : "Create a local parent PIN before changing reward rules or approving Stars."}</p></div>
        <button className={parentUnlocked ? "secondary-button" : "primary-button"} onClick={onRequestParentUnlock}>{parentUnlocked ? "Parent mode on" : hasParentPin() ? "Unlock parent mode" : "Create parent PIN"}</button>
      </section>
      <div className="settings-grid">
        <section id="settings-backup" className="settings-card">
          <div className="settings-icon">
            <Download />
          </div>
          <div>
            <h2>Back up your household</h2>
            <p>
              Download a readable, versioned copy of household records and the current board layout.
              Device-only Guide preferences remain on this device.
            </p>
          </div>
          <button className="secondary-button" onClick={exportData}>
            <Download /> Export backup
          </button>
        </section>
        <section id="settings-updates" className="settings-card settings-utility-card">
          <div className="settings-icon"><RefreshCw /></div>
          <div>
            <h2>Keep OpenWall current</h2>
            <p>Backups move your household safely. Sync refreshes this browser’s local copy; cloud sync is not enabled yet.</p>
            <p className="settings-update-status" aria-live="polite">{updateStatusMessage}</p>
          </div>
          <div className="settings-action-row">
            <button className="secondary-button" onClick={onSync} type="button"><RefreshCw /> Sync local data</button>
            <button className={updateStatus === "ready" ? "primary-button" : "secondary-button"} onClick={onUpdateApp} disabled={updateStatus === "updating"} type="button">
              <Download /> {updateStatus === "checking" ? "Checking…" : updateStatus === "updating" ? "Updating…" : "Update app"}
            </button>
          </div>
        </section>
        <section className="settings-card">
          <div className="settings-icon">
            <Upload />
          </div>
          <div>
            <h2>Restore from a backup</h2>
            <p>
              OpenWall checks the file before replacing household records and board layout.
            </p>
          </div>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
          <button className="secondary-button" onClick={() => fileRef.current?.click()}>
            <Upload /> Choose backup
          </button>
        </section>
        <section className="settings-card">
          <div className="settings-icon">
            <ShieldCheck />
          </div>
          <div>
            <h2>Private by default</h2>
            <p>
              No account, analytics, advertising, or cloud sync. Clearing this browser’s site data
              can remove your household, so keep a backup.
            </p>
          </div>
          <span className="local-pill">
            <Leaf /> Local only
          </span>
        </section>
        <section className="settings-card">
          <div className="settings-icon">
            <Compass />
          </div>
          <div>
            <h2>Guided orientation</h2>
            <p>
              Take the 60-second tour again to review boards, widgets, countdowns, and offline
              privacy.
            </p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={(e) => onStartTour(e.currentTarget)}
          >
            <Compass /> Replay tour
          </button>
        </section>
        <section id="settings-data" className="settings-card danger-zone">
          <div className="settings-icon">
            <RotateCcw />
          </div>
          <div>
            <h2>Reset sample</h2>
            <p>Replace the current household with fresh fictional sample data.</p>
          </div>
          <button className="secondary-button" onClick={onSampleReset}>
            <RotateCcw /> Load sample
          </button>
          <button className="secondary-button" onClick={onTestSampleReset}>
            <Users /> Load 8-person test bench
          </button>
        </section>
        <section className="settings-card danger-zone">
          <div className="settings-icon">
            <Trash2 />
          </div>
          <div>
            <h2>Erase this household</h2>
            <p>
              Remove household members, schedules, and tasks from this browser. Device-specific
              Guide preferences may remain.
            </p>
          </div>
          <button className="danger-button" onClick={onHouseholdReset}>
            <Trash2 /> Erase household
          </button>
        </section>
      </div>
      <footer className="settings-footer">
        <strong>OpenWall {LATEST_RELEASE.version}</strong>
        <span>Apache-2.0 · Open source · Local first</span>
      </footer>
    </div>
  );
}

const PWA_POST_UPDATE_KEY = "openwall-pwa-post-update";

export default function App() {
  const [snapshot, setSnapshot] = useState<HouseholdSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState(false);
  const [view, setView] = useState<View>("today");
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: string;
    run: () => void;
  } | null>(null);
  const [offlineReady, setOfflineReady] = useState(() => loadOfflineReadiness());
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isRunningStandalone());
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null);
  const [updateStatus, setUpdateStatus] = useState<AppUpdateStatus>("idle");
  const [updateStatusMessage, setUpdateStatusMessage] = useState("Select Update app to check for a newer build.");
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const updateReadyRef = useRef(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [guideState, setGuideState] = useState<GuideState>(() => loadGuideState());
  const [tourOpen, setTourOpen] = useState(false);
  const [tourTrigger, setTourTrigger] = useState<HTMLElement | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [guideInitialTab, setGuideInitialTab] = useState<"articles" | "releases">("articles");
  const [parentUnlocked, setParentUnlocked] = useState(() => isParentUnlocked());
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinConfirmation, setPinConfirmation] = useState("");
  const [pinSetupMode, setPinSetupMode] = useState(false);
  useEffect(() => {
    if (!parentUnlocked) return;
    const timer = window.setInterval(() => { if (!isParentUnlocked()) setParentUnlocked(false); }, 30_000);
    return () => window.clearInterval(timer);
  }, [parentUnlocked]);
  const [postUpdateIntent, setPostUpdateIntent] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    try {
      const item = window.sessionStorage.getItem(PWA_POST_UPDATE_KEY);
      if (item === "true") {
        window.sessionStorage.removeItem(PWA_POST_UPDATE_KEY);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [appearance, setAppearance] = useState<AppearancePreferences>(() => {
    const initial = loadAppearancePreferences();
    applyAppearanceToDOM(initial);
    return initial;
  });
  const [displaySchedule, setDisplaySchedule] = useState<DisplaySchedulePreferences>(() => loadDisplaySchedule());
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => displayModeAt(new Date(), loadDisplaySchedule()));
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    applyAppearanceToDOM(appearance);
    saveAppearancePreferences(appearance);
  }, [appearance]);

  useEffect(() => {
    saveDisplaySchedule(displaySchedule);
    const update = () => setDisplayMode(displayModeAt(new Date(), displaySchedule));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [displaySchedule]);

  useEffect(() => {
    let cancelled = false;
    if (typeof navigator === "undefined") return () => { cancelled = true; };
    const estimate = navigator.storage?.estimate;
    if (!estimate) {
      setStorageWarning(false);
      return () => { cancelled = true; };
    }
    void estimate.call(navigator.storage).then(({ usage, quota }) => {
      if (!cancelled) setStorageWarning(Boolean(quota && usage && usage / quota >= 0.85));
    }).catch(() => {
      if (!cancelled) setStorageWarning(false);
    });
    return () => { cancelled = true; };
  }, [snapshot?.household.id]);

  const handleAppearanceChange = (next: AppearancePreferences) => {
    setAppearance(next);
  };

  const handleAppearanceReset = () => {
    setAppearance(DEFAULT_APPEARANCE);
  };

  const handleBoardLayoutChange = useCallback((widgets: BoardWidget[]) => {
    setSnapshot((current) => (current ? { ...current, boardWidgets: widgets } : current));
  }, []);

  const requestParentUnlock = () => {
    if (!hasParentPin()) { setPinSetupMode(true); setPinValue(""); setPinConfirmation(""); setPinPrompt(true); return; }
    setPinSetupMode(false); setPinPrompt(true);
  };
  const handlePinSubmit = async () => {
    try {
      if (pinSetupMode) {
        if (pinValue !== pinConfirmation) {
          setNotice({ tone: "error", message: "The PINs do not match. Enter them again." });
          return;
        }
        await setParentPin(pinValue);
        setParentUnlocked(true);
        setPinPrompt(false);
        setPinValue("");
        setPinConfirmation("");
        setNotice({ tone: "success", message: "Parent mode is unlocked for 15 minutes on this device." });
      } else if (await unlockParentMode(pinValue)) {
        setParentUnlocked(true); setPinPrompt(false); setPinValue(""); setPinConfirmation("");
      } else setNotice({ tone: "error", message: "That PIN didn’t match. Try again." });
    } catch (error) { setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not save the PIN." }); }
  };

  const handleDismissTip = (tipId: string) => {
    const next = dismissTip(tipId);
    setGuideState(next);
  };

  const handleSeeWhatsNew = () => {
    const next = markReleaseSeen(LATEST_RELEASE.version);
    setGuideState(next);
    setPostUpdateIntent(false);
    setGuideInitialTab("releases");
    setView("guide");
  };

  const handleDismissWhatsNew = () => {
    const next = markReleaseSeen(LATEST_RELEASE.version);
    setGuideState(next);
    setPostUpdateIntent(false);
  };

  const handlePwaUpdate = async () => {
    if (updateInProgress) return;
    setUpdateInProgress(true);
    setUpdateStatus("updating");
    setUpdateStatusMessage("Installing the update. Your household data will stay on this device.");
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(PWA_POST_UPDATE_KEY, "true");
      } catch {
        // ignore
      }
    }
    try {
      if (update) {
        // Every household mutation is persisted before this action is exposed.
        // The service-worker helper activates the new shell and reloads the page.
        await update();
      } else {
        const registration = await window.navigator.serviceWorker?.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          await new Promise<void>((resolve) => {
            const onControllerChange = () => {
              window.navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
              resolve();
            };
            window.navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange, { once: true });
            window.setTimeout(resolve, 1500);
          });
        } else {
          await registration?.update();
        }
        window.location.reload();
      }
    } catch {
      setUpdateInProgress(false);
      setUpdateStatus("error");
      setUpdateStatusMessage("The update could not be installed. Your household data is safe.");
      setNotice({ tone: "error", message: "The update could not be installed. Your saved household is safe; try again when online." });
    }
  };

  const handleSync = async () => {
    try {
      const current = await repository.load();
      if (current) setSnapshot(current);
      setNotice({ tone: "success", message: "Local household data is synced with this browser." });
    } catch {
      setNotice({ tone: "error", message: "Local sync could not read this browser’s data. Your saved household was not changed." });
    }
  };

  const handleCheckForUpdates = async () => {
    if (updateStatus === "checking") return;
    if (update) {
      await handlePwaUpdate();
      return;
    }
    let registration: ServiceWorkerRegistration | undefined;
    try {
      registration = await window.navigator.serviceWorker?.getRegistration();
    } catch {
      setUpdateStatus("error");
      setUpdateStatusMessage("The update check could not complete. Your household data is safe.");
      setNotice({ tone: "error", message: "The update check could not complete. Try again when online." });
      return;
    }
    if (registration?.waiting) {
      await handlePwaUpdate();
      return;
    }
    if (!online) {
      setUpdateStatus("error");
      setUpdateStatusMessage("Updates require an internet connection.");
      setNotice({ tone: "warning", message: "Updates require an internet connection. Your saved household is still available offline." });
      return;
    }
    setUpdateStatus("checking");
    setUpdateStatusMessage("Checking for a newer app build…");
    updateReadyRef.current = false;
    try {
      if (registration) {
        await registration.update();
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        if (updateReadyRef.current || registration.waiting) {
          setUpdateStatus("ready");
          setUpdateStatusMessage("A new version is ready. Select Update app to install it.");
          setNotice({ tone: "success", message: "A new version is ready. Select Update app to install it." });
        } else {
          setUpdateStatus("current");
          setUpdateStatusMessage("OpenWall is up to date.");
          setNotice({ tone: "success", message: "OpenWall is up to date." });
        }
      } else {
        setUpdateStatus("current");
        setUpdateStatusMessage("No active update service yet. OpenWall will check after an online visit.");
        setNotice({ tone: "success", message: "This browser has no active update service yet. OpenWall will check again after an online visit." });
      }
    } catch {
      setUpdateStatus("error");
      setUpdateStatusMessage("The update check could not complete. Your household data is safe.");
      setNotice({ tone: "error", message: "The update check could not complete. Try again when online." });
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  useEffect(() => {
    const handleTourEvent = (event: Event) => {
      const detail = (event as CustomEvent<StartTourEventDetail>).detail;
      setTourStep(detail?.stepIndex ?? 0);
      setTourTrigger(detail?.triggerElement ?? (document.activeElement as HTMLElement | null));
      setTourOpen(true);
    };
    window.addEventListener(GUIDE_EVENT_START_TOUR, handleTourEvent);
    return () => {
      window.removeEventListener(GUIDE_EVENT_START_TOUR, handleTourEvent);
    };
  }, []);

  const handleStartTour = (trigger?: HTMLElement | null, step = 0) => {
    setTourStep(step);
    setTourTrigger(trigger ?? (document.activeElement as HTMLElement | null));
    setTourOpen(true);
  };

  const handleCompleteTour = () => {
    const next = completeTour();
    setGuideState(next);
    setTourOpen(false);
  };

  const handleDismissTour = () => {
    const next = dismissTour(true);
    setGuideState(next);
    setTourOpen(false);
  };

  const handleCloseTour = () => {
    setTourOpen(false);
  };

  const handleDismissGuideCard = () => {
    const next = dismissTour(true);
    setGuideState(next);
  };

  useEffect(() => {
    repository
      .load()
      .then(async (current) => {
        if (!current || !current.routines?.length) return current;
        const occurrenceDate = todayInput();
        const existing = new Set(
          current.tasks
            .filter((task) => task.occurrenceDate === occurrenceDate)
            .map((task) => task.routineId),
        );
        const additions = current.routines
          .filter((routine) => {
            if (existing.has(routine.id)) return false;
            return routineOccursOnDate(routine, occurrenceDate);
          })
          .map((routine) => makeRoutineOccurrence(routine, occurrenceDate).task);
        const occurrences: RoutineOccurrence[] = additions.map((task) => {
          const routine = current.routines?.find((candidate) => candidate.id === task.routineId);
          return routine ? makeRoutineOccurrence(routine, occurrenceDate).occurrence : {
            id: `occurrence-${task.routineId}-${occurrenceDate}`,
            householdId: task.householdId,
            routineId: task.routineId!,
            occurrenceDate,
            status: "pending",
            assigneeIds: task.assigneeIds,
            updatedAt: task.updatedAt,
          };
        });
        if (!additions.length) return current;
        await Promise.all(additions.map((task) => repository.saveTask(task)));
        await Promise.all(occurrences.map((occurrence) => repository.saveRoutineOccurrence(occurrence)));
        return { ...current, tasks: [...current.tasks, ...additions], routineOccurrences: [...(current.routineOccurrences ?? []), ...occurrences] };
      })
      .then(setSnapshot)
      .catch(() =>
        setNotice({ tone: "error", message: "OpenWall couldn’t read this device’s saved data." }),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool || !snapshot) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "get_today_board",
          title: "Read today's household board",
          description: "Read today's OpenWall schedule and tasks without changing household data.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          async execute() {
            const current = await repository.load();
            if (!current) throw new Error("No household has been set up.");
            const todaysEvents = current.scheduleItems.filter((item) =>
              isSameDay(parseISO(item.startsAt), new Date()),
            );
            const todaysTasks = current.tasks.filter(
              (task) => !task.dueDate || task.dueDate === todayInput(),
            );
            return {
              household: current.household.name,
              date: todayInput(),
              scheduleItems: todaysEvents.map((item) => ({
                id: item.id,
                title: item.title,
                startsAt: item.startsAt,
                endsAt: item.endsAt,
                memberIds: item.memberIds,
              })),
              tasks: todaysTasks.map((task) => ({
                id: task.id,
                title: task.title,
                assigneeIds: task.assigneeIds,
                completed: Boolean(task.completedAt),
              })),
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      context.registerTool(
        {
          name: "complete_household_task",
          title: "Complete a household task",
          description:
            "Mark one existing OpenWall household task complete and update the visible board.",
          inputSchema: {
            type: "object",
            properties: { taskId: { type: "string", minLength: 1 } },
            required: ["taskId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            const taskId =
              typeof input === "object" && input && "taskId" in input
                ? (input as { taskId?: unknown }).taskId
                : undefined;
            if (typeof taskId !== "string") throw new Error("taskId is required.");
            const task = snapshot.tasks.find((candidate) => candidate.id === taskId);
            if (!task) throw new Error("Task not found.");
            const updated = {
              ...task,
              completedAt: task.completedAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await repository.saveTask(updated);
            setSnapshot((current) =>
              current
                ? {
                    ...current,
                    tasks: current.tasks.map((candidate) =>
                      candidate.id === updated.id ? updated : candidate,
                    ),
                  }
                : current,
            );
            return { id: updated.id, title: updated.title, completed: true };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, [snapshot]);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    const ready = () => {
      rememberOfflineReadiness();
      setOfflineReady(true);
    };
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    const updateReady = (event: Event) => {
      updateReadyRef.current = true;
      setUpdate(() => (event as CustomEvent<() => Promise<void>>).detail);
      setUpdateStatus("ready");
      setUpdateStatusMessage("A new version is ready. Select Update app to install it.");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("openwall:offline-ready", ready);
    window.addEventListener("openwall:update-ready", updateReady);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    void window.navigator.serviceWorker?.ready.then(ready).catch(() => undefined);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("openwall:offline-ready", ready);
      window.removeEventListener("openwall:update-ready", updateReady);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const saveSnapshot = async (data: HouseholdSnapshot) => {
    await repository.replace(data);
    setSnapshot(data);
    setSetup(false);
    setView("today");
    if (setup && !hasParentPin()) {
      setNotice({ tone: "success", message: "Your board is ready. Create a parent PIN anytime from Settings." });
    }
  };
  const memberMap = useMemo(
    () => new Map(snapshot?.members.map((member) => [member.id, member])),
    [snapshot],
  );
  void memberMap;

  if (loading)
    return (
      <main className="loading-screen">
        <span className="brand-mark">
          <Home />
        </span>
        <p>Opening your wall…</p>
      </main>
    );
  if (!snapshot && !setup)
    return (
      <Welcome
        onSample={() => saveSnapshot(createSampleHousehold())}
        onTestSample={() => saveSnapshot(createEightPersonTestHousehold())}
        onSetup={() => setSetup(true)}
        online={online}
        offlineReady={offlineReady}
      />
    );
  if (!snapshot && setup)
    return <Setup onCancel={() => setSetup(false)} onComplete={saveSnapshot} />;
  if (!snapshot) return null;

  const systemAttentionItems: AttentionItem[] = storageWarning
    ? [{
        id: "system-storage-warning",
        householdId: snapshot.household.id,
        sourceType: "system",
        sourceId: "storage",
        memberIds: [],
        title: "Storage is getting full",
        summary: "Export a backup before adding more photos or household data.",
        reason: "storage-warning",
        priority: 90,
      }]
    : [];
  const attentionItems = deriveAttentionItems(snapshot, new Date(), systemAttentionItems);
  const scopedAttentionItems = filterId
    ? attentionItems.filter((item) => item.memberIds.length === 0 || item.memberIds.includes(filterId))
    : attentionItems;
  const visibleAttentionItemsForBoard = visibleAttentionItems(scopedAttentionItems, snapshot.attentionStates);

  const saveAttentionState = async (item: AttentionItem, patch: Pick<AttentionState, "acknowledgedAt" | "snoozedUntil">) => {
    const existing = attentionStateFor(item, snapshot.attentionStates ?? []);
    const state: AttentionState = {
      id: existing?.id ?? id(),
      householdId: snapshot.household.id,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      ...(item.occurrenceKey ? { occurrenceKey: item.occurrenceKey } : {}),
      ...(existing?.acknowledgedAt ? { acknowledgedAt: existing.acknowledgedAt } : {}),
      ...(existing?.snoozedUntil ? { snoozedUntil: existing.snoozedUntil } : {}),
      ...(patch.acknowledgedAt ? { acknowledgedAt: patch.acknowledgedAt } : {}),
      ...(patch.snoozedUntil ? { snoozedUntil: patch.snoozedUntil } : {}),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveAttentionState(state);
    setSnapshot((current) => current ? { ...current, attentionStates: [...(current.attentionStates ?? []).filter((value) => value.id !== state.id), state] } : current);
  };

  const saveEvent = async (item: ScheduleItem) => {
    await repository.saveScheduleItem(item);
    const historyEntry: HistoryEntry = {
      id: id(), householdId: item.householdId, entityId: item.id, entityType: "schedule",
      action: "edited", occurredAt: item.updatedAt,
      memberIds: item.memberIds, summary: `Saved ${item.title}`,
    };
    await repository.saveHistory(historyEntry);
    setSnapshot((current) =>
      current
        ? {
            ...current,
            scheduleItems: [
            ...current.scheduleItems.filter((value) => value.id !== item.id),
            item,
          ].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
            history: [...(current.history ?? []), historyEntry],
          }
        : current,
    );
    setEditor(null);
    setNotice({ tone: "success", message: `${item.title} was saved to the schedule.` });
  };
  const saveTask = async (item: HouseholdTask) => {
    await repository.saveTask(item);
    setSnapshot((current) =>
      current
        ? { ...current, tasks: [...current.tasks.filter((value) => value.id !== item.id), item] }
        : current,
    );
    setEditor(null);
    setNotice({ tone: "success", message: `${item.title} was saved.` });
  };
  const deleteEvent = (eventId: string) => {
    const item = snapshot.scheduleItems.find((value) => value.id === eventId);
    setConfirm({
      title: "Delete this schedule item?",
      body: `“${item?.title}” will be removed from this device.`,
      action: "Delete item",
      run: async () => {
        await repository.deleteScheduleItem(eventId);
        if (item) {
          const historyEntry: HistoryEntry = { id: id(), householdId: item.householdId, entityId: item.id, entityType: "schedule", action: "deleted", occurredAt: new Date().toISOString(), memberIds: item.memberIds, summary: `Deleted ${item.title}` };
          await repository.saveHistory(historyEntry);
          setSnapshot((current) => current ? { ...current, history: [...(current.history ?? []), historyEntry] } : current);
        }
        setSnapshot((current) =>
          current
            ? {
                ...current,
                scheduleItems: current.scheduleItems.filter((value) => value.id !== eventId),
              }
            : current,
        );
        setConfirm(null);
        setEditor(null);
      },
    });
  };
  const deleteTask = (taskId: string) => {
    const item = snapshot.tasks.find((value) => value.id === taskId);
    setConfirm({
      title: "Delete this task?",
      body: `“${item?.title}” will be removed from this device.`,
      action: "Delete task",
      run: async () => {
        await repository.deleteTask(taskId);
        if (item) {
          const historyEntry: HistoryEntry = { id: id(), householdId: item.householdId, entityId: item.id, entityType: "task", action: "deleted", occurredAt: new Date().toISOString(), memberIds: item.assigneeIds, summary: `Deleted ${item.title}` };
          await repository.saveHistory(historyEntry);
          setSnapshot((current) => current ? { ...current, history: [...(current.history ?? []), historyEntry] } : current);
        }
        setSnapshot((current) =>
          current
            ? { ...current, tasks: current.tasks.filter((value) => value.id !== taskId) }
            : current,
        );
        setConfirm(null);
        setEditor(null);
      },
    });
  };
  const toggleTask = async (task: HouseholdTask) => {
    const completing = !task.completedAt;
    const occurredAt = new Date().toISOString();
    await saveTask({
      ...task,
      completedAt: completing ? occurredAt : undefined,
      updatedAt: occurredAt,
    });
    if (task.routineId && task.occurrenceDate) {
      const occurrence: RoutineOccurrence = {
        id: `occurrence-${task.routineId}-${task.occurrenceDate}`,
        householdId: task.householdId,
        routineId: task.routineId,
        occurrenceDate: task.occurrenceDate,
        status: completing ? "completed" : "pending",
        assigneeIds: task.assigneeIds,
        completedAt: completing ? occurredAt : undefined,
        updatedAt: occurredAt,
      };
      await repository.saveRoutineOccurrence(occurrence);
      setSnapshot((current) => current ? { ...current, routineOccurrences: [...(current.routineOccurrences ?? []).filter((value) => value.id !== occurrence.id), occurrence] } : current);
    }
    if (completing) {
      for (const memberId of task.assigneeIds) {
        const member = snapshot.members.find((candidate) => candidate.id === memberId);
        if (!member || hasAwardForTask(task.id, memberId, snapshot.rewards ?? [])) continue;
        const pending = requiresRewardApproval(member);
        const award: RewardLedgerEntry = { id: id(), householdId: task.householdId, memberId, points: taskStarValue(task), reason: `Completed ${task.title}`, sourceTaskId: task.id, sourceType: "task", sourceId: task.id, status: pending ? "pending" : "approved", ...(pending ? {} : { approvedAt: occurredAt }), createdAt: occurredAt };
        await repository.saveReward(award);
        const activity: ActivityEntry = { id: id(), householdId: task.householdId, type: pending ? "completion" : "award", entityId: task.id, memberIds: [memberId], summary: pending ? `${member.name} completed ${task.title} — awaiting approval` : `${member.name} completed ${task.title} and earned ${taskStarValue(task)} Stars`, createdAt: occurredAt };
        await repository.saveActivity(activity);
        setSnapshot((current) => current ? { ...current, rewards: [...(current.rewards ?? []), award], activities: [...(current.activities ?? []), activity] } : current);
      }
    }
    const entry: HistoryEntry = {
      id: id(),
      householdId: task.householdId,
      entityId: task.id,
      entityType: "task",
      action: completing ? "completed" : "edited",
      occurredAt,
      memberIds: task.assigneeIds,
      summary: `${completing ? "Completed" : "Reopened"} ${task.title}`,
    };
    await repository.saveHistory(entry);
    setSnapshot((current) => (current ? { ...current, history: [...(current.history ?? []), entry] } : current));
  };
  const saveRewardEntry = async (entry: RewardLedgerEntry) => {
    await repository.saveReward(entry);
    const member = snapshot.members.find((candidate) => candidate.id === entry.memberId);
    const activity: ActivityEntry = { id: id(), householdId: entry.householdId, type: "award", entityId: entry.id, memberIds: [entry.memberId], summary: `${entry.points > 0 ? "Awarded" : "Corrected"} ${Math.abs(entry.points)} Stars for ${member?.name ?? "member"}: ${entry.reason}`, createdAt: entry.createdAt };
    await repository.saveActivity(activity);
    const historyEntry: HistoryEntry = { id: id(), householdId: entry.householdId, entityId: entry.id, entityType: "reward", action: entry.status === "reversed" ? "reversed" : "awarded", occurredAt: entry.createdAt, memberIds: [entry.memberId], summary: activity.summary };
    await repository.saveHistory(historyEntry);
    setSnapshot((current) => current ? { ...current, rewards: [...(current.rewards ?? []).filter((value) => value.id !== entry.id), entry], activities: [...(current.activities ?? []), activity], history: [...(current.history ?? []), historyEntry] } : current);
  };
  const saveRewardDefinition = async (definition: RewardDefinition) => {
    await repository.saveRewardDefinition(definition);
    setSnapshot((current) => current ? { ...current, rewardDefinitions: [...(current.rewardDefinitions ?? []).filter((value) => value.id !== definition.id), definition] } : current);
  };
  const saveRewardGoal = async (goal: RewardGoal) => {
    await repository.saveRewardGoal(goal);
    setSnapshot((current) => current ? { ...current, rewardGoals: [...(current.rewardGoals ?? []).filter((value) => value.id !== goal.id), goal] } : current);
  };
  const saveRedemption = async (redemption: RewardRedemption): Promise<boolean> => {
    if (redemption.status === "approved") {
      const balance = rewardBalance(redemption.memberId, snapshot.tasks, snapshot.rewards ?? []);
      if (balance < redemption.cost) {
        setNotice({ tone: "warning", message: "That reward costs more Stars than this member currently has." });
        return false;
      }
    }
    await repository.saveRewardRedemption(redemption);
    const member = snapshot.members.find((candidate) => candidate.id === redemption.memberId);
    const activity: ActivityEntry = { id: id(), householdId: redemption.householdId, type: "redemption", entityId: redemption.id, memberIds: [redemption.memberId], summary: redemption.status === "requested" ? `${member?.name ?? "Member"} requested a reward` : `Reward request ${redemption.status}`, createdAt: redemption.decidedAt ?? redemption.requestedAt };
    await repository.saveActivity(activity);
    const historyEntry: HistoryEntry = { id: id(), householdId: redemption.householdId, entityId: redemption.id, entityType: "reward", action: redemption.status === "denied" ? "denied" : redemption.status === "approved" || redemption.status === "fulfilled" ? "approved" : "edited", occurredAt: redemption.decidedAt ?? redemption.requestedAt, memberIds: [redemption.memberId], summary: activity.summary };
    await repository.saveHistory(historyEntry);
    setSnapshot((current) => current ? { ...current, rewardRedemptions: [...(current.rewardRedemptions ?? []).filter((value) => value.id !== redemption.id), redemption], activities: [...(current.activities ?? []), activity], history: [...(current.history ?? []), historyEntry] } : current);
    if (redemption.status === "requested") setNotice({ tone: "success", message: "Reward request saved for parent review." });
    return true;
  };
  const saveActivity = async (activity: ActivityEntry) => {
    await repository.saveActivity(activity);
    setSnapshot((current) => current ? { ...current, activities: [...(current.activities ?? []), activity] } : current);
  };
  const saveList = async (list: HouseholdList) => {
    await repository.saveList(list);
    setSnapshot((current) => current ? { ...current, lists: [...(current.lists ?? []).filter((value) => value.id !== list.id), list] } : current);
  };
  const saveListItem = async (item: HouseholdListItem) => {
    await repository.saveListItem(item);
    setSnapshot((current) => current ? { ...current, listItems: [...(current.listItems ?? []).filter((value) => value.id !== item.id), item] } : current);
  };
  const saveMealPlan = async (mealPlan: MealPlan) => {
    await repository.saveMealPlan(mealPlan);
    setSnapshot((current) => current ? { ...current, mealPlans: [...(current.mealPlans ?? []).filter((value) => value.id !== mealPlan.id), mealPlan].sort((a, b) => `${a.date}-${a.servingTime ?? ""}`.localeCompare(`${b.date}-${b.servingTime ?? ""}`)) } : current);
  };
  const deleteMealPlan = async (mealPlan: MealPlan) => {
    await repository.deleteMealPlan(mealPlan.id);
    // Grocery items are independent household records once promoted; deleting
    // the meal must not make the shopping list appear to lose those items.
    setSnapshot((current) => current ? { ...current, mealPlans: (current.mealPlans ?? []).filter((value) => value.id !== mealPlan.id) } : current);
  };
  const addMealIngredients = async (mealPlan: MealPlan) => {
    if (!mealPlan.ingredientTitles.length) return;
    const now = new Date().toISOString();
    const groceryList = snapshot.lists?.find((list) => list.kind === "grocery") ?? {
      id: id(), householdId: snapshot.household.id, title: "Groceries", kind: "grocery" as const, memberIds: [], createdAt: now, updatedAt: now,
    };
    const existingItems = (snapshot.listItems ?? []).filter((item) => item.listId === groceryList.id);
    const existingTitles = new Set(existingItems.map((item) => item.title.trim().toLowerCase()));
    const additions = mealPlan.ingredientTitles
      .map((title) => title.trim())
      .filter((title) => {
        const normalized = title.toLowerCase();
        if (!title || existingTitles.has(normalized)) return false;
        existingTitles.add(normalized);
        return true;
      })
      .map((title, index): HouseholdListItem => ({ id: id(), listId: groceryList.id, householdId: snapshot.household.id, title, sourceMealId: mealPlan.id, sortOrder: existingItems.length + index, createdAt: now, updatedAt: now }));
    if (!snapshot.lists?.some((list) => list.id === groceryList.id)) await repository.saveList(groceryList);
    await Promise.all(additions.map((item) => repository.saveListItem(item)));
    setSnapshot((current) => current ? { ...current, lists: [...(current.lists ?? []).filter((list) => list.id !== groceryList.id), groceryList], listItems: [...(current.listItems ?? []), ...additions] } : current);
  };
  const deleteListItem = async (item: HouseholdListItem) => {
    await repository.deleteListItem(item.id);
    setSnapshot((current) => current ? { ...current, listItems: (current.listItems ?? []).filter((value) => value.id !== item.id) } : current);
  };
  const deleteList = (list: HouseholdList) => setConfirm({
    title: `Remove ${list.title}?`,
    body: "The list and its items will be removed from this device. Export a backup first if you want to keep them.",
    action: "Remove list",
    run: async () => {
      await repository.deleteList(list.id);
      setSnapshot((current) => current ? { ...current, lists: (current.lists ?? []).filter((value) => value.id !== list.id), listItems: (current.listItems ?? []).filter((value) => value.listId !== list.id) } : current);
      setConfirm(null);
    },
  });
  const importFile = async (file: File) => {
    try {
      const parsed = parseBackup(await file.text());
      setConfirm({
        title: "Replace this household?",
        body: `This will replace “${snapshot.household.name}” with “${parsed.household.name}”. Export a backup first if you want to keep both.`,
        action: "Restore backup",
        run: async () => {
          await saveSnapshot(parsed);
          setConfirm(null);
          setNotice({ tone: "success", message: "Backup restored successfully." });
        },
      });
    } catch {
      setNotice({
        tone: "error",
        message: "That file is not a valid OpenWall backup. Nothing was changed.",
      });
    }
  };
  const resetSample = () =>
    setConfirm({
      title: "Load fresh sample data?",
      body: "This replaces the current household. Export a backup first if you want to keep it.",
      action: "Load sample",
      run: async () => {
        await saveSnapshot(createSampleHousehold());
        setConfirm(null);
        setNotice({ tone: "success", message: "Fresh sample household loaded." });
      },
    });
  const resetEightPersonSample = () =>
    setConfirm({
      title: "Load the 8-person test bench?",
      body: "This replaces the current household with rich fictional data for layout and filtering tests. Export a backup first if you want to keep it.",
      action: "Load test bench",
      run: async () => {
        await saveSnapshot(createEightPersonTestHousehold());
        setConfirm(null);
        setNotice({ tone: "success", message: "8-person fictional test household loaded." });
      },
    });
  const erase = () =>
    setConfirm({
      title: "Erase this household?",
      body: "All people, schedule items, and tasks stored by OpenWall in this browser will be removed. This cannot be undone without a backup.",
      action: "Erase everything",
      run: async () => {
        await repository.clear();
        setSnapshot(null);
        setConfirm(null);
        setView("today");
      },
    });

  const isAnyDialogOpen = tourOpen || Boolean(editor) || Boolean(confirm);

  const showOfflineTip =
    offlineReady &&
    online &&
    !isAnyDialogOpen &&
    !isTipDismissed(guideState, TIP_IDS.OFFLINE_READY);

  const suppressSubTips = isAnyDialogOpen || showOfflineTip;

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onView={(nextView) => {
          if (nextView !== "guide") {
            setGuideInitialTab("articles");
          }
          setView(nextView);
        }}
        compact={sidebarCompact}
        onToggle={() => setSidebarCompact((value) => !value)}
        attentionCount={visibleAttentionItems(attentionItems, snapshot.attentionStates).length}
      />
      <main className="main-surface">
        {!online && (
          <div className="connection-banner">
            <WifiOff /> Offline — your saved household is still available.
          </div>
        )}
        {offlineReady && online && !showOfflineTip && (
          <button className="toast success" onClick={() => setOfflineReady(false)}>
            <CheckCircle2 /> Ready to use offline <X />
          </button>
        )}
        {showOfflineTip && (
          <CoachMark
            tipId={TIP_IDS.OFFLINE_READY}
            kicker="Offline ready"
            message="The OpenWall app shell is cached. Saved local features can reopen without an internet connection, subject to this browser’s storage behavior."
            onDismiss={(tipId) => {
              handleDismissTip(tipId);
              setOfflineReady(false);
            }}
          />
        )}
        {update && (
          <button className="toast update" onClick={handlePwaUpdate} disabled={updateInProgress}>
            <Download /> {updateInProgress ? "Updating OpenWall…" : "A new version is ready — Update now"}
          </button>
        )}
        {view === "today" ? (
          <TodayBoard
            key={snapshot.household.id}
            snapshot={snapshot}
            filterId={filterId}
            attentionItems={visibleAttentionItemsForBoard}
            onFilter={setFilterId}
            onView={setView}
            onManagePeople={() => setView("people")}
            onEdit={setEditor}
            onComplete={toggleTask}
            guideState={guideState}
            onStartTour={handleStartTour}
            onDismissGuideCard={handleDismissGuideCard}
            onDismissTip={handleDismissTip}
            postUpdateIntent={postUpdateIntent}
            onSeeWhatsNew={handleSeeWhatsNew}
            onDismissWhatsNew={handleDismissWhatsNew}
            onAcknowledgeAttention={(item) => void saveAttentionState(item, { acknowledgedAt: new Date().toISOString() })}
            onSnoozeAttention={(item) => void saveAttentionState(item, { snoozedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString() })}
            onBoardLayoutChange={handleBoardLayoutChange}
            displayMode={displayMode}
            suppressTips={suppressSubTips}
          />
        ) : view === "guide" ? (
          <GuideView
            guideState={guideState}
            onUpdateGuideState={setGuideState}
            onNavigate={setView}
            onStartTour={handleStartTour}
            initialTab={guideInitialTab}
          />
        ) : view === "settings" ? (
          <SettingsView
            snapshot={snapshot}
            onImport={importFile}
            onSampleReset={resetSample}
            onTestSampleReset={resetEightPersonSample}
            onHouseholdReset={erase}
            notice={notice}
            onStartTour={handleStartTour}
            guideState={guideState}
            onDismissTip={handleDismissTip}
            suppressTips={suppressSubTips}
            appearance={appearance}
            onAppearanceChange={handleAppearanceChange}
            onAppearanceReset={handleAppearanceReset}
            displaySchedule={displaySchedule}
            onDisplayScheduleChange={setDisplaySchedule}
            online={online}
            offlineReady={offlineReady}
            installPrompt={installPrompt}
            installed={installed}
            onInstall={handleInstall}
            onSync={handleSync}
            updateStatus={updateStatus}
            updateStatusMessage={updateStatusMessage}
            onUpdateApp={handleCheckForUpdates}
            parentUnlocked={parentUnlocked}
            onRequestParentUnlock={requestParentUnlock}
          />
        ) : (
          <DashboardView
            view={view}
            snapshot={snapshot}
            filterId={filterId}
            attentionItems={visibleAttentionItems(attentionItems, snapshot.attentionStates)}
            onFilter={setFilterId}
            onView={setView}
            onEdit={setEditor}
            onComplete={toggleTask}
            onSaveRoutine={async (routine) => {
              await repository.saveRoutine(routine);
              const now = new Date().toISOString();
              const occurrenceDate = todayInput();
              const occursToday = routineOccursOnDate(routine, occurrenceDate);
              const generated = occursToday ? makeRoutineOccurrence(routine, occurrenceDate, new Date(now)) : undefined;
              const occurrence: HouseholdTask | undefined = generated?.task;
              const routineOccurrence: RoutineOccurrence | undefined = generated?.occurrence;
              if (occurrence) await repository.saveTask(occurrence);
              if (routineOccurrence) await repository.saveRoutineOccurrence(routineOccurrence);
              setSnapshot((current) => (current ? { ...current, routines: [...(current.routines ?? []), routine], ...(occurrence ? { tasks: [...current.tasks, occurrence] } : {}), ...(routineOccurrence ? { routineOccurrences: [...(current.routineOccurrences ?? []), routineOccurrence] } : {}) } : current));
              setNotice({ tone: "success", message: occursToday ? `${routine.title} repeats today and was added.` : `${routine.title} was saved for its next scheduled day.` });
            }}
            onSaveList={saveList}
            onSaveListItem={saveListItem}
            onSaveMealPlan={saveMealPlan}
            onDeleteMealPlan={deleteMealPlan}
            onAddMealIngredients={addMealIngredients}
            onDeleteList={deleteList}
            onDeleteListItem={deleteListItem}
            onSaveMember={async (member) => {
              await repository.saveMember(member);
              setSnapshot((current) => current ? { ...current, members: current.members.some((value) => value.id === member.id) ? current.members.map((value) => value.id === member.id ? member : value) : [...current.members, member] } : current);
            }}
            onDeleteMember={(member) => setConfirm({
              title: `Remove ${member.name}?`,
              body: "Their assignments will remain visible but no longer be assigned to them.",
              action: "Remove member",
              run: async () => {
                await repository.deleteMember(member.id);
                setSnapshot((current) => current ? { ...current, members: current.members.filter((value) => value.id !== member.id), scheduleItems: current.scheduleItems.map((item) => ({ ...item, memberIds: item.memberIds.filter((value) => value !== member.id) })), tasks: current.tasks.map((task) => ({ ...task, assigneeIds: task.assigneeIds.filter((value) => value !== member.id) })), routines: (current.routines ?? []).map((routine) => ({ ...routine, assigneeIds: routine.assigneeIds.filter((value) => value !== member.id) })) } : current);
                setConfirm(null);
              },
            })}
            onUpdateRoutine={async (routine) => {
              await repository.saveRoutine(routine);
              const now = new Date().toISOString();
              const occurrenceDate = todayInput();
              const wasSkippedToday = routine.skippedDates?.includes(occurrenceDate);
              const skippedTask = snapshot.tasks.find((task) => task.id === `occurrence-${routine.id}-${occurrenceDate}`);
              const removePendingTask = Boolean(wasSkippedToday && skippedTask && !skippedTask.completedAt);
              const skippedOccurrence: RoutineOccurrence | undefined = wasSkippedToday ? { id: `occurrence-${routine.id}-${occurrenceDate}`, householdId: routine.householdId, routineId: routine.id, occurrenceDate, status: "skipped", assigneeIds: routine.assigneeIds, updatedAt: now } : undefined;
              if (removePendingTask && skippedTask) await repository.deleteTask(skippedTask.id);
              if (skippedOccurrence) await repository.saveRoutineOccurrence(skippedOccurrence);
              const historyEntry: HistoryEntry | undefined = wasSkippedToday ? { id: id(), householdId: routine.householdId, entityId: routine.id, entityType: "routine", action: "skipped", occurredAt: now, memberIds: routine.assigneeIds, summary: `Skipped ${routine.title} for today` } : undefined;
              if (historyEntry) await repository.saveHistory(historyEntry);
              setSnapshot((current) => current ? { ...current, routines: (current.routines ?? []).map((value) => value.id === routine.id ? routine : value), ...(removePendingTask ? { tasks: current.tasks.filter((task) => task.id !== skippedTask?.id) } : {}), ...(historyEntry ? { history: [...(current.history ?? []), historyEntry] } : {}), ...(skippedOccurrence ? { routineOccurrences: [...(current.routineOccurrences ?? []).filter((value) => value.id !== skippedOccurrence.id), skippedOccurrence] } : {}) } : current);
            }}
            onSaveReward={saveRewardEntry}
            onSaveRewardDefinition={saveRewardDefinition}
            onSaveRewardGoal={saveRewardGoal}
            onSaveRedemption={saveRedemption}
            onSaveActivity={saveActivity}
            parentUnlocked={parentUnlocked}
            onRequestParentUnlock={requestParentUnlock}
            onSavePhoto={async (photo) => {
              await repository.savePhoto(photo);
              setSnapshot((current) => current ? { ...current, photos: [...(current.photos ?? []).filter((value) => value.id !== photo.id), photo].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) } : current);
            }}
            onDeletePhoto={async (photo) => {
              await repository.deletePhoto(photo.id);
              setSnapshot((current) => current ? { ...current, photos: (current.photos ?? []).filter((value) => value.id !== photo.id) } : current);
            }}
            onAcknowledgeAttention={(item) => void saveAttentionState(item, { acknowledgedAt: new Date().toISOString() })}
            onSnoozeAttention={(item) => void saveAttentionState(item, { snoozedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString() })}
          />
        )}
      </main>
      {editor?.kind === "event" && (
        <EventEditor
          target={editor}
          members={snapshot.members}
          householdId={snapshot.household.id}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => setEditor(null)}
        />
      )}
      {editor?.kind === "task" && (
        <TaskEditor
          target={editor}
          members={snapshot.members}
          householdId={snapshot.household.id}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={() => setEditor(null)}
        />
      )}
      {confirm && (
        <Dialog title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="confirm-copy">{confirm.body}</p>
          <div className="dialog-actions">
            <span />
            <button className="secondary-button" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button className="danger-button solid" onClick={confirm.run}>
              {confirm.action}
            </button>
          </div>
        </Dialog>
      )}
      {pinPrompt && (
        <Dialog title={pinSetupMode ? "Create parent PIN" : "Unlock parent mode"} onClose={() => { setPinPrompt(false); setPinValue(""); setPinConfirmation(""); }}>
          <p className="confirm-copy">{pinSetupMode ? "Use a 4–6 digit PIN for reward rules, approvals, and protected household changes. It stays only on this device." : "Enter the local parent PIN to unlock protected actions for 15 minutes."}</p>
          <label>{pinSetupMode ? "Choose a parent PIN" : "Parent PIN"}<input autoFocus inputMode="numeric" type="password" maxLength={6} value={pinValue} onChange={(event) => setPinValue(event.target.value.replace(/\D/g, ""))} /></label>
          {pinSetupMode && <label>Confirm parent PIN<input inputMode="numeric" type="password" maxLength={6} value={pinConfirmation} onChange={(event) => setPinConfirmation(event.target.value.replace(/\D/g, ""))} /></label>}
          <div className="dialog-actions"><span /><button className="secondary-button" onClick={() => { setPinPrompt(false); setPinValue(""); setPinConfirmation(""); }}>Cancel</button><button className="primary-button" onClick={handlePinSubmit}>{pinSetupMode ? "Save PIN" : "Unlock"}</button></div>
        </Dialog>
      )}
      {tourOpen && (
        <GuideTour
          open={tourOpen}
          initialStep={tourStep}
          triggerElement={tourTrigger}
          onClose={handleCloseTour}
          onComplete={handleCompleteTour}
          onDismiss={handleDismissTour}
        />
      )}
    </div>
  );
}
