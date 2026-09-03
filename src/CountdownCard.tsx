import { Pencil, Timer } from "lucide-react";
import { getCountdownConfig, useCountdown } from "./countdown";
import type { BoardWidget } from "./types";

interface CountdownCardProps {
  widget: BoardWidget;
  householdTimezone: string;
  arranging: boolean;
  onEdit: (widget: BoardWidget) => void;
}

export function CountdownCard({
  widget,
  householdTimezone,
  arranging,
  onEdit,
}: CountdownCardProps) {
  const config = getCountdownConfig(widget, householdTimezone);
  const display = useCountdown(config);

  return (
    <div
      className={`simple-widget countdown-widget ${display.isCompleted ? "is-completed" : ""} ${display.isUrgent ? "is-urgent" : ""}`}
      onClick={() => {
        if (!arranging) {
          onEdit(widget);
        }
      }}
      style={{ cursor: arranging ? "default" : "pointer" }}
    >
      <span className="sr-only">{display.screenReaderText}</span>
      <div className="countdown-header">
        <div className="countdown-kicker">
          <Timer aria-hidden="true" />
          <span>{display.isCompleted ? "COMPLETED" : "COUNTDOWN"}</span>
        </div>
        {!arranging && (
          <button
            type="button"
            className="countdown-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(widget);
            }}
            aria-label={`Edit ${config.title} countdown`}
            title="Edit countdown"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="countdown-body" aria-hidden="true">
        {display.isCompleted ? (
          <div className="countdown-complete-view">
            <span className="countdown-complete-badge">Done!</span>
            <p className="countdown-complete-msg">{display.completionMessage}</p>
            {display.finishedTimeDisplay && (
              <span className="countdown-finished-at">Finished {display.finishedTimeDisplay}</span>
            )}
            <p className="countdown-target-name">{config.title}</p>
          </div>
        ) : (
          <div className="countdown-active-view">
            <div className="countdown-metric">
              <span className={`countdown-digits mode-${config.displayMode}`}>
                {display.primaryText}
              </span>
              {display.unitText && <span className="countdown-unit">{display.unitText}</span>}
            </div>
            <p className="countdown-target-name">{display.subText}</p>
            {display.targetDateDisplay && (
              <span className="countdown-target-date">{display.targetDateDisplay}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
