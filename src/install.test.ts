import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OFFLINE_READY_STORAGE_KEY,
  detectInstallPlatform,
  getInstallInstructions,
  loadOfflineReadiness,
  rememberOfflineReadiness,
} from "./install";

const storageEntries = new Map<string, string>();
const testLocalStorage: Storage = {
  get length() {
    return storageEntries.size;
  },
  clear: () => storageEntries.clear(),
  getItem: (key) => storageEntries.get(key) ?? null,
  key: (index) => Array.from(storageEntries.keys())[index] ?? null,
  removeItem: (key) => storageEntries.delete(key),
  setItem: (key, value) => storageEntries.set(key, value),
};

Object.defineProperty(window, "localStorage", {
  value: testLocalStorage,
  configurable: true,
});

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("mobile install guidance", () => {
  it("detects iPhone and iPad browsers", () => {
    expect(detectInstallPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(
      "ios",
    );
    expect(detectInstallPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 5)).toBe("ios");
  });

  it("detects Android before falling back to desktop", () => {
    expect(detectInstallPlatform("Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit")).toBe(
      "android",
    );
    expect(detectInstallPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
  });

  it("provides three concrete installation steps for each platform", () => {
    for (const platform of ["ios", "android", "desktop"] as const) {
      const guidance = getInstallInstructions(platform);
      expect(guidance.platform).toBe(platform);
      expect(guidance.steps).toHaveLength(3);
      expect(guidance.steps.every(Boolean)).toBe(true);
    }
  });
});

describe("offline-readiness persistence", () => {
  it("remembers that app files became available offline", () => {
    expect(loadOfflineReadiness()).toBe(false);
    rememberOfflineReadiness();
    expect(window.localStorage.getItem(OFFLINE_READY_STORAGE_KEY)).toBe("true");
    expect(loadOfflineReadiness()).toBe(true);
  });

  it("fails safely when presentation-state storage is unavailable", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => rememberOfflineReadiness()).not.toThrow();
  });
});
