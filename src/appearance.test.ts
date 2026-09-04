import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearanceToDOM,
  loadAppearancePreferences,
  parseAppearancePreferences,
  saveAppearancePreferences,
} from "./appearance";
import type { AppearancePreferences } from "./types";

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

describe("appearance preference parsing & fallback", () => {
  it("returns default preferences for null, undefined, or empty string", () => {
    expect(parseAppearancePreferences(null)).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearancePreferences(undefined)).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearancePreferences("")).toEqual(DEFAULT_APPEARANCE);
  });

  it("safely recovers from corrupted or invalid JSON string without throwing", () => {
    expect(parseAppearancePreferences("{ not valid json !!! }")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearancePreferences("42")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearancePreferences("true")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearancePreferences("[]")).toEqual(DEFAULT_APPEARANCE);
  });

  it("parses valid full appearance preferences correctly", () => {
    const valid: AppearancePreferences = {
      schemaVersion: 1,
      colorTheme: "terracotta",
      boardBackground: "kraft-paper",
      cornerStyle: "rounded",
      textScale: "large",
      colorMode: "dark",
      motion: "gentle",
    };

    expect(parseAppearancePreferences(JSON.stringify(valid))).toEqual(valid);
    expect(parseAppearancePreferences(valid)).toEqual(valid);
  });

  it("recovers gracefully from unrecognized or partial enum values", () => {
    const corrupted = {
      schemaVersion: 1,
      colorTheme: "neon-cyberpunk", // invalid
      boardBackground: "kraft-paper", // valid
      cornerStyle: 999, // invalid type
      textScale: "compact", // valid
      colorMode: "sepia", // invalid
      motion: "off", // valid
    };

    const parsed = parseAppearancePreferences(JSON.stringify(corrupted));
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.colorTheme).toBe(DEFAULT_APPEARANCE.colorTheme); // fallback
    expect(parsed.boardBackground).toBe("kraft-paper"); // preserved
    expect(parsed.cornerStyle).toBe(DEFAULT_APPEARANCE.cornerStyle); // fallback
    expect(parsed.textScale).toBe("compact"); // preserved
    expect(parsed.colorMode).toBe(DEFAULT_APPEARANCE.colorMode); // fallback
    expect(parsed.motion).toBe("off"); // preserved
  });

  it("fills missing fields with safe default values", () => {
    const partial = {
      colorTheme: "sage-grove",
    };

    const parsed = parseAppearancePreferences(partial);
    expect(parsed).toEqual({
      ...DEFAULT_APPEARANCE,
      colorTheme: "sage-grove",
    });
  });
});

describe("appearance localStorage persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves preferences to localStorage under the device-local key", () => {
    const prefs: AppearancePreferences = {
      schemaVersion: 1,
      colorTheme: "ocean-mist",
      boardBackground: "soft-linen",
      cornerStyle: "subtle",
      textScale: "comfortable",
      colorMode: "light",
      motion: "off",
    };

    saveAppearancePreferences(prefs);
    const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(prefs);
  });

  it("loads stored preferences correctly from localStorage", () => {
    const prefs: AppearancePreferences = {
      schemaVersion: 1,
      colorTheme: "wild-plum",
      boardBackground: "minimal-canvas",
      cornerStyle: "pill",
      textScale: "compact",
      colorMode: "dark",
      motion: "gentle",
    };

    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs));
    expect(loadAppearancePreferences()).toEqual(prefs);
  });

  it("recovers with default preferences if localStorage content is corrupted", () => {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, "{corrupted data...");
    expect(loadAppearancePreferences()).toEqual(DEFAULT_APPEARANCE);
  });

  it("handles localStorage read exceptions gracefully without crashing", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access is denied for this document");
    });

    expect(loadAppearancePreferences()).toEqual(DEFAULT_APPEARANCE);
  });

  it("handles localStorage write exceptions gracefully without crashing", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    // Should not throw
    expect(() => saveAppearancePreferences(DEFAULT_APPEARANCE)).not.toThrow();
  });
});

describe("applyAppearanceToDOM", () => {
  it("sets semantic data attributes and color-scheme on documentElement", () => {
    const prefs: AppearancePreferences = {
      schemaVersion: 1,
      colorTheme: "desert-sand",
      boardBackground: "fine-cork",
      cornerStyle: "sharp",
      textScale: "comfortable",
      colorMode: "dark",
      motion: "gentle",
    };

    applyAppearanceToDOM(prefs);
    const root = document.documentElement;

    expect(root.getAttribute("data-color-theme")).toBe("desert-sand");
    expect(root.getAttribute("data-board-bg")).toBe("fine-cork");
    expect(root.getAttribute("data-corner-style")).toBe("sharp");
    expect(root.getAttribute("data-text-scale")).toBe("comfortable");
    expect(root.getAttribute("data-color-mode")).toBe("dark");
    expect(root.getAttribute("data-motion")).toBe("gentle");
    expect(root.style.colorScheme).toBe("dark");
  });
});
