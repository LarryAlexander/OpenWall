import { Check, Sparkles, X } from "lucide-react";

interface CoachMarkProps {
  tipId: string;
  kicker?: string;
  message: string;
  onDismiss: (tipId: string) => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function CoachMark({
  tipId,
  kicker = "Quick tip",
  message,
  onDismiss,
  actionLabel,
  onAction,
  className = "",
}: CoachMarkProps) {
  return (
    <div className={`coach-mark ${className}`} role="status" aria-live="polite" aria-label={kicker}>
      <div className="coach-mark-content">
        <span className="coach-mark-icon" aria-hidden="true">
          <Sparkles />
        </span>
        <div className="coach-mark-copy">
          <span className="coach-mark-kicker">{kicker}</span>
          <p className="coach-mark-message">{message}</p>
        </div>
      </div>
      <div className="coach-mark-actions">
        {actionLabel && onAction && (
          <button type="button" className="text-button coach-mark-action-btn" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          className="coach-mark-dismiss-btn"
          onClick={() => onDismiss(tipId)}
          aria-label={`Dismiss ${kicker.toLowerCase()}`}
          title="Dismiss tip"
        >
          <Check aria-hidden="true" size={14} />
          <span>Got it</span>
        </button>
        <button
          type="button"
          className="icon-button coach-mark-close-btn"
          onClick={() => onDismiss(tipId)}
          aria-label="Close tip"
          title="Dismiss"
        >
          <X aria-hidden="true" size={14} />
        </button>
      </div>
    </div>
  );
}
