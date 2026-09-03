import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  Home,
  Leaf,
  ListChecks,
  Menu,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { parseBackup, serializeBackup } from "./backup";
import { repository } from "./db";
import { createHousehold, createSampleHousehold } from "./sample";
import type {
  EditorTarget,
  HouseholdMember,
  HouseholdSnapshot,
  HouseholdTask,
  ScheduleItem,
} from "./types";

type View = "today" | "settings";
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

function Welcome({ onSample, onSetup }: { onSample: () => void; onSetup: () => void }) {
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

function TodayBoard({
  snapshot,
  filterId,
  onFilter,
  onEdit,
  onComplete,
}: {
  snapshot: HouseholdSnapshot;
  filterId: string | null;
  onFilter: (id: string | null) => void;
  onEdit: (target: EditorTarget) => void;
  onComplete: (task: HouseholdTask) => void;
}) {
  const today = new Date();
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

  return (
    <div className="board-view">
      <header className="board-header">
        <div>
          <p className="eyebrow">{snapshot.household.name}</p>
          <h1>
            {format(today, "EEEE")}, <span>{format(today, "MMMM d")}</span>
          </h1>
        </div>
        <div className="header-status">
          <span className="time-now">
            <Clock3 />
            {format(today, "h:mm a")}
          </span>
          <button
            className="glance-button"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <Monitor /> Full screen
          </button>
        </div>
      </header>
      <div className="member-filters" aria-label="Filter by household member">
        <button className={!filterId ? "selected" : ""} onClick={() => onFilter(null)}>
          <Users /> Everyone
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
      <div className="board-grid">
        <section className="agenda-panel" aria-labelledby="agenda-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Schedule</p>
              <h2 id="agenda-title">Today’s rhythm</h2>
            </div>
            <button
              className="round-add"
              onClick={() => onEdit({ kind: "event" })}
              aria-label="Add schedule item"
            >
              <Plus />
            </button>
          </div>
          {events.length ? (
            <div className="timeline">
              {events.map((item) => {
                const firstMember = getMember(item.memberIds[0], snapshot.members);
                return (
                  <article
                    className={`event-card ${next?.id === item.id ? "event-next" : ""}`}
                    key={item.id}
                  >
                    <time>
                      {format(parseISO(item.startsAt), "h:mm")}
                      <small>{format(parseISO(item.startsAt), "a")}</small>
                    </time>
                    <span className={`timeline-dot color-${firstMember?.colorToken ?? "sage"}`} />
                    <div className="event-body">
                      <div className="event-top">
                        <h3>{item.title}</h3>
                        {next?.id === item.id && <span className="up-next">Up next</span>}
                      </div>
                      {item.notes && <p>{item.notes}</p>}
                      <div className="assigned">
                        {item.memberIds.length ? (
                          item.memberIds.map((memberId) => {
                            const member = getMember(memberId, snapshot.members);
                            return member ? <Avatar member={member} small key={memberId} /> : null;
                          })
                        ) : (
                          <span>Everyone</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="icon-button edit-button"
                      onClick={() => onEdit({ kind: "event", value: item })}
                      aria-label={`Edit ${item.title}`}
                    >
                      <Pencil />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays />}
              title="A quiet day"
              body="Nothing is on the schedule yet."
              action="Add the first item"
              onAction={() => onEdit({ kind: "event" })}
            />
          )}
        </section>
        <section className="tasks-panel" aria-labelledby="tasks-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Household</p>
              <h2 id="tasks-title">Little things, shared</h2>
            </div>
            <button
              className="round-add dark"
              onClick={() => onEdit({ kind: "task" })}
              aria-label="Add task"
            >
              <Plus />
            </button>
          </div>
          <p className="task-progress">
            {tasks.filter((task) => task.completedAt).length} of {tasks.length} finished today
          </p>
          {tasks.length ? (
            <div className="task-list">
              {tasks.map((task) => (
                <article
                  className={`task-card ${task.completedAt ? "completed" : ""}`}
                  key={task.id}
                >
                  <button
                    className="task-check"
                    onClick={() => onComplete(task)}
                    aria-label={`${task.completedAt ? "Mark incomplete" : "Complete"} ${task.title}`}
                  >
                    {task.completedAt ? <Check /> : <Circle />}
                  </button>
                  <div className="task-body">
                    <h3>{task.title}</h3>
                    <div className="assigned">
                      {task.assigneeIds.length ? (
                        task.assigneeIds.map((memberId) => {
                          const member = getMember(memberId, snapshot.members);
                          return member ? <Avatar member={member} small key={memberId} /> : null;
                        })
                      ) : (
                        <span>Anyone can help</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="icon-button edit-button"
                    onClick={() => onEdit({ kind: "task", value: task })}
                    aria-label={`Edit ${task.title}`}
                  >
                    <Pencil />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ListChecks />}
              title="Nothing to carry"
              body="Add one small job for the household."
              action="Add a task"
              onAction={() => onEdit({ kind: "task" })}
            />
          )}
        </section>
      </div>
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
}: {
  snapshot: HouseholdSnapshot;
  onImport: (file: File) => void;
  onSampleReset: () => void;
  onHouseholdReset: () => void;
  notice: Notice;
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
      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-icon">
            <Download />
          </div>
          <div>
            <h2>Back up your household</h2>
            <p>Download a readable, versioned copy of schedules, people, and tasks.</p>
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
            <p>OpenWall checks the file before asking to replace anything.</p>
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
            <Moon />
          </div>
          <div>
            <h2>Display theme</h2>
            <p>OpenWall follows this device’s light or dark appearance automatically.</p>
          </div>
          <span className="local-pill">System setting</span>
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
            <p>Remove all locally stored household information from this browser.</p>
          </div>
          <button className="danger-button" onClick={onHouseholdReset}>
            <Trash2 /> Erase household
          </button>
        </section>
      </div>
      <footer className="settings-footer">
        <strong>OpenWall 0.1.0</strong>
        <span>Apache-2.0 · Open source · Local first</span>
      </footer>
    </div>
  );
}

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
  const [offlineReady, setOfflineReady] = useState(false);
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

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
    const ready = () => setOfflineReady(true);
    const updateReady = (event: Event) =>
      setUpdate(() => (event as CustomEvent<() => Promise<void>>).detail);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("openwall:offline-ready", ready);
    window.addEventListener("openwall:update-ready", updateReady);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("openwall:offline-ready", ready);
      window.removeEventListener("openwall:update-ready", updateReady);
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

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onView={setView}
        compact={sidebarCompact}
        onToggle={() => setSidebarCompact((value) => !value)}
      />
      <main className="main-surface">
        {!online && (
          <div className="connection-banner">
            <WifiOff /> Offline — your saved household is still available.
          </div>
        )}
        {offlineReady && online && (
          <button className="toast success" onClick={() => setOfflineReady(false)}>
            <CheckCircle2 /> Ready to use offline <X />
          </button>
        )}
        {update && (
          <button className="toast update" onClick={() => update()}>
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
          />
        ) : (
          <SettingsView
            snapshot={snapshot}
            onImport={importFile}
            onSampleReset={resetSample}
            onHouseholdReset={erase}
            notice={notice}
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
    </div>
  );
}
