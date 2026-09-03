import { useState, type FormEvent } from "react";
import { AlertCircle, Timer, Trash2, X } from "lucide-react";
import {
  calculateCountdown,
  createIsoInTimezone,
  getCountdownConfig,
  parseIsoToPartsInTimezone,
  updateBoardWidgetWithCountdown,
} from "./countdown";
import type { BoardWidget, CountdownDisplayMode } from "./types";

interface CountdownEditorProps {
  widget: BoardWidget;
  householdTimezone: string;
  onSave: (updated: BoardWidget) => void;
  onDelete: (widgetId: string) => void;
  onClose: () => void;
}

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
];

export function CountdownEditor({
  widget,
  householdTimezone,
  onSave,
  onDelete,
  onClose,
}: CountdownEditorProps) {
  const initialConfig = getCountdownConfig(widget, householdTimezone);
  const initialParts = parseIsoToPartsInTimezone(
    initialConfig.targetAt,
    initialConfig.timezone || householdTimezone,
  );

  const [title, setTitle] = useState(initialConfig.title);
  const [date, setDate] = useState(initialParts.date);
  const [time, setTime] = useState(initialParts.time);
  const [timezone, setTimezone] = useState(initialConfig.timezone || householdTimezone);
  const [displayMode, setDisplayMode] = useState<CountdownDisplayMode>(initialConfig.displayMode);
  const [completionMessage, setCompletionMessage] = useState(initialConfig.completionMessage || "");
  const [error, setError] = useState("");

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezones = Array.from(
    new Set([householdTimezone, localTz, timezone, ...COMMON_TIMEZONES].filter(Boolean)),
  );

  // Compute live target ISO and display for preview & validation
  const previewIso =
    date && time ? createIsoInTimezone(date, time, timezone) : initialConfig.targetAt;
  const previewConfig = {
    title: title.trim() || "Countdown",
    targetAt: previewIso,
    displayMode,
    completionMessage: completionMessage.trim() || undefined,
    timezone,
  };
  const previewDisplay = calculateCountdown(previewConfig, new Date());
  const isPast = previewDisplay.isCompleted;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for the countdown.");
      return;
    }
    if (!date || !time) {
      setError("Please choose both a target date and time.");
      return;
    }

    const targetAt = createIsoInTimezone(date, time, timezone);
    const updated = updateBoardWidgetWithCountdown(widget, {
      title: title.trim(),
      targetAt,
      displayMode,
      completionMessage: completionMessage.trim() || undefined,
      timezone,
    });
    onSave(updated);
  };

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="dialog countdown-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="countdown-dialog-title"
      >
        <header>
          <h2 id="countdown-dialog-title">Edit countdown</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="editor-form">
          <label>
            What are we counting down to?
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Trip to the beach, Maya’s birthday"
              autoFocus
              required
            />
          </label>

          <div className="form-row">
            <label>
              Target date
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (error) setError("");
                }}
                required
              />
            </label>
            <label>
              Target time
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (error) setError("");
                }}
                required
              />
            </label>
            <label>
              Timezone
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz === householdTimezone ? `${tz} (Home)` : tz}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row form-row-2">
            <label>
              Display style
              <select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value as CountdownDisplayMode)}
              >
                <option value="auto">Automatic (adaptive: days, day/hour/min, MM:SS)</option>
                <option value="days">Days only</option>
                <option value="digital">Digital clock</option>
              </select>
            </label>
            <label>
              Completion message <span className="optional">Optional</span>
              <input
                value={completionMessage}
                onChange={(e) => setCompletionMessage(e.target.value)}
                placeholder="e.g. At the beach!, The day is here!"
              />
            </label>
          </div>

          {/* Validation notice for past dates with explicit choice */}
          {isPast && (
            <div className="countdown-past-banner" role="status">
              <AlertCircle size={20} aria-hidden="true" />
              <div className="past-banner-content">
                <strong>This countdown date has already passed.</strong>
                <p>
                  It will display on the board as completed ({previewDisplay.completionMessage}).
                  You can keep it to celebrate, or remove it from the board.
                </p>
                <div className="past-banner-actions">
                  <button
                    type="button"
                    className="danger-button text-btn"
                    onClick={() => {
                      if (window.confirm("Remove this countdown from the board?")) {
                        onDelete(widget.id);
                      }
                    }}
                  >
                    Remove completed countdown
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live card preview */}
          <div className="countdown-preview-container">
            <span className="preview-heading">Live card preview</span>
            <div className="countdown-preview-shell">
              <div className="simple-widget countdown-widget preview-card">
                <div className="countdown-header">
                  <div className="countdown-kicker">
                    <Timer aria-hidden="true" />
                    <span>{previewDisplay.isCompleted ? "COMPLETED" : "COUNTDOWN"}</span>
                  </div>
                </div>
                <div className="countdown-body" aria-hidden="true">
                  {previewDisplay.isCompleted ? (
                    <div className="countdown-complete-view">
                      <span className="countdown-complete-badge">Done!</span>
                      <p className="countdown-complete-msg">{previewDisplay.completionMessage}</p>
                      {previewDisplay.finishedTimeDisplay && (
                        <span className="countdown-finished-at">
                          Finished {previewDisplay.finishedTimeDisplay}
                        </span>
                      )}
                      <p className="countdown-target-name">{previewConfig.title}</p>
                    </div>
                  ) : (
                    <div className="countdown-active-view">
                      <div className="countdown-metric">
                        <span className={`countdown-digits mode-${displayMode}`}>
                          {previewDisplay.primaryText}
                        </span>
                        {previewDisplay.unitText && (
                          <span className="countdown-unit">{previewDisplay.unitText}</span>
                        )}
                      </div>
                      <p className="countdown-target-name">{previewDisplay.subText}</p>
                      {previewDisplay.targetDateDisplay && (
                        <span className="countdown-target-date">
                          {previewDisplay.targetDateDisplay}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="dialog-actions">
            <button
              className="danger-button"
              type="button"
              onClick={() => {
                if (window.confirm("Remove this countdown from the board?")) {
                  onDelete(widget.id);
                }
              }}
            >
              <Trash2 /> Delete
            </button>
            <span />
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Save countdown
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
