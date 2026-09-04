import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Grip,
  Plus,
  ShieldCheck,
  Sun,
  Timer,
  X,
} from "lucide-react";

interface TourStep {
  id: string;
  badge: string;
  title: string;
  lead: string;
  icon: React.ReactNode;
  highlights: { title: string; desc: string }[];
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "overview",
    badge: "Board overview",
    title: "Your home’s calm center",
    lead: "OpenWall gives your family one dependable, glanceable focal point for the day's schedule and little jobs.",
    icon: <Sun aria-hidden="true" />,
    highlights: [
      {
        title: "A living corkboard",
        desc: "Read the schedule, check off chores, and move cards directly whenever the board needs to change.",
      },
      {
        title: "Today’s timeline",
        desc: "Schedule items display chronologically with accessible member color dots and an indicator for what’s next.",
      },
      {
        title: "Member filters",
        desc: "Tap any person’s avatar along the top to filter the board to their items, or tap “All” to view the whole home.",
      },
    ],
    tip: "Tip: Tap the full-screen icon in the top right to turn any tablet or display into a dedicated wall board.",
  },
  {
    id: "add",
    badge: "Add to board",
    title: "Pin cards to your wall",
    lead: "Open the widget tray anytime to add new notes, checklists, events, meals, countdowns, or photos.",
    icon: <Plus aria-hidden="true" />,
    highlights: [
      {
        title: "Quick-add tray",
        desc: "Click “+ Add to board” in the toolbar to browse built-in card types designed for home coordination.",
      },
      {
        title: "Notes & checklists",
        desc: "Leave yellow sticky reminders or add shared to-dos with assignees that family members can check off.",
      },
      {
        title: "Instant placement",
        desc: "New cards appear right on your corkboard, ready to be positioned, resized, or filled with content.",
      },
    ],
    tip: "Tip: Use the “+” buttons inside the Schedule and To Do card headers to add items directly to existing cards.",
  },
  {
    id: "countdown",
    badge: "Countdown editing",
    title: "Real live countdown clocks",
    lead: "Countdowns aren’t just static text. They are live, timezone-aware clocks that build anticipation for big days.",
    icon: <Timer aria-hidden="true" />,
    highlights: [
      {
        title: "One-click editing",
        desc: "Click any countdown card in normal glance mode to set the event title, date, time, timezone, and style.",
      },
      {
        title: "Adaptive precision",
        desc: "Shows remaining days from afar, switches to hours & minutes under 48 hours, and becomes a digital clock in the final hour.",
      },
      {
        title: "Celebration & finish",
        desc: "When the clock reaches zero, it displays your custom completion message and the exact finished time.",
      },
    ],
    tip: "Tip: Urgency animations automatically pause when this device has reduced motion enabled.",
  },
  {
    id: "arrange",
    badge: "Direct arrangement",
    title: "Move it like a real corkboard",
    lead: "The board is always ready to reorganize—there is no separate mode to enter or remember to leave.",
    icon: <Grip aria-hidden="true" />,
    highlights: [
      {
        title: "Grab any card",
        desc: "Drag the small grip above a card to move it. On tablets and phones, drag the grip to change its order.",
      },
      {
        title: "Resize in place",
        desc: "Select or hover over a card to reveal smaller and larger controls that work with touch, mouse, or keyboard.",
      },
      {
        title: "Lock & protect",
        desc: "Use the lock icon to freeze important cards. Unlock one whenever you want to move it again.",
      },
    ],
    tip: "Tip: Dragging starts only from the grip, so buttons and scrollable card content remain safe to use.",
  },
  {
    id: "offline-privacy",
    badge: "Offline, privacy & backups",
    title: "Your household data stays yours",
    lead: "OpenWall has no accounts, no cloud servers, and no tracking. Everything stays strictly on this device.",
    icon: <ShieldCheck aria-hidden="true" />,
    highlights: [
      {
        title: "100% local-first",
        desc: "Members, schedules, and tasks use IndexedDB; board layout, countdowns, and Guide preferences use local browser storage. After the app shell is cached, these features remain available offline.",
      },
      {
        title: "Versioned backups",
        desc: "Export JSON backups in Settings to protect members, schedules, and tasks. (Board layout and countdown clocks stay in local browser storage).",
      },
      {
        title: "Safe restore",
        desc: "Easily restore your backup file onto another tablet, laptop, or browser profile with a safety confirmation.",
      },
    ],
    tip: "Tip: Visit Settings in the sidebar to download a backup file whenever you make major changes to your household.",
  },
];

export interface GuideTourProps {
  open: boolean;
  initialStep?: number;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onComplete: () => void;
  onDismiss: () => void;
}

export function GuideTour({
  open,
  initialStep = 0,
  triggerElement,
  onClose,
  onComplete,
  onDismiss,
}: GuideTourProps) {
  const [step, setStep] = useState(initialStep);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(triggerElement ?? null);

  // Sync triggerRef whenever triggerElement prop updates
  useEffect(() => {
    if (triggerElement) {
      triggerRef.current = triggerElement;
    } else if (open && !triggerRef.current && typeof document !== "undefined") {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open, triggerElement]);

  // Reset step when opened with a new initialStep
  useEffect(() => {
    if (open) {
      setStep(Math.max(0, Math.min(initialStep, TOUR_STEPS.length - 1)));
    }
  }, [open, initialStep]);

  // Restore focus to trigger on close
  const restoreFocus = () => {
    const trigger = triggerRef.current;
    if (trigger && typeof trigger.focus === "function") {
      requestAnimationFrame(() => {
        trigger.focus();
      });
    }
  };

  const handleFinish = () => {
    restoreFocus();
    onComplete();
  };

  const handleSkip = () => {
    restoreFocus();
    if (dontShowAgain) {
      onDismiss();
    } else {
      onClose();
    }
  };

  const skipRef = useRef(handleSkip);
  skipRef.current = handleSkip;

  // Focus entering and trapping
  useEffect(() => {
    if (!open) return;

    // Focus the dialog or first button
    const timer = requestAnimationFrame(() => {
      if (dialogRef.current) {
        const nextButton = dialogRef.current.querySelector<HTMLButtonElement>(
          ".guide-tour-primary-btn, .guide-tour-dialog",
        );
        if (nextButton) {
          nextButton.focus();
        } else {
          dialogRef.current.focus();
        }
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skipRef.current();
        return;
      }

      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first || !dialog.contains(document.activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialog.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleNext = () => {
    setStep((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  if (!open) return null;

  const currentStep = TOUR_STEPS[step];
  const isLastStep = step === TOUR_STEPS.length - 1;

  return (
    <div
      className="dialog-backdrop guide-tour-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleSkip();
      }}
    >
      <div
        ref={dialogRef}
        className="dialog guide-tour-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-tour-title"
        aria-describedby="guide-tour-desc"
        tabIndex={-1}
      >
        <header className="guide-tour-header">
          <div className="guide-tour-header-meta">
            <span className="guide-tour-step-pill">
              Step {step + 1} of {TOUR_STEPS.length}
            </span>
            <span className="guide-tour-badge">{currentStep.badge}</span>
          </div>

          <div className="guide-tour-header-actions">
            <button type="button" className="text-button guide-tour-skip-btn" onClick={handleSkip}>
              Skip tour
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={handleSkip}
              aria-label="Close tour"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Step progress dots */}
        <div className="guide-tour-progress" role="tablist" aria-label="Tour step indicators">
          {TOUR_STEPS.map((s, index) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={index === step}
              aria-label={`Go to step ${index + 1}: ${s.badge}`}
              className={`guide-progress-dot ${index === step ? "is-active" : index < step ? "is-done" : ""}`}
              onClick={() => setStep(index)}
            />
          ))}
        </div>

        <div className="guide-tour-body">
          <div className="guide-step-banner">
            <div className="guide-step-icon-badge" aria-hidden="true">
              {currentStep.icon}
            </div>
            <div className="guide-step-heading">
              <h2 id="guide-tour-title">{currentStep.title}</h2>
              <p id="guide-tour-desc" className="guide-step-lead">
                {currentStep.lead}
              </p>
            </div>
          </div>

          <ul className="guide-step-highlights" aria-label="Key features">
            {currentStep.highlights.map((h, i) => (
              <li key={i} className="guide-highlight-item">
                <span className="guide-highlight-bullet" aria-hidden="true" />
                <div>
                  <strong>{h.title}:</strong> <span>{h.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="guide-step-tip" role="note">
            <p>{currentStep.tip}</p>
          </div>
        </div>

        <footer className="guide-tour-footer">
          <label className="guide-tour-checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don’t show automatically again</span>
          </label>

          <div className="guide-tour-nav-buttons">
            <button
              type="button"
              className="secondary-button guide-tour-back-btn"
              onClick={handleBack}
              disabled={step === 0}
              aria-label="Previous step"
            >
              <ChevronLeft aria-hidden="true" />
              <span>Back</span>
            </button>

            {isLastStep ? (
              <button
                type="button"
                className="primary-button guide-tour-primary-btn"
                onClick={handleFinish}
              >
                <Check aria-hidden="true" />
                <span>Finish</span>
              </button>
            ) : (
              <button
                type="button"
                className="primary-button guide-tour-primary-btn"
                onClick={handleNext}
              >
                <span>Next</span>
                <ChevronRight aria-hidden="true" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
