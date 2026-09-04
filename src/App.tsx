import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
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
import { createHousehold, createSampleHousehold } from "./sample";
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
  ScheduleItem,
} from "./types";

type View = "today" | "settings" | "guide";
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
  onSetup,
  online,
  offlineReady,
}: {
  onSample: () => void;
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
        <button disabled>
          <CalendarDays />
          <span>Week</span>
          <span className="soon">Soon</span>
        </button>
        <button disabled>
          <ListChecks />
          <span>Lists</span>
          <span className="soon">Soon</span>
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
  const start = current ? parseISO(current.startsAt) : new Date();
  const end = current ? parseISO(current.endsAt) : new Date(Date.now() + 60 * 60 * 1000);
  const [title, setTitle] = useState(current?.title ?? "");
  const [date, setDate] = useState(format(start, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(timeInput(start));
  const [endTime, setEndTime] = useState(timeInput(end));
  const [memberIds, setMemberIds] = useState(current?.memberIds ?? []);
  const [notes, setNotes] = useState(current?.notes ?? "");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError("Add a title for this schedule item.");
    if (!date || !startTime || !endTime) return setError("Choose a date, start, and end time.");
    const startsAt = new Date(`${date}T${startTime}:00`);
    const endsAt = new Date(`${date}T${endTime}:00`);
    if (endsAt <= startsAt) return setError("End time must be after the start time.");
    const now = new Date().toISOString();
    onSave({
      id: current?.id ?? id(),
      householdId,
      title: title.trim(),
      memberIds,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      allDay: false,
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

function TodayBoard({
  snapshot,
  filterId,
  onFilter,
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
  const today = new Date();
  const boardRef = useRef<HTMLDivElement>(null);
  const storageKey = `openwall-board-${snapshot.household.id}`;
  const [arranging, setArranging] = useState(false);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [cardJustAdded, setCardJustAdded] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<BoardWidget | null>(null);
  const [widgets, setWidgets] = useState<BoardWidget[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return defaultBoardWidgets;
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
      isSameDay(parseISO(item.startsAt), today) && (!filterId || item.memberIds.includes(filterId)),
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
  }, [storageKey, widgets]);

  const updateWidget = (widgetId: string, patch: Partial<BoardWidget>) =>
    setWidgets((current) =>
      current.map((widget) => (widget.id === widgetId ? { ...widget, ...patch } : widget)),
    );

  const moveWidgetBy = (widgetId: string, offset: -1 | 1) => {
    setWidgets((current) => {
      const currentIndex = current.findIndex((widget) => widget.id === widgetId);
      const nextIndex = currentIndex + offset;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const reordered = [...current];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(nextIndex, 0, moved);
      return reordered;
    });
  };

  const resizeStackedWidget = (widget: BoardWidget, element: HTMLElement | null, delta: number) => {
    const currentHeight = widget.stackedHeight ?? element?.offsetHeight ?? 220;
    updateWidget(widget.id, {
      stackedHeight: Math.max(150, Math.min(720, currentHeight + delta)),
    });
  };

  const beginMove = (event: React.PointerEvent, widget: BoardWidget, resizing = false) => {
    if (!arranging || widget.locked || !boardRef.current) return;
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

    if (isStackedBoard && resizing) return;
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
      if (resizing) {
        updateWidget(widget.id, {
          w: Math.max(12, Math.min(96 - widget.x, start.w + dx)),
          h: Math.max(18, Math.min(98 - widget.y, start.h + dy)),
        });
      } else {
        updateWidget(widget.id, {
          x: Math.max(0, Math.min(100 - widget.w, start.x + dx)),
          y: Math.max(0, Math.min(100 - widget.h, start.y + dy)),
        });
      }
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
    setWidgets((current) => [...current, added]);
    setTrayOpen(false);
    setArranging(true);
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
          arranging={arranging}
          onEdit={setEditingCountdown}
        />
      );
    return (
      <div className="photo-widget">
        <div className="photo-sky">
          <Sun />
          <span />
          <span />
        </div>
        <p>Our favorite place</p>
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
          <button
            className={arranging ? "arrange-button active" : "arrange-button"}
            aria-pressed={arranging}
            onClick={() =>
              setArranging((value) => {
                if (value) {
                  setCardJustAdded(false);
                  setActiveWidgetId(null);
                }
                return !value;
              })
            }
          >
            {arranging ? <Unlock /> : <Lock />}
            {arranging ? "Done arranging" : "Arrange"}
          </button>
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
      </div>
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
          message="Your new card has been placed on the corkboard. While in Arrange mode, you can drag it into position, resize it, or lock it before finishing."
          onDismiss={(tipId) => {
            setCardJustAdded(false);
            onDismissTip(tipId);
          }}
        />
      ) : !suppressBoardGuidance &&
        arranging &&
        !isTipDismissed(guideState, TIP_IDS.ARRANGE_MODE) ? (
        <CoachMark
          tipId={TIP_IDS.ARRANGE_MODE}
          kicker="Arrange mode"
          message="Drag cards by their top grip to reposition them, resize from the bottom-right handle, or lock cards so family members won't move them."
          onDismiss={onDismissTip}
        />
      ) : null}
      {arranging && (
        <div className="arrange-hint">
          <Grip />
          <span className="arrange-hint-wide">
            Drag cards by their top edge. Resize from the lower corner. Lock the board when it feels
            right.
          </span>
          <span className="arrange-hint-stacked">
            Drag a card by its grip to change its order. Lock cards when the board feels right.
          </span>
        </div>
      )}
      <div className={`open-corkboard ${arranging ? "is-arranging" : ""}`} ref={boardRef}>
        <div className="cork-grain" />
        {widgets.map((widget) => (
          <article
            key={widget.id}
            data-widget-id={widget.id}
            className={`board-widget widget-${widget.type} ${widget.locked ? "is-locked" : ""} ${draggingWidgetId === widget.id ? "is-dragging" : ""} ${activeWidgetId === widget.id ? "is-active-widget" : ""} ${widget.stackedHeight ? "has-stacked-height" : ""}`}
            onPointerDownCapture={() => {
              if (arranging) setActiveWidgetId(widget.id);
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
            {arranging && (
              <div
                className="widget-controls"
                onPointerDown={(event) => {
                  const actionButton = (event.target as HTMLElement).closest("button");
                  if (actionButton && !actionButton.classList.contains("widget-drag-handle"))
                    return;
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
                  className="stacked-widget-control"
                  disabled={widget.locked}
                  onClick={() => moveWidgetBy(widget.id, -1)}
                  aria-label={`Move ${widget.type} card up`}
                >
                  <ArrowUp />
                </button>
                <button
                  className="stacked-widget-control"
                  disabled={widget.locked}
                  onClick={() => moveWidgetBy(widget.id, 1)}
                  aria-label={`Move ${widget.type} card down`}
                >
                  <ArrowDown />
                </button>
                <button
                  className="stacked-widget-control"
                  disabled={widget.locked}
                  onClick={(event) =>
                    resizeStackedWidget(
                      widget,
                      event.currentTarget.closest<HTMLElement>("[data-widget-id]"),
                      -60,
                    )
                  }
                  aria-label={`Make ${widget.type} card shorter`}
                >
                  <Minus />
                </button>
                <button
                  className="stacked-widget-control"
                  disabled={widget.locked}
                  onClick={(event) =>
                    resizeStackedWidget(
                      widget,
                      event.currentTarget.closest<HTMLElement>("[data-widget-id]"),
                      60,
                    )
                  }
                  aria-label={`Make ${widget.type} card taller`}
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
                    onClick={() =>
                      setWidgets((current) => current.filter((item) => item.id !== widget.id))
                    }
                    aria-label={`Remove ${widget.type} card`}
                  >
                    <X />
                  </button>
                )}
              </div>
            )}
            <div className="widget-content">{renderWidget(widget)}</div>
            {arranging && !widget.locked && (
              <button
                className="resize-handle"
                onPointerDown={(event) => beginMove(event, widget, true)}
                aria-label={`Resize ${widget.type} card`}
              >
                <span />
              </button>
            )}
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
              <button disabled>
                <span className="picker-icon">
                  <LayoutDashboard />
                </span>
                <strong>More widgets</strong>
                <small>Weather, links & more soon</small>
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
            setWidgets((current) => current.filter((item) => item.id !== widgetId));
            setEditingCountdown(null);
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

function SettingsView({
  snapshot,
  onImport,
  onSampleReset,
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
}: {
  snapshot: HouseholdSnapshot;
  onImport: (file: File) => void;
  onSampleReset: () => void;
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
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportData = () => {
    const blob = new Blob([serializeBackup(snapshot)], { type: "application/json" });
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
          message="OpenWall stores household members, schedules, and tasks on this device. The current backup protects those records, but not board layout or countdown cards."
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
      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-icon">
            <Download />
          </div>
          <div>
            <h2>Back up your household</h2>
            <p>
              Download a readable, versioned copy of schedules, members, and tasks. (Board layout,
              countdown clocks, and guide state remain stored on this device).
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
              OpenWall checks the file before replacing schedules, members, and tasks. (Board layout
              and countdown clocks remain in local browser storage).
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
  const [online, setOnline] = useState(navigator.onLine);
  const [guideState, setGuideState] = useState<GuideState>(() => loadGuideState());
  const [tourOpen, setTourOpen] = useState(false);
  const [tourTrigger, setTourTrigger] = useState<HTMLElement | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [guideInitialTab, setGuideInitialTab] = useState<"articles" | "releases">("articles");
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
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(PWA_POST_UPDATE_KEY, "true");
      } catch {
        // ignore
      }
    }
    if (update) {
      await update();
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
    setSnapshot(data);
    setSetup(false);
    setView("today");
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
    setSnapshot((current) =>
      current
        ? {
            ...current,
            scheduleItems: [
              ...current.scheduleItems.filter((value) => value.id !== item.id),
              item,
            ].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
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
  const toggleTask = async (task: HouseholdTask) =>
    saveTask({
      ...task,
      completedAt: task.completedAt ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
          <button className="toast update" onClick={handlePwaUpdate}>
            <Download /> A new version is ready. Refresh now.
          </button>
        )}
        {view === "today" ? (
          <TodayBoard
            snapshot={snapshot}
            filterId={filterId}
            onFilter={setFilterId}
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
        ) : (
          <SettingsView
            snapshot={snapshot}
            onImport={importFile}
            onSampleReset={resetSample}
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
