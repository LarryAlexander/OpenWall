import type { GuideState, TourStatus } from "./types";

export const GUIDE_STORAGE_KEY = "openwall-guide-state-v1";
export const CURRENT_TOUR_VERSION = "0.1.0";
export const GUIDE_EVENT_START_TOUR = "openwall:start-tour";

export const DEFAULT_GUIDE_STATE: GuideState = {
  schemaVersion: 1,
  tourStatus: "unseen",
  dismissedTipIds: [],
  seenReleaseVersions: [],
};

const createDefaultGuideState = (): GuideState => ({
  ...DEFAULT_GUIDE_STATE,
  dismissedTipIds: [],
  seenReleaseVersions: [],
});

const VALID_TOUR_STATUSES: Set<TourStatus> = new Set(["unseen", "dismissed", "completed"]);

/**
 * Safely parse a raw string from localStorage into a valid GuideState.
 * Recovers gracefully from corrupted JSON, missing fields, or invalid types.
 */
export function parseGuideState(raw: string | null): GuideState {
  if (!raw) return createDefaultGuideState();

  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return createDefaultGuideState();
    }

    const candidate = data as Record<string, unknown>;

    const tourStatus: TourStatus =
      typeof candidate.tourStatus === "string" &&
      VALID_TOUR_STATUSES.has(candidate.tourStatus as TourStatus)
        ? (candidate.tourStatus as TourStatus)
        : "unseen";

    const completedTourVersion =
      typeof candidate.completedTourVersion === "string" &&
      candidate.completedTourVersion.trim() !== ""
        ? candidate.completedTourVersion
        : undefined;

    const dismissedTipIds = Array.isArray(candidate.dismissedTipIds)
      ? candidate.dismissedTipIds.filter((item): item is string => typeof item === "string")
      : [];

    const seenReleaseVersions = Array.isArray(candidate.seenReleaseVersions)
      ? candidate.seenReleaseVersions.filter((item): item is string => typeof item === "string")
      : [];

    const lastHelpCategory =
      typeof candidate.lastHelpCategory === "string" && candidate.lastHelpCategory.trim() !== ""
        ? candidate.lastHelpCategory.trim()
        : undefined;

    return {
      schemaVersion: 1,
      tourStatus,
      completedTourVersion,
      dismissedTipIds,
      seenReleaseVersions,
      lastHelpCategory,
    };
  } catch (error) {
    console.warn("Recovered from corrupted OpenWall guide state in localStorage", error);
    return createDefaultGuideState();
  }
}

/**
 * Load the current guide state from localStorage with safe recovery.
 */
export function loadGuideState(): GuideState {
  if (typeof window === "undefined") return createDefaultGuideState();

  try {
    const raw = window.localStorage.getItem(GUIDE_STORAGE_KEY);
    return parseGuideState(raw);
  } catch (error) {
    console.warn("Failed to read OpenWall guide state from localStorage", error);
    return createDefaultGuideState();
  }
}

/**
 * Save guide state to localStorage safely.
 */
export function saveGuideState(state: GuideState): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to write OpenWall guide state to localStorage", error);
  }
}

/**
 * Update guide state in place and persist it.
 */
export function updateGuideState(updater: (current: GuideState) => GuideState): GuideState {
  const current = loadGuideState();
  const next = updater(current);
  saveGuideState(next);
  return next;
}

/**
 * Dismiss the tour, optionally marking as dismissed so it won't prompt again.
 */
export function dismissTour(dontShowAgain = true): GuideState {
  return updateGuideState((current) => ({
    ...current,
    tourStatus: dontShowAgain ? "dismissed" : current.tourStatus,
  }));
}

/**
 * Mark the tour as completed and record the version completed.
 */
export function completeTour(version = CURRENT_TOUR_VERSION): GuideState {
  return updateGuideState((current) => ({
    ...current,
    tourStatus: "completed",
    completedTourVersion: version,
  }));
}

/**
 * Reset tour status to unseen so it can be restarted.
 */
export function restartTourState(): GuideState {
  return updateGuideState((current) => ({
    ...current,
    tourStatus: "unseen",
  }));
}

export interface StartTourEventDetail {
  stepIndex?: number;
  triggerElement?: HTMLElement | null;
}

/**
 * Shared/exported guide action to restart or launch the onboarding tour.
 * Enables triggering from anywhere in pass 1 and pass 2.
 */
export function requestGuideTour(detail?: StartTourEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<StartTourEventDetail>(GUIDE_EVENT_START_TOUR, {
      detail: detail ?? {},
    }),
  );
}

export const startGuideTour = requestGuideTour;
