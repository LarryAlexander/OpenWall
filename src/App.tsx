import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
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
  ListChecks,
  Lock,
  Menu,
  Minus,
  Monitor,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
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
import { InstallEducation } from "./InstallEducation";
import {
  isRunningStandalone,
  loadOfflineReadiness,
  rememberOfflineReadiness,
  type BeforeInstallPromptEvent,
} from "./install";
import { WhatsNewNotice } from "./WhatsNewNotice";
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
  ScheduleItem,
} from "./types";
import { currentStreak, levelForStars, rewardBalance, taskStarValue, requiresRewardApproval, hasAwardForTask } from "./rewards";
import { hasParentPin, isParentUnlocked, setParentPin, unlockParentMode } from "./pin";

type View =
  | "today"
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
}: {
  view: View;
  onView: (view: View) => void;
  compact: boolean;
  onToggle: () => void;
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
    .filter((item) => item.memberIds.includes(selectedId ?? ""))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);
  const tasks = snapshot.tasks
    .filter((task) => task.assigneeIds.includes(selectedId ?? ""))
    .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)))
    .slice(0, 5);
  const stars = member ? rewardBalance(member.id, snapshot.tasks, snapshot.rewards ?? []) : 0;
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
      </div>
      <p className="mobile-personal-hint">Your private Stars, tasks, and schedule stay on this device. Open the Board tab for the full corkboard.</p>
    </section>
  );
}

function TodayBoard({
  snapshot,
  filterId,
  onFilter,
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
  suppressTips = false,
}: {
  snapshot: HouseholdSnapshot;
  filterId: string | null;
  onFilter: (id: string | null) => void;
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
  suppressTips?: boolean;
}) {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const boardRef = useRef<HTMLDivElement>(null);
  const storageKey = `openwall-board-${snapshot.household.id}`;
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [removingWidgetId, setRemovingWidgetId] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [cardJustAdded, setCardJustAdded] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<BoardWidget | null>(null);
  const [widgets, setWidgets] = useState<BoardWidget[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return snapshot.boardWidgets?.length ? snapshot.boardWidgets : defaultBoardWidgets;
      const parsed = JSON.parse(stored) as BoardWidget[];
      return parsed.map((w) => {
        if (w.type === "countdown") {
          const cfg = getCountdownConfig(w, snapshot.household.timezone);
          return updateBoardWidgetWithCountdown(w, cfg);
        }
        return w;
      });
    } catch {
      return defaultBoardWidgets;
    }
  });

  const events = snapshot.scheduleItems.filter(
    (item) =>
      (item.calendarDate ?? format(parseISO(item.startsAt), "yyyy-MM-dd")) === todayInput() &&
      (!filterId || item.memberIds.includes(filterId)),
  );
  const tasks = snapshot.tasks
    .filter(
      (task) =>
        (!task.dueDate || task.dueDate === todayInput()) &&
        (!filterId || task.assigneeIds.includes(filterId)),
    )
    .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)));
  const next = events.find((item) => parseISO(item.endsAt) > today);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    } catch {
      // Keep the active board usable when browser storage is blocked or full.
    }
    void repository.saveBoardLayout({
      id: snapshot.household.id,
      householdId: snapshot.household.id,
      widgets,
      updatedAt: new Date().toISOString(),
    }).catch(() => {
      // The localStorage fallback keeps the board usable if IndexedDB is unavailable.
    });
  }, [storageKey, widgets, snapshot.household.id]);

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

  const updateWidget = (widgetId: string, patch: Partial<BoardWidget>) =>
    setWidgets((current) =>
      current.map((widget) => (widget.id === widgetId ? { ...widget, ...patch } : widget)),
    );

  const removeWidget = (widgetId: string) => {
    if (removingWidgetId) return;
    setRemovingWidgetId(widgetId);
    setActiveWidgetId(widgetId);
    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    window.setTimeout(
      () => {
        setWidgets((current) => current.filter((item) => item.id !== widgetId));
        setRemovingWidgetId(null);
        setActiveWidgetId(null);
      },
      reduceMotion ? 40 : 520,
    );
  };

  const resizeWidgetBy = (widget: BoardWidget, element: HTMLElement | null, delta: number) => {
    if (window.matchMedia("(max-width: 1279px)").matches) {
      const currentHeight = widget.stackedHeight ?? element?.offsetHeight ?? 220;
      updateWidget(widget.id, {
        stackedHeight: Math.max(150, Math.min(720, currentHeight + delta * 15)),
      });
      return;
    }
    const nextWidth = Math.max(12, Math.min(94, widget.w + delta));
    const nextHeight = Math.max(18, Math.min(94, widget.h + delta));
    updateWidget(widget.id, {
      x: Math.min(widget.x, 96 - nextWidth),
      y: Math.min(widget.y, 96 - nextHeight),
      w: nextWidth,
      h: nextHeight,
    });
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
    setWidgets((current) => {
      const next = [...current, added];
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* repository persistence remains available */ }
      return next;
    });
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
                    <time>{format(parseISO(item.startsAt), "h:mm")}</time>
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
        <div className="sticky-content">
          <StickyNote />
          <span>DON’T FORGET</span>
          <p>{widget.text}</p>
        </div>
      );
    if (widget.type === "meal")
      return (
        <div className="simple-widget meal-widget">
          <Utensils />
          <span>Tonight</span>
          <p>{widget.text}</p>
        </div>
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
    let storedPhoto: string | null = null;
    try {
      storedPhoto = localStorage.getItem(`openwall-photo-${snapshot.household.id}`);
    } catch {
      storedPhoto = null;
    }
    return (
      <div className="photo-widget">
        {storedPhoto ? <img src={storedPhoto} alt="Selected household photo" /> : <div className="photo-sky"><Sun /><span /><span /></div>}
        <p>{storedPhoto ? "A favorite moment" : "Add a favorite photo from Photos"}</p>
      </div>
    );
  };

  const suppressBoardTips = suppressTips || trayOpen || Boolean(editingCountdown);
  const showWhatsNew =
    guideState.tourStatus !== "unseen" &&
    (postUpdateIntent || !isReleaseSeen(guideState, LATEST_RELEASE.version));
  const suppressBoardGuidance =
    suppressBoardTips || guideState.tourStatus === "unseen" || showWhatsNew;

  return (
    <div className="corkboard-view">
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
            {member.name}
          </button>
        ))}
        <button className="board-people-add" onClick={onManagePeople} aria-label="Add household member" title="Add household member">
          <Plus /> <span>Add person</span>
        </button>
      </div>
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
                if (actionButton && !actionButton.classList.contains("widget-drag-handle")) return;
                beginMove(event, widget);
              }}
            >
              <button
                className="widget-drag-handle"
                disabled={widget.locked}
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

function DashboardView({
  view,
  snapshot,
  filterId,
  onFilter,
  onView,
  onEdit,
  onComplete,
  onSaveRoutine,
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
}: {
  view: Exclude<View, "today" | "settings" | "guide">;
  snapshot: HouseholdSnapshot;
  filterId: string | null;
  onFilter: (id: string | null) => void;
  onView: (view: View) => void;
  onEdit: (target: EditorTarget) => void;
  onComplete: (task: HouseholdTask) => void;
  onSaveRoutine: (routine: Routine) => void;
  onSaveMember: (member: HouseholdMember) => void;
  onDeleteMember: (member: HouseholdMember) => void;
  onUpdateRoutine: (routine: Routine) => void;
  onSaveReward: (entry: RewardLedgerEntry) => void;
  onSaveRewardDefinition: (definition: RewardDefinition) => void;
  onSaveRewardGoal: (goal: RewardGoal) => void;
  onSaveRedemption: (redemption: RewardRedemption) => void;
  onSaveActivity: (entry: ActivityEntry) => void;
  parentUnlocked: boolean;
  onRequestParentUnlock: () => void;
  onSavePhoto: (photo: PhotoAsset) => void;
  onDeletePhoto: (photo: PhotoAsset) => void;
}) {
  const [photoData, setPhotoData] = useState<string | null>(() => {
    const saved = snapshot.photos?.[0]?.dataUrl;
    if (saved) return saved;
    try {
      return localStorage.getItem(`openwall-photo-${snapshot.household.id}`);
    } catch {
      return null;
    }
  });
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const visibleEvents = snapshot.scheduleItems
    .filter((item) => !filterId || item.memberIds.includes(filterId))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const visibleTasks = snapshot.tasks.filter(
    (task) => !filterId || task.assigneeIds.includes(filterId),
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
  const [newMemberName, setNewMemberName] = useState("");
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardCost, setRewardCost] = useState("50");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("500");
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => todayInput());
  const calendarStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });

  if (view === "people") {
    return (
      <div className="settings-view">
        <header><p className="eyebrow">Household</p><h1>People</h1><p>Choose a person to see their part of the plan.</p></header>
        <div className="settings-grid">
          <section className="settings-card people-all-card"><button className={!filterId ? "primary-button" : "secondary-button"} onClick={() => onFilter(null)}><Users /> Everyone</button></section>
          <section className="settings-card add-person-card"><div><h2>Add someone</h2><p>Household members can have their own view and assignments.</p></div><input aria-label="New member name" placeholder="Name" value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} /><button className="primary-button" onClick={() => { if (!newMemberName.trim()) return; onSaveMember({ id: id(), householdId: snapshot.household.id, name: newMemberName.trim(), colorToken: "sky", symbol: newMemberName.trim().charAt(0).toUpperCase(), sortOrder: snapshot.members.length, role: "other" }); setNewMemberName(""); }}>Add member</button></section>
          {snapshot.members.map((member) => (
            <section className="settings-card people-card" key={member.id}>
              <div className={`settings-icon color-${member.colorToken}`}><Avatar member={member} /></div>
              <div><input aria-label={`Name for ${member.name}`} value={member.name} onChange={(event) => onSaveMember({ ...member, name: event.target.value, symbol: event.target.value.trim().charAt(0).toUpperCase() || member.symbol })} /><select aria-label={`Role for ${member.name}`} value={member.role ?? "other"} onChange={(event) => onSaveMember({ ...member, role: event.target.value as HouseholdMember["role"] })}><option value="parent">Parent</option><option value="child">Child</option><option value="teen">Teen</option><option value="grandparent">Grandparent</option><option value="other">Other</option></select><label className="inline-choice"><input type="checkbox" checked={member.rewardApprovalRequired ?? member.role === "child"} onChange={(event) => onSaveMember({ ...member, rewardApprovalRequired: event.target.checked })} /> Approve Stars</label></div>
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
    const leaderboard = snapshot.members.map((member) => ({ member, stars: rewardBalance(member.id, snapshot.tasks, ledger) })).sort((a, b) => b.stars - a.stars);
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
      <div className="settings-view">
        <header><p className="eyebrow">Celebrate progress</p><h1>Rewards</h1><p>Stars make progress visible without making the family compete for attention.</p></header>
        <section className="rewards-leaderboard settings-card"><div><p className="section-kicker">This week</p><h2>Personal progress</h2><p>Weekly rankings are optional; lifetime Stars and streaks stay with each person.</p></div><div className="leaderboard-list">{leaderboard.slice(0, 5).map(({ member, stars }, index) => <div className="leaderboard-row" key={member.id}><span>{index + 1}</span><Avatar member={member} small /><strong>{member.name}</strong><b>⭐ {stars}</b></div>)}</div></section>
        <div className="settings-grid rewards-profile-grid">{snapshot.members.map((member) => { const stars = rewardBalance(member.id, snapshot.tasks, ledger); const streak = currentStreak(member.id, snapshot.tasks); const pending = ledger.filter((entry) => entry.memberId === member.id && entry.status === "pending"); return <section className="settings-card reward-profile-card" key={member.id}><div className={`settings-icon color-${member.colorToken}`}><Avatar member={member} /></div><div><h2>{member.name}</h2><p>⭐ {stars} Stars · 🔥 {streak}-day streak · Level {levelForStars(stars)}</p><small>{snapshot.tasks.filter((task) => task.completedAt && task.assigneeIds.includes(member.id)).length} tasks completed</small>{pending.length > 0 && <p className="reward-pending">{pending.length} awaiting parent approval</p>}</div><div className="button-row"><button className="primary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveReward({ id: id(), householdId: snapshot.household.id, memberId: member.id, points: 1, reason: "Parent-awarded star", sourceType: "manual", status: "approved", createdAt: new Date().toISOString() }); }}>Add star</button><button className="secondary-button" onClick={() => { onFilter(member.id); onView("today"); }}>View plan</button></div></section>; })}</div>
        {ledger.some((entry) => entry.status === "pending") && <section className="settings-card reward-approvals"><div><p className="section-kicker">Parent review</p><h2>Approvals</h2><p>Child completions stay pending until a parent confirms the work.</p></div><div className="approval-list">{ledger.filter((entry) => entry.status === "pending").map((entry) => { const member = snapshot.members.find((candidate) => candidate.id === entry.memberId); return <div className="approval-row" key={entry.id}><span><strong>{member?.name ?? "Member"}</strong> completed a task for {entry.points} ⭐</span><div className="button-row"><button className="primary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveReward({ ...entry, status: "approved", approvedBy: "parent", approvedAt: new Date().toISOString() }); }}>Approve</button><button className="secondary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveReward({ ...entry, status: "denied", approvedBy: "parent", approvedAt: new Date().toISOString() }); }}>Needs more work</button></div></div>; })}</div></section>}
        <section className="settings-card rewards-shop"><div><p className="section-kicker">Rewards shop</p><h2>Give Stars somewhere to go</h2><p>Create rewards the household can request when they have enough Stars.</p></div><div className="reward-definition-list">{definitions.filter((reward) => reward.active).map((reward) => <div className="reward-definition-row" key={reward.id}><span className="reward-icon">{reward.icon}</span><div><strong>{reward.title}</strong><small>{reward.description ?? "A parent-defined household reward"}</small></div><b>{reward.cost} ⭐</b><button className="secondary-button" onClick={() => { const member = snapshot.members.find((candidate) => candidate.id === filterId) ?? snapshot.members[0]; if (!member) return; onSaveRedemption({ id: id(), householdId: snapshot.household.id, rewardId: reward.id, memberId: member.id, cost: reward.cost, status: "requested", requestedAt: new Date().toISOString() }); }}>Request</button></div>)}</div>{(snapshot.rewardRedemptions ?? []).filter((redemption) => redemption.status === "requested").map((redemption) => { const member = snapshot.members.find((candidate) => candidate.id === redemption.memberId); const reward = definitions.find((candidate) => candidate.id === redemption.rewardId); return <div className="redemption-row" key={redemption.id}><span>{member?.name ?? "Member"} requested {reward?.title ?? "a reward"}</span><button className="secondary-button" onClick={() => { if (!parentUnlocked) return onRequestParentUnlock(); onSaveRedemption({ ...redemption, status: "approved", decidedAt: new Date().toISOString(), decidedBy: "parent" }); onSaveReward({ id: id(), householdId: redemption.householdId, memberId: redemption.memberId, points: -redemption.cost, reason: `Redeemed ${reward?.title ?? "reward"}`, sourceType: "redemption", sourceId: redemption.id, status: "approved", createdAt: new Date().toISOString() }); }}>Approve</button></div>; })}<div className="reward-create-form"><input aria-label="Reward title" placeholder="Reward name" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} /><input aria-label="Reward cost" type="number" min="1" value={rewardCost} onChange={(event) => setRewardCost(event.target.value)} /> <button className="primary-button" onClick={saveDefinition}>{parentUnlocked ? "Add reward" : "Unlock to add"}</button></div></section>
        <section className="settings-card shared-goal-card"><div><p className="section-kicker">Shared goals</p><h2>Cooperative first</h2><p>The whole family can contribute toward something everyone wants.</p></div><div className="goal-list">{goals.filter((goal) => goal.active).map((goal) => { const progress = Math.min(goal.targetStars, ledger.filter((entry) => entry.points > 0).reduce((total, entry) => total + entry.points, 0)); return <div className="goal-row" key={goal.id}><div className="goal-row-heading"><strong>{goal.title}</strong><span>{progress} / {goal.targetStars} ⭐</span></div><div className="goal-progress"><span style={{ width: `${Math.round((progress / goal.targetStars) * 100)}%` }} /></div></div>; })}</div><div className="reward-create-form"><input aria-label="Shared goal title" placeholder="Family movie night" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} /><input aria-label="Shared goal target" type="number" min="1" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} /><button className="primary-button" onClick={saveGoal}>{parentUnlocked ? "Add goal" : "Unlock to add"}</button></div></section>
        <section className="settings-card activity-feed"><div><p className="section-kicker">Family activity</p><h2>Recent wins</h2><p>Encouragement stays visible without turning the board into surveillance.</p></div><div className="activity-list">{activities.length ? activities.map((activity) => <div className="activity-row" key={activity.id}><span>✨</span><span>{activity.summary}</span><small>{format(parseISO(activity.createdAt), "MMM d")}</small><div className="reaction-actions">{(["heart", "clap", "celebrate"] as const).map((reaction) => <button key={reaction} aria-label={`React with ${reaction}`} onClick={() => { const member = snapshot.members.find((candidate) => candidate.id === filterId) ?? snapshot.members[0]; if (member) onSaveActivity({ id: id(), householdId: snapshot.household.id, type: "reaction", entityId: activity.id, memberIds: [member.id], summary: `${member.name} reacted to a family win`, createdAt: new Date().toISOString() }); }}> {reaction === "heart" ? "❤️" : reaction === "clap" ? "👏" : "🎉"}</button>)}</div></div>) : <p>No wins yet—complete a task to start the feed.</p>}</div></section>
      </div>
    );
  }

  if (view === "photos") {
    return (
      <div className="settings-view">
        <header><p className="eyebrow">Local memories</p><h1>Photos</h1><p>Choose an image from this device. OpenWall does not upload it.</p></header>
        <section className="settings-card photo-manager">
          {photoData && !photoLoadFailed ? <img src={photoData} alt="Selected household photo" onError={() => setPhotoLoadFailed(true)} /> : <div className="photo-empty"><Image /><p>{photoLoadFailed ? "This saved photo could not be displayed. Choose it again to repair the card." : "No photo selected yet."}</p></div>}
          <label className="secondary-button">{photoData ? "Replace photo" : "Choose a photo"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const value = String(reader.result);
              const photo: PhotoAsset = { id: snapshot.photos?.[0]?.id ?? id(), householdId: snapshot.household.id, name: file.name, mimeType: file.type || "image/*", dataUrl: value, createdAt: snapshot.photos?.[0]?.createdAt ?? new Date().toISOString() };
              setPhotoLoadFailed(false);
              setPhotoData(value);
              onSavePhoto(photo);
            };
            reader.readAsDataURL(file);
          }} /></label>
          {photoData && <button className="danger-button" onClick={() => { const photo = snapshot.photos?.[0]; setPhotoLoadFailed(false); setPhotoData(null); if (photo) onDeletePhoto(photo); }}>Remove photo</button>}
        </section>
      </div>
    );
  }

  if (view === "history") {
    const entries = [...(snapshot.history ?? [])].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const memberEntries = filterId ? entries.filter((entry) => entry.memberIds.includes(filterId)) : entries;
    return <div className="settings-view"><header><p className="eyebrow">Household memory</p><h1>History</h1><p>Completed, edited, and restored work stays easy to review.</p></header><section className="settings-card history-card"><div className="filter-row"><label>Person<select aria-label="Filter history by person" value={filterId ?? ""} onChange={(event) => onFilter(event.target.value || null)}><option value="">Everyone</option>{snapshot.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div><div className="cork-task-list">{memberEntries.length ? memberEntries.map((entry) => <div className="history-row" key={entry.id}><CheckCircle2 /><span>{entry.summary}</span><small>{format(parseISO(entry.occurredAt), "MMM d, h:mm a")}</small></div>) : <p>No history for this person yet.</p>}</div></section></div>;
  }

  const heading = view === "lists" ? "Lists" : view === "calendar" ? "Calendar" : "Week";
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
  return (
    <div className="settings-view">
      <header><p className="eyebrow">{selectedMember ? `${selectedMember.name}'s plan` : "Household plan"}</p><h1>{heading}</h1><p>{view === "lists" ? "Shared tasks and lists for the household." : "Future plans are visible as soon as they are saved."}</p></header>
      <div className="settings-grid">
        <section className="settings-card"><div className="settings-icon"><CalendarDays /></div><div><h2>Schedule</h2><p>{events.length} item{events.length === 1 ? "" : "s"} visible</p></div><button className="secondary-button" onClick={() => onEdit({ kind: "event" })}><Plus /> Add event</button></section>
        {view === "lists" && <section className="settings-card routine-builder-card"><div className="settings-icon"><RotateCcw /></div><div><h2>Repeat a routine</h2><p>Create a chore once and keep it on the family’s rhythm.</p></div><input aria-label="Routine title" placeholder="Morning checklist" value={routineTitle} onChange={(event) => setRoutineTitle(event.target.value)} /><select aria-label="Routine frequency" value={routineFrequency} onChange={(event) => setRoutineFrequency(event.target.value as Routine["frequency"])}><option value="daily">Every day</option><option value="weekly">Every week</option><option value="school-days">School days</option></select>{routineFrequency === "weekly" && <select aria-label="Routine weekday" value={routineWeekday} onChange={(event) => setRoutineWeekday(Number(event.target.value))}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select>}<select aria-label="Routine assignee" value={routineMemberId} onChange={(event) => setRoutineMemberId(event.target.value)}>{snapshot.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><button className="primary-button" onClick={() => { if (!routineTitle.trim()) return; const now = new Date().toISOString(); onSaveRoutine({ id: id(), householdId: snapshot.household.id, title: routineTitle.trim(), assigneeIds: [routineMemberId], frequency: routineFrequency, ...(routineFrequency === "weekly" ? { weekdays: [routineWeekday] } : {}), createdAt: now, updatedAt: now }); setRoutineTitle(""); }}>Add routine</button></section>}
        {view !== "lists" && events.map((item) => <section className="settings-card" key={item.id}><div className="settings-icon"><CalendarDays /></div><div><h2>{item.title}</h2><p>{item.allDay || item.kind === "school-closure" ? "All day" : format(parseISO(item.startsAt), "EEE, MMM d · h:mm a")}{countdownLabel(item) ? ` · ${countdownLabel(item)}` : ""}</p></div><button className="secondary-button" onClick={() => onEdit({ kind: "event", value: item })}>Edit</button></section>)}
        {view === "lists" && visibleTasks.map((task) => <section className="settings-card" key={task.id}><div className="settings-icon"><ListChecks /></div><div><h2>{task.title}</h2><p>{task.completedAt ? "Complete" : task.dueDate ? `Due ${task.dueDate}` : "No due date"}</p></div><button className={task.completedAt ? "secondary-button" : "primary-button"} onClick={() => onComplete(task)}>{task.completedAt ? "Completed" : "Complete"}</button></section>)}
        {view === "lists" && (snapshot.routines ?? []).map((routine) => <section className="settings-card" key={routine.id}><div className="settings-icon"><RotateCcw /></div><div><h2>{routine.title}</h2><p>Repeats {routine.frequency}; assigned to {routine.assigneeIds.map((memberId) => getMember(memberId, snapshot.members)?.name).filter(Boolean).join(", ")}</p></div><button className="secondary-button" onClick={() => onUpdateRoutine({ ...routine, skippedDates: [...(routine.skippedDates ?? []), todayInput()], updatedAt: new Date().toISOString() })}>Skip today</button></section>)}
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
  online,
  offlineReady,
  installPrompt,
  installed,
  onInstall,
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
  online: boolean;
  offlineReady: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  onInstall: () => Promise<void>;
  parentUnlocked: boolean;
  onRequestParentUnlock: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportData = () => {
    let boardWidgets: HouseholdSnapshot["boardWidgets"];
    try {
      const raw = localStorage.getItem(`openwall-board-${snapshot.household.id}`);
      boardWidgets = raw ? (JSON.parse(raw) as HouseholdSnapshot["boardWidgets"]) : undefined;
    } catch {
      boardWidgets = undefined;
    }
    const blob = new Blob([serializeBackup(snapshot, boardWidgets)], { type: "application/json" });
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
      {!suppressTips && !isTipDismissed(guideState, TIP_IDS.SETTINGS_BACKUP) && (
        <CoachMark
          tipId={TIP_IDS.SETTINGS_BACKUP}
          kicker="Backup & privacy"
          message="OpenWall stores household records and board layout on this device. Export a backup before clearing browser data."
          onDismiss={onDismissTip}
        />
      )}
      <InstallEducation
        online={online}
        offlineReady={offlineReady}
        installPrompt={installPrompt}
        installed={installed}
        onInstall={onInstall}
      />
      <AppearanceSection
        preferences={appearance}
        onChange={onAppearanceChange}
        onReset={onAppearanceReset}
      />
      <section className="settings-card parent-protection-card">
        <div className="settings-icon"><ShieldCheck /></div>
        <div><h2>Parent mode</h2><p>{parentUnlocked ? "Protected actions are unlocked for 15 minutes on this device." : hasParentPin() ? "Reward edits and approvals are protected by your local parent PIN." : "Create a local parent PIN before changing reward rules or approving Stars."}</p></div>
        <button className={parentUnlocked ? "secondary-button" : "primary-button"} onClick={onRequestParentUnlock}>{parentUnlocked ? "Parent mode on" : hasParentPin() ? "Unlock parent mode" : "Create parent PIN"}</button>
      </section>
      <div className="settings-grid">
        <section className="settings-card">
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
        <section className="settings-card danger-zone">
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
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [guideState, setGuideState] = useState<GuideState>(() => loadGuideState());
  const [tourOpen, setTourOpen] = useState(false);
  const [tourTrigger, setTourTrigger] = useState<HTMLElement | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [guideInitialTab, setGuideInitialTab] = useState<"articles" | "releases">("articles");
  const [parentUnlocked, setParentUnlocked] = useState(() => isParentUnlocked());
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");
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

  useEffect(() => {
    applyAppearanceToDOM(appearance);
    saveAppearancePreferences(appearance);
  }, [appearance]);

  const handleAppearanceChange = (next: AppearancePreferences) => {
    setAppearance(next);
  };

  const handleAppearanceReset = () => {
    setAppearance(DEFAULT_APPEARANCE);
  };

  const requestParentUnlock = () => {
    if (!hasParentPin()) { setPinSetupMode(true); setPinPrompt(true); return; }
    setPinSetupMode(false); setPinPrompt(true);
  };
  const handlePinSubmit = async () => {
    try {
      if (pinSetupMode) {
        await setParentPin(pinValue);
        setParentUnlocked(true);
        setPinPrompt(false);
        setPinValue("");
        setNotice({ tone: "success", message: "Parent mode is unlocked for 15 minutes on this device." });
      } else if (await unlockParentMode(pinValue)) {
        setParentUnlocked(true); setPinPrompt(false); setPinValue("");
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
        await registration?.update();
        window.location.reload();
      }
    } catch {
      setUpdateInProgress(false);
      setNotice({ tone: "error", message: "The update could not be installed. Your saved household is safe; try again when online." });
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
        const weekday = new Date(`${occurrenceDate}T12:00:00`).getDay();
        const existing = new Set(
          current.tasks
            .filter((task) => task.occurrenceDate === occurrenceDate)
            .map((task) => task.routineId),
        );
        const additions = current.routines
          .filter((routine) => {
            if (existing.has(routine.id) || routine.skippedDates?.includes(occurrenceDate)) return false;
            if (routine.frequency === "weekly") return routine.weekdays?.includes(weekday) ?? false;
            if (routine.frequency === "school-days") return weekday > 0 && weekday < 6;
            return true;
          })
          .map((routine) => ({
            id: id(), householdId: routine.householdId, title: routine.title,
            assigneeIds: routine.assigneeIds, dueDate: occurrenceDate, routineId: routine.id,
            occurrenceDate, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          }));
        if (!additions.length) return current;
        await Promise.all(additions.map((task) => repository.saveTask(task)));
        return { ...current, tasks: [...current.tasks, ...additions] };
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
    const updateReady = (event: Event) =>
      setUpdate(() => (event as CustomEvent<() => Promise<void>>).detail);
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
    if (data.boardWidgets) {
      try {
        localStorage.setItem(`openwall-board-${data.household.id}`, JSON.stringify(data.boardWidgets));
      } catch {
        // The household remains recoverable even when board storage is unavailable.
      }
    }
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
  };
  const saveTask = async (item: HouseholdTask) => {
    await repository.saveTask(item);
    setSnapshot((current) =>
      current
        ? { ...current, tasks: [...current.tasks.filter((value) => value.id !== item.id), item] }
        : current,
    );
    setEditor(null);
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
    setSnapshot((current) => current ? { ...current, rewards: [...(current.rewards ?? []).filter((value) => value.id !== entry.id), entry], activities: [...(current.activities ?? []), activity] } : current);
  };
  const saveRewardDefinition = async (definition: RewardDefinition) => {
    await repository.saveRewardDefinition(definition);
    setSnapshot((current) => current ? { ...current, rewardDefinitions: [...(current.rewardDefinitions ?? []).filter((value) => value.id !== definition.id), definition] } : current);
  };
  const saveRewardGoal = async (goal: RewardGoal) => {
    await repository.saveRewardGoal(goal);
    setSnapshot((current) => current ? { ...current, rewardGoals: [...(current.rewardGoals ?? []).filter((value) => value.id !== goal.id), goal] } : current);
  };
  const saveRedemption = async (redemption: RewardRedemption) => {
    await repository.saveRewardRedemption(redemption);
    const member = snapshot.members.find((candidate) => candidate.id === redemption.memberId);
    const activity: ActivityEntry = { id: id(), householdId: redemption.householdId, type: "redemption", entityId: redemption.id, memberIds: [redemption.memberId], summary: redemption.status === "requested" ? `${member?.name ?? "Member"} requested a reward` : `Reward request ${redemption.status}`, createdAt: redemption.decidedAt ?? redemption.requestedAt };
    await repository.saveActivity(activity);
    setSnapshot((current) => current ? { ...current, rewardRedemptions: [...(current.rewardRedemptions ?? []).filter((value) => value.id !== redemption.id), redemption], activities: [...(current.activities ?? []), activity] } : current);
    if (redemption.status === "requested") setNotice({ tone: "success", message: "Reward request saved for parent review." });
  };
  const saveActivity = async (activity: ActivityEntry) => {
    await repository.saveActivity(activity);
    setSnapshot((current) => current ? { ...current, activities: [...(current.activities ?? []), activity] } : current);
  };
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
            snapshot={snapshot}
            filterId={filterId}
            onFilter={setFilterId}
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
            online={online}
            offlineReady={offlineReady}
            installPrompt={installPrompt}
            installed={installed}
            onInstall={handleInstall}
            parentUnlocked={parentUnlocked}
            onRequestParentUnlock={requestParentUnlock}
          />
        ) : (
          <DashboardView
            view={view}
            snapshot={snapshot}
            filterId={filterId}
            onFilter={setFilterId}
            onView={setView}
            onEdit={setEditor}
            onComplete={toggleTask}
            onSaveRoutine={async (routine) => {
              await repository.saveRoutine(routine);
              const now = new Date().toISOString();
              const occurrence: HouseholdTask = {
                id: id(),
                householdId: routine.householdId,
                title: routine.title,
                assigneeIds: routine.assigneeIds,
                dueDate: todayInput(),
                routineId: routine.id,
                occurrenceDate: todayInput(),
                createdAt: now,
                updatedAt: now,
              };
              await repository.saveTask(occurrence);
              setSnapshot((current) => (current ? { ...current, routines: [...(current.routines ?? []), routine], tasks: [...current.tasks, occurrence] } : current));
            }}
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
              const historyEntry: HistoryEntry | undefined = routine.skippedDates?.length ? { id: id(), householdId: routine.householdId, entityId: routine.id, entityType: "routine", action: "skipped", occurredAt: new Date().toISOString(), memberIds: routine.assigneeIds, summary: `Skipped ${routine.title} for today` } : undefined;
              if (historyEntry) await repository.saveHistory(historyEntry);
              setSnapshot((current) => current ? { ...current, routines: (current.routines ?? []).map((value) => value.id === routine.id ? routine : value), ...(historyEntry ? { history: [...(current.history ?? []), historyEntry] } : {}) } : current);
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
              try { localStorage.setItem(`openwall-photo-${photo.householdId}`, photo.dataUrl); } catch { /* IndexedDB remains the source of truth. */ }
              setSnapshot((current) => current ? { ...current, photos: [photo] } : current);
            }}
            onDeletePhoto={async (photo) => {
              await repository.deletePhoto(photo.id);
              try { localStorage.removeItem(`openwall-photo-${photo.householdId}`); } catch { /* Ignore unavailable browser storage. */ }
              setSnapshot((current) => current ? { ...current, photos: [] } : current);
            }}
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
        <Dialog title={pinSetupMode ? "Create parent PIN" : "Unlock parent mode"} onClose={() => { setPinPrompt(false); setPinValue(""); }}>
          <p className="confirm-copy">{pinSetupMode ? "Use a 4–6 digit PIN for reward rules, approvals, and protected household changes. It stays only on this device." : "Enter the local parent PIN to unlock protected actions for 15 minutes."}</p>
          <label>Parent PIN<input autoFocus inputMode="numeric" type="password" maxLength={6} value={pinValue} onChange={(event) => setPinValue(event.target.value.replace(/\D/g, ""))} /></label>
          <div className="dialog-actions"><span /><button className="secondary-button" onClick={() => { setPinPrompt(false); setPinValue(""); }}>Cancel</button><button className="primary-button" onClick={handlePinSubmit}>{pinSetupMode ? "Save PIN" : "Unlock"}</button></div>
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
