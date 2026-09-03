import { ArrowRight, Sparkles, X } from "lucide-react";
import type { ReleaseNote } from "./types";

interface WhatsNewNoticeProps {
  release: ReleaseNote;
  isPostUpdate?: boolean;
  onSeeWhatsNew: () => void;
  onDismiss: () => void;
}

export function WhatsNewNotice({
  release,
  isPostUpdate = false,
  onSeeWhatsNew,
  onDismiss,
}: WhatsNewNoticeProps) {
  return (
    <aside
      className={`whats-new-notice ${isPostUpdate ? "is-post-update" : ""}`}
      role="region"
      aria-label="What’s New notification"
    >
      <div className="whats-new-content">
        <span className="whats-new-icon-badge" aria-hidden="true">
          <Sparkles />
        </span>
        <div className="whats-new-copy">
          <div className="whats-new-kicker">
            <span>
              {isPostUpdate
                ? `Updated to OpenWall ${release.version}`
                : `What’s New in OpenWall ${release.version}`}
            </span>
            <span className="whats-new-pill">Latest update</span>
          </div>
          <p className="whats-new-title">{release.title}</p>
        </div>
      </div>
      <div className="whats-new-actions">
        <button type="button" className="primary-button whats-new-see-btn" onClick={onSeeWhatsNew}>
          <span>See What’s New</span>
          <ArrowRight aria-hidden="true" size={15} />
        </button>
        <button
          type="button"
          className="whats-new-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss What’s New notice"
          title="Dismiss notice"
        >
          <X aria-hidden="true" size={15} />
          <span>Dismiss</span>
        </button>
      </div>
    </aside>
  );
}
