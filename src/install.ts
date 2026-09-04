export type InstallPlatform = "ios" | "android" | "desktop";

export const OFFLINE_READY_STORAGE_KEY = "openwall-offline-ready-v1";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface InstallInstructions {
  platform: InstallPlatform;
  label: string;
  steps: string[];
}

export function detectInstallPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "desktop";
}

export function getInstallInstructions(platform: InstallPlatform): InstallInstructions {
  if (platform === "ios") {
    return {
      platform,
      label: "iPhone or iPad",
      steps: [
        "Open OpenWall in Safari.",
        "Tap Share, then choose Add to Home Screen.",
        "Tap Add. OpenWall will appear beside your other apps.",
      ],
    };
  }

  if (platform === "android") {
    return {
      platform,
      label: "Android phone or tablet",
      steps: [
        "Open OpenWall in Chrome.",
        "Open the browser menu and choose Install app or Add to Home screen.",
        "Confirm Install, then launch OpenWall from your home screen.",
      ],
    };
  }

  return {
    platform,
    label: "Computer or wall display",
    steps: [
      "Open OpenWall in Chrome or Edge.",
      "Use the install icon in the address bar, or choose Install OpenWall from the browser menu.",
      "Launch the installed app and use OpenWall’s full-screen control for a dedicated display.",
    ],
  };
}

export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigatorWithStandalone.standalone === true
  );
}

export function loadOfflineReadiness(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(OFFLINE_READY_STORAGE_KEY) === "true" ||
      window.navigator.serviceWorker?.controller != null
    );
  } catch {
    return window.navigator.serviceWorker?.controller != null;
  }
}

export function rememberOfflineReadiness(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFLINE_READY_STORAGE_KEY, "true");
  } catch {
    // The service worker may still work even when presentation state cannot be persisted.
  }
}
