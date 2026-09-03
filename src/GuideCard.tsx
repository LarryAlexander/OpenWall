import { useRef } from "react";
import { Compass, Sparkles, X } from "lucide-react";

interface GuideCardProps {
  onStartTour: (triggerElement: HTMLElement | null) => void;
  onDismiss: () => void;
}

export function GuideCard({ onStartTour, onDismiss }: GuideCardProps) {
  const startButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <aside className="guide-pinned-card" aria-label="Welcome tour invitation" role="region">
      <div className="guide-card-pushpin" aria-hidden="true" />
      <div className="guide-card-content">
        <div className="guide-card-icon-badge" aria-hidden="true">
          <Compass />
        </div>
        <div className="guide-card-copy">
          <div className="guide-card-kicker">
            <Sparkles size={13} aria-hidden="true" />
            <span>Welcome orientation · 60 seconds</span>
          </div>
          <h2 className="guide-card-title">Take a calm 60-second tour of your board</h2>
          <p className="guide-card-lede">
            Learn how today’s rhythm works, how to add and arrange cards, edit live countdowns, and
            keep your household data safely on this device.
          </p>
        </div>
      </div>
      <div className="guide-card-actions">
        <button
          ref={startButtonRef}
          type="button"
          className="primary-button guide-card-start-btn"
          onClick={() => onStartTour(startButtonRef.current)}
        >
          <Compass aria-hidden="true" />
          <span>Start 60-second tour</span>
        </button>
        <button
          type="button"
          className="guide-card-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss tour invitation"
          title="Dismiss tour"
        >
          <X aria-hidden="true" />
          <span>Dismiss</span>
        </button>
      </div>
    </aside>
  );
}
