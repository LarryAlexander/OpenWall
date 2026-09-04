import type { GuideArticle, GuideCategory, GuideCategoryId, ReleaseNote } from "./types";

export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Learn the core ideas behind OpenWall, the Today board, and the initial setup.",
  },
  {
    id: "cards-and-countdowns",
    title: "Cards and countdowns",
    description: "Explore sticky notes, tasks, meals, photos, and live timezone-aware countdowns.",
  },
  {
    id: "arranging-the-board",
    title: "Arranging the board",
    description: "Unlock the corkboard to reposition, resize, and lock cards for wall viewing.",
  },
  {
    id: "household-members-and-filters",
    title: "Household members and filters",
    description: "Manage who shares the wall, accessible colors, and member-specific views.",
  },
  {
    id: "offline-use-and-installation",
    title: "Offline use and installation",
    description: "Keep OpenWall running without internet and install it on home display screens.",
  },
  {
    id: "backup-restore-and-privacy",
    title: "Backup, restore, and privacy",
    description: "Understand device-only storage, export versioned backups, and restore safely.",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Recover from cleared browser storage, reset sample data, and manage guide tips.",
  },
];

export const GUIDE_ARTICLES: GuideArticle[] = [
  // 1. Getting started
  {
    id: "welcome-overview",
    title: "How OpenWall keeps your household oriented",
    summary:
      "A calm, glanceable home surface for today’s schedule, tasks, meals, and countdowns without accounts or tracking.",
    categoryId: "getting-started",
    keywords: [
      "overview",
      "welcome",
      "orientation",
      "today",
      "rhythm",
      "glance",
      "family",
      "home",
      "start",
    ],
    steps: [
      "Glance at the Today board anytime to see the current day, date, and live clock.",
      "Check the timeline on the Schedule card to see events in chronological order with member color dots.",
      "Review the To Do card and tap checkmarks directly from the board to complete daily jobs.",
      "Use member filter buttons at the top to toggle between one person's schedule and the entire family.",
    ],
    action: {
      type: "tour-step",
      label: "Watch Board Overview tour",
      stepIndex: 0,
    },
  },
  {
    id: "quick-onboarding-tour",
    title: "Taking the 60-second visual tour",
    summary:
      "A fast interactive walkthrough explaining how cards, arranging, countdowns, and offline privacy work.",
    categoryId: "getting-started",
    keywords: ["tour", "walkthrough", "guide", "intro", "onboarding", "help", "tutorial"],
    steps: [
      "Click 'Replay 60-second tour' from the Guide top bar or the Settings view.",
      "Navigate through the 5 essential steps using the Next and Back buttons, or press Escape to close.",
      "Check or uncheck 'Don’t show automatically again' to choose whether the welcome card remains on your board.",
    ],
    action: {
      type: "tour",
      label: "Start 60-second tour",
      stepIndex: 0,
    },
  },
  {
    id: "appearance-and-themes",
    title: "Personalizing themes, board textures, and motion",
    summary:
      "Select color presets, corkboard backgrounds, card corner styles, text scale, and motion settings locally on this screen.",
    categoryId: "getting-started",
    keywords: [
      "appearance",
      "theme",
      "dark mode",
      "light mode",
      "corkboard",
      "background",
      "corners",
      "text scale",
      "motion",
      "personalization",
      "presets",
    ],
    steps: [
      "Open Settings from the main navigation to access the Appearance & board display section.",
      "Switch between Light, Dark, or System mode, and choose from six warm color presets inspired by natural home materials.",
      "Select a corkboard surface: Classic Cork, Fine Grain, Warm Kraft Paper, Soft Linen, or Minimal Canvas.",
      "Fine-tune card corner styles from crisp to soft pill, and scale text for comfort on wall displays or tablets.",
      "Select Full, Gentle, or Off motion to tailor transitions and respect device motion sensitivity.",
      "All appearance choices are kept strictly on this device and are excluded from household backup files.",
    ],
    action: {
      type: "navigate",
      label: "Open Appearance Settings",
      targetView: "settings",
    },
  },

  // 2. Cards and countdowns
  {
    id: "countdown-widgets",
    title: "Creating and editing live countdown clocks",
    summary:
      "Countdowns are real live clocks that adapt precision as events draw near, with full timezone support.",
    categoryId: "cards-and-countdowns",
    keywords: [
      "countdown",
      "timer",
      "clock",
      "target",
      "timezone",
      "birthday",
      "vacation",
      "holiday",
      "edit",
    ],
    steps: [
      "In normal glance mode, click directly on any countdown card to open its focused editor.",
      "Enter the event title, target date, target time, and select the appropriate timezone.",
      "Choose a display mode: Auto (smart adaptive), Days only, or Digital minutes-and-seconds.",
      "Provide an optional celebratory message to show when the countdown reaches zero.",
      "Save changes to update the live clock immediately on your corkboard.",
    ],
    action: {
      type: "tour-step",
      label: "Watch Countdown tour step",
      stepIndex: 2,
    },
  },
  {
    id: "widget-tray-types",
    title: "Adding cards from the widget tray",
    summary:
      "Pin reminders, chore lists, schedules, meal plans, and family photos from the '+ Add to board' tray.",
    categoryId: "cards-and-countdowns",
    keywords: [
      "widget",
      "tray",
      "add",
      "note",
      "sticky",
      "checklist",
      "meal",
      "dinner",
      "photo",
      "schedule",
    ],
    steps: [
      "Click the '+ Add to board' button located in the top toolbar.",
      "Choose Yellow Sticky for a visual reminder or Tasks for the shared household task list.",
      "Pick Meal or Photo to add the current visual placeholder cards, or Countdown to add an editable live clock.",
      "New cards appear in Arrange mode so you can position, resize, lock, or remove them.",
      "Schedule and task content is editable today; editable notes, meals, and local photos are planned next.",
    ],
    action: {
      type: "tour-step",
      label: "Watch Add to board tour step",
      stepIndex: 1,
    },
  },

  // 3. Arranging the board
  {
    id: "arranging-cards",
    title: "Moving, resizing, and locking cards",
    summary:
      "Unlock the corkboard to customize your layout freely without risking accidental moves during daily touch use.",
    categoryId: "arranging-the-board",
    keywords: [
      "arrange",
      "move",
      "resize",
      "lock",
      "unlock",
      "layout",
      "grip",
      "drag",
      "organize",
      "canvas",
    ],
    steps: [
      "Click 'Arrange' in the top toolbar to unlock the canvas and reveal card controls.",
      "Drag any card by its top grip handle to move it anywhere on the corkboard.",
      "Drag the resize handle at the bottom-right corner to make cards larger for wall readability or smaller for density.",
      "Click the Lock icon on cards you want fixed in place so other family members don't move them.",
      "Click 'Done arranging' when finished to lock the board back into touch-safe Glance mode.",
    ],
    action: {
      type: "tour-step",
      label: "Watch Arrange mode tour step",
      stepIndex: 3,
    },
  },
  {
    id: "glance-mode-protection",
    title: "Why Glance mode protects your layout",
    summary:
      "How OpenWall keeps your board reliable by distinguishing read/interact mode from layout arrangement.",
    categoryId: "arranging-the-board",
    keywords: ["glance", "protect", "touch", "accidental", "safe", "lock", "done arranging"],
    steps: [
      "Glance mode is the default state whenever you open OpenWall.",
      "In Glance mode, tapping tasks checks them off and tapping countdowns opens editing without moving the cards.",
      "Card drag handles and delete buttons are completely hidden until Arrange mode is explicitly toggled on.",
    ],
    action: {
      type: "navigate",
      label: "Go to Today board",
      targetView: "today",
    },
  },

  // 4. Household members and filters
  {
    id: "member-filtering",
    title: "Filtering the board by family member",
    summary:
      "Quickly isolate events and chores for one person, or view the entire home combined in one glance.",
    categoryId: "household-members-and-filters",
    keywords: [
      "member",
      "filter",
      "avatar",
      "person",
      "assignee",
      "who",
      "schedule",
      "chores",
      "tasks",
    ],
    steps: [
      "Look at the member avatar bar directly above the corkboard canvas.",
      "Tap any individual family member to filter Today’s schedule and tasks to only their items.",
      "Tap 'All' at the far left of the member bar to return to the whole-household view.",
      "Notice that member dots on timeline events clearly indicate who each item belongs to.",
    ],
    action: {
      type: "navigate",
      label: "Go to Today board",
      targetView: "today",
    },
  },
  {
    id: "member-identities",
    title: "Accessible colors and member symbols",
    summary:
      "OpenWall pairs color tokens with distinct letter symbols so color is never the sole identifier.",
    categoryId: "household-members-and-filters",
    keywords: ["accessibility", "color", "symbol", "token", "contrast", "initial", "identity"],
    steps: [
      "Each member has an accessible palette token: sage, coral, gold, sky, plum, or clay.",
      "Every avatar also displays the person's initial or assigned symbol.",
      "Schedule and task dialogs display both avatars and clear text names for readability from across the room.",
    ],
  },

  // 5. Offline use and installation
  {
    id: "offline-resilience",
    title: "How OpenWall operates without internet",
    summary:
      "Your household data and app shell live directly on this device, keeping the board reliable during network outages.",
    categoryId: "offline-use-and-installation",
    keywords: [
      "offline",
      "internet",
      "network",
      "disconnect",
      "wifi",
      "service worker",
      "local",
      "cache",
    ],
    steps: [
      "While online, GitHub Pages delivers OpenWall’s static app files and the browser checks for published updates. OpenWall has no application account or household-data server.",
      "After loading OpenWall once online, the application shell is cached on this device when the browser supports the required service-worker features.",
      "Household members, schedule items, and tasks are saved in IndexedDB; board layout and countdown settings currently use separate local browser storage.",
      "If your home internet drops after the app has been cached, a gentle banner confirms that saved local features remain available.",
      "You can continue adding, editing, and checking off tasks normally while offline.",
      "Each browser keeps a separate household. Changes made on one phone do not automatically sync to another device in this version.",
    ],
    action: {
      type: "tour-step",
      label: "Watch Offline & Privacy tour step",
      stepIndex: 4,
    },
  },
  {
    id: "installing-pwa",
    title: "Installing OpenWall on a phone, tablet, or wall display",
    summary:
      "Run OpenWall as a standalone app or dedicated full-screen appliance on old tablets, laptops, or monitors.",
    categoryId: "offline-use-and-installation",
    keywords: [
      "install",
      "pwa",
      "iphone",
      "ipad",
      "android",
      "home screen",
      "safari",
      "chrome",
      "kiosk",
      "wall",
      "tablet",
      "fullscreen",
    ],
    steps: [
      "Open Settings and find Install & connectivity for instructions tailored to the device you are using.",
      "On iPhone or iPad, open OpenWall in Safari, tap Share, choose Add to Home Screen, then tap Add.",
      "On Android, open OpenWall in Chrome and choose Install app or Add to Home screen from the browser menu. When Chrome offers a direct install button, OpenWall displays it in Settings.",
      "On Chrome or Edge for computers and wall displays, use the address-bar install icon or the browser’s Install OpenWall menu item.",
      "Once installed, OpenWall opens in its own window without browser navigation toolbars.",
      "Install availability depends on the operating system and browser version. A normal bookmark remains a valid fallback.",
    ],
    action: {
      type: "navigate",
      label: "Open Install Settings",
      targetView: "settings",
    },
  },

  // 6. Backup, restore, and privacy
  {
    id: "local-privacy-backup",
    title: "Exporting and safeguarding your data",
    summary:
      "Export the household records supported by the current backup format so they can be recovered after browser-data loss.",
    categoryId: "backup-restore-and-privacy",
    keywords: [
      "backup",
      "export",
      "save",
      "json",
      "restore",
      "privacy",
      "recover",
      "browser cleanup",
    ],
    steps: [
      "Navigate to Settings by clicking the Settings link in the sidebar navigation.",
      "Under 'Back up your household', click 'Export backup'.",
      "A versioned JSON file (for example, openwall-YYYY-MM-DD.json) will be saved to your device.",
      "Store this file in your personal documents folder or cloud backup for long-term safety.",
      "The current backup protects household members, schedules, and tasks. It does not yet include the freeform board layout or countdown cards.",
    ],
    action: {
      type: "navigate",
      label: "Open Settings",
      targetView: "settings",
    },
  },
  {
    id: "restoring-from-backup",
    title: "Restoring or transferring to a new device",
    summary:
      "Safely validate and load an existing backup file onto any browser without risking corrupt imports.",
    categoryId: "backup-restore-and-privacy",
    keywords: ["restore", "import", "replace", "transfer", "device", "validation", "migrate"],
    steps: [
      "Open Settings from the sidebar navigation.",
      "Under 'Restore from a backup', click 'Choose backup' and pick your exported JSON file.",
      "OpenWall verifies the schema and format before asking you to confirm.",
      "Confirm the replacement to load the backed-up household members, schedule items, and tasks.",
      "Board layout, countdowns, and device-specific Guide preferences are not currently restored from this file.",
    ],
    action: {
      type: "navigate",
      label: "Open Settings",
      targetView: "settings",
    },
  },
  {
    id: "local-privacy-promise",
    title: "The local-first privacy promise",
    summary:
      "No account creation, no analytics tracking, no ads, and no mandatory monthly subscriptions.",
    categoryId: "backup-restore-and-privacy",
    keywords: [
      "privacy",
      "account",
      "telemetry",
      "tracking",
      "analytics",
      "security",
      "server",
      "cloud",
    ],
    steps: [
      "OpenWall has no remote servers storing your family schedules or children's names.",
      "No tracking scripts, cookies, or telemetry code exist in the application.",
      "Household entries stay on your device unless you explicitly choose to export a backup file.",
    ],
  },

  // 7. Troubleshooting
  {
    id: "storage-cleared-recovery",
    title: "Recovering if browser data was cleared",
    summary:
      "What happens when browsing data or cookies are erased, and how to quickly restore your household.",
    categoryId: "troubleshooting",
    keywords: ["troubleshooting", "disappeared", "lost", "cleared", "cookies", "recover", "empty"],
    steps: [
      "If you cleared your browser's site data or used private browsing, local IndexedDB may be empty.",
      "Open Settings and locate the 'Restore from a backup' section.",
      "Select your latest exported JSON file to restore its household members, schedules, and tasks.",
      "Tip: To avoid accidental loss, add OpenWall to your browser's site-data exception list.",
    ],
    action: {
      type: "navigate",
      label: "Open Settings",
      targetView: "settings",
    },
  },
  {
    id: "resetting-guide-tips",
    title: "Resetting dismissed guide tips and tour status",
    summary:
      "How to reset your device-specific guide state and replay the onboarding tour anytime.",
    categoryId: "troubleshooting",
    keywords: ["reset", "tips", "tour", "guide", "unseen", "dismissed", "troubleshoot", "replay"],
    steps: [
      "In this Guide destination, locate the utility controls at the top of the page.",
      "Click 'Reset dismissed tips' to clear any dismissed tip IDs saved in localStorage.",
      "Click 'Replay 60-second tour' to launch the interactive orientation tour from step 1.",
      "Notice that resetting guide state does not modify or delete any of your household schedule or task data.",
    ],
    action: {
      type: "tour",
      label: "Replay 60-second tour",
      stepIndex: 0,
    },
  },
  {
    id: "sample-reset-and-erase",
    title: "Resetting sample data or starting fresh",
    summary: "How to swap between fictional sample data and a completely blank slate in Settings.",
    categoryId: "troubleshooting",
    keywords: [
      "reset",
      "sample",
      "erase",
      "fresh",
      "clean slate",
      "delete household",
      "danger zone",
    ],
    steps: [
      "Go to Settings and scroll down to the red Danger Zone cards at the bottom.",
      "Click 'Reset sample' to replace the current board with fresh fictional sample entries.",
      "Click 'Erase this household' to wipe all locally stored household items from this browser.",
      "Both actions ask for explicit confirmation before proceeding.",
    ],
    action: {
      type: "navigate",
      label: "Open Settings",
      targetView: "settings",
    },
  },
];

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "0.3.0",
    releasedAt: "2026-09-03",
    title: "OpenWall 0.3.0: Mobile Setup That Tells the Truth",
    summary:
      "A clearer mobile welcome, device-aware installation steps, live connectivity status, and plain-language explanations make OpenWall easier to trust and install away from the wall display.",
    highlights: [
      "A mobile first-run card explains where setup and install help live before a household is created.",
      "Install & connectivity provides iPhone/iPad, Android, and desktop or wall-display instructions.",
      "Supported Chromium browsers can offer a direct Install OpenWall action.",
      "A three-part explanation distinguishes static GitHub Pages delivery from household data stored locally in the browser.",
      "Offline-readiness guidance, per-device persistence limits, backup boundaries, and the lack of cross-device sync are stated explicitly.",
    ],
    relatedArticleIds: ["installing-pwa", "offline-resilience", "local-privacy-backup"],
  },
  {
    version: "0.2.0",
    releasedAt: "2026-09-03",
    title: "OpenWall 0.2.0: Make the Board Yours",
    summary:
      "A device-local appearance studio brings warm themes, board surfaces, display modes, readable text scaling, and accessible motion controls to the family corkboard.",
    highlights: [
      "Six warm color themes and five tactile board surfaces preserve OpenWall’s corkboard character.",
      "Light, dark, and system display modes adapt the board to its room and device.",
      "Card-corner and text-size controls tune the board for playful, compact, or across-the-room viewing.",
      "Full, gentle, and off motion settings control purposeful transitions while the operating system’s reduced-motion preference always takes priority.",
      "Appearance stays on this device and remains separate from household backups.",
    ],
    relatedArticleIds: ["appearance-and-themes", "offline-resilience", "local-privacy-backup"],
  },
  {
    version: "0.1.0",
    releasedAt: "2026-09-03",
    title: "OpenWall 0.1.0: The Living Corkboard & Guide Foundation",
    summary:
      "The initial local-first family dashboard release, featuring a living corkboard, live countdown clocks, safe arrangement controls, offline app-shell resilience, and the built-in OpenWall Guide.",
    highlights: [
      "Living corkboard canvas: Freeform placement for schedule, tasks, notes, meals, and countdown cards.",
      "Real countdown widgets: Active, timezone-aware clocks that adapt precision from days down to digital minutes and seconds in the final hour.",
      "Glance vs. Arrange modes: Touch-safe everyday viewing with explicit Arrange mode for dragging, resizing, and locking cards.",
      "Local-first architecture: Household data and board settings stay in this browser without accounts, servers, or telemetry.",
      "New OpenWall Guide: Built-in 60-second orientation tour, searchable offline help library, and release history.",
      "Versioned household backups: Export members, schedules, and tasks from Settings while board-layout backup remains planned.",
    ],
    relatedArticleIds: [
      "welcome-overview",
      "countdown-widgets",
      "arranging-cards",
      "offline-resilience",
      "local-privacy-backup",
    ],
  },
];

export const LATEST_RELEASE: ReleaseNote = RELEASE_NOTES[0];

export const SUGGESTED_SEARCH_TOPICS: string[] = [
  "Appearance",
  "Countdown",
  "Arrange cards",
  "Backups",
  "Offline use",
  "Member filters",
  "Sticky notes",
  "Troubleshooting",
];

export function getCategoryById(id: GuideCategoryId): GuideCategory | undefined {
  return GUIDE_CATEGORIES.find((cat) => cat.id === id);
}

export function getArticleById(id: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((art) => art.id === id);
}

/**
 * Client-side search matching title, summary, category, keywords, and step text.
 */
export function searchGuideArticles(
  query: string,
  categoryId?: GuideCategoryId | "all" | null,
): GuideArticle[] {
  const trimmed = query.trim().toLowerCase();

  let pool = GUIDE_ARTICLES;
  if (categoryId && categoryId !== "all") {
    pool = pool.filter((art) => art.categoryId === categoryId);
  }

  if (!trimmed) {
    return pool;
  }

  const terms = trimmed.split(/\s+/).filter(Boolean);

  return pool.filter((article) => {
    const category = getCategoryById(article.categoryId);
    const categoryTitle = category ? category.title.toLowerCase() : "";
    const titleText = article.title.toLowerCase();
    const summaryText = article.summary.toLowerCase();
    const keywordsText = article.keywords.map((k) => k.toLowerCase()).join(" ");
    const stepsText = article.steps.map((s) => s.toLowerCase()).join(" ");

    const corpus = `${titleText} ${summaryText} ${categoryTitle} ${keywordsText} ${stepsText}`;

    // Every search term must match somewhere in the article corpus
    return terms.every((term) => corpus.includes(term));
  });
}
