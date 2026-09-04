import type {
  AppearancePreferences,
  BoardBackground,
  CardCornerStyle,
  ColorMode,
  ColorThemePreset,
  MotionPreference,
  TextScale,
} from "./types";

export const APPEARANCE_STORAGE_KEY = "openwall-appearance-v1";

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  schemaVersion: 1,
  colorTheme: "warm-cork",
  boardBackground: "classic-cork",
  cornerStyle: "natural",
  textScale: "default",
  colorMode: "system",
  motion: "full",
};

export const VALID_COLOR_THEMES: Set<ColorThemePreset> = new Set([
  "warm-cork",
  "sage-grove",
  "terracotta",
  "desert-sand",
  "ocean-mist",
  "wild-plum",
]);

export const VALID_BOARD_BACKGROUNDS: Set<BoardBackground> = new Set([
  "classic-cork",
  "fine-cork",
  "kraft-paper",
  "soft-linen",
  "minimal-canvas",
]);

export const VALID_CORNER_STYLES: Set<CardCornerStyle> = new Set([
  "sharp",
  "subtle",
  "natural",
  "rounded",
  "pill",
]);

export const VALID_TEXT_SCALES: Set<TextScale> = new Set([
  "compact",
  "default",
  "comfortable",
  "large",
]);

export const VALID_COLOR_MODES: Set<ColorMode> = new Set(["system", "light", "dark"]);

export const VALID_MOTION_PREFERENCES: Set<MotionPreference> = new Set(["full", "gentle", "off"]);

export interface ColorThemeOption {
  id: ColorThemePreset;
  name: string;
  description: string;
  primaryColor: string;
  surfaceColor: string;
  accentColor: string;
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: "warm-cork",
    name: "Warm Cork (Classic)",
    description: "Deep evergreen, warm amber, and golden cork paper",
    primaryColor: "#2f5d50",
    surfaceColor: "#f3efe6",
    accentColor: "#bd9169",
  },
  {
    id: "sage-grove",
    name: "Sage Grove",
    description: "Serene botanical sage, moss green, and soft herbal cream",
    primaryColor: "#386a54",
    surfaceColor: "#edf3ee",
    accentColor: "#a3c7b2",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Sun-baked earth, warm brick, and cozy parchment",
    primaryColor: "#8e4730",
    surfaceColor: "#f6eee8",
    accentColor: "#e69c84",
  },
  {
    id: "desert-sand",
    name: "Desert Sand",
    description: "Golden honey, warm wheat, and sunlit linen tones",
    primaryColor: "#7d5b1e",
    surfaceColor: "#f6f1e5",
    accentColor: "#d9b35b",
  },
  {
    id: "ocean-mist",
    name: "Ocean Mist",
    description: "Slate harbor teal, misty parchment, and coastal cool air",
    primaryColor: "#295e70",
    surfaceColor: "#ecf2f4",
    accentColor: "#88c4d6",
  },
  {
    id: "wild-plum",
    name: "Wild Plum",
    description: "Twilight heather, muted berry, and evening dusk paper",
    primaryColor: "#6c476c",
    surfaceColor: "#f4edf3",
    accentColor: "#cfa6ce",
  },
];

export interface BoardBackgroundOption {
  id: BoardBackground;
  name: string;
  description: string;
  frameColor: string;
  previewColor: string;
}

export const BOARD_BACKGROUNDS: BoardBackgroundOption[] = [
  {
    id: "classic-cork",
    name: "Classic Cork",
    description: "Rich granulated corkboard with dark walnut timber frame",
    frameColor: "#6d4b32",
    previewColor: "#bd9169",
  },
  {
    id: "fine-cork",
    name: "Fine Grain Cork",
    description: "Smooth honey-tan studio cork with light natural oak frame",
    frameColor: "#8c6643",
    previewColor: "#cca67c",
  },
  {
    id: "kraft-paper",
    name: "Warm Kraft Paper",
    description: "Earthy recycled paperboard with teak wood border",
    frameColor: "#59412e",
    previewColor: "#d6bfa3",
  },
  {
    id: "soft-linen",
    name: "Soft Linen Desk Mat",
    description: "Woven crosshatch linen surface with slate-olive frame",
    frameColor: "#444f47",
    previewColor: "#c9cfc6",
  },
  {
    id: "minimal-canvas",
    name: "Minimal Canvas",
    description: "Warm neutral artist canvas paper with slim dark timber border",
    frameColor: "#574c40",
    previewColor: "#ded8c7",
  },
];

export interface CornerStyleOption {
  id: CardCornerStyle;
  name: string;
  radiusDisplay: string;
  description: string;
}

export const CORNER_STYLES: CornerStyleOption[] = [
  { id: "sharp", name: "Sharp", radiusDisplay: "4px", description: "Crisp architectural corners" },
  { id: "subtle", name: "Subtle", radiusDisplay: "8px", description: "Slight gentle rounding" },
  {
    id: "natural",
    name: "Natural",
    radiusDisplay: "16px",
    description: "Warm signature OpenWall feel",
  },
  { id: "rounded", name: "Rounded", radiusDisplay: "24px", description: "Soft modern card curves" },
  {
    id: "pill",
    name: "Soft Pill",
    radiusDisplay: "32px",
    description: "Playful, friendly rounded corners",
  },
];

export interface TextScaleOption {
  id: TextScale;
  name: string;
  percentage: string;
  description: string;
}

export const TEXT_SCALES: TextScaleOption[] = [
  {
    id: "compact",
    name: "Compact",
    percentage: "92%",
    description: "Dense layout for smaller screens",
  },
  {
    id: "default",
    name: "Default",
    percentage: "100%",
    description: "Standard balanced proportions",
  },
  {
    id: "comfortable",
    name: "Comfortable",
    percentage: "108%",
    description: "Enhanced legibility from across the table",
  },
  {
    id: "large",
    name: "Large",
    percentage: "118%",
    description: "Big glanceable type for wall displays",
  },
];

export interface ColorModeOption {
  id: ColorMode;
  name: string;
  description: string;
}

export const COLOR_MODES: ColorModeOption[] = [
  { id: "system", name: "System", description: "Matches device daylight or dark mode" },
  { id: "light", name: "Light", description: "Always use warm daylight paper" },
  { id: "dark", name: "Dark", description: "Always use cozy evening corkboard" },
];

export interface MotionOption {
  id: MotionPreference;
  name: string;
  description: string;
}

export const MOTION_PREFERENCES: MotionOption[] = [
  {
    id: "full",
    name: "Full motion",
    description: "Fluid transitions for pages, cards, and countdowns",
  },
  {
    id: "gentle",
    name: "Gentle",
    description: "Soft fades with reduced movement and shorter duration",
  },
  {
    id: "off",
    name: "Off",
    description: "Instant changes; all animations and transitions disabled",
  },
];

/**
 * Safely parse a raw string or object into a validated AppearancePreferences.
 * Recovers gracefully from invalid JSON, missing keys, or unrecognized enum values.
 */
export function parseAppearancePreferences(raw: unknown): AppearancePreferences {
  if (raw === null || raw === undefined || raw === "") {
    return { ...DEFAULT_APPEARANCE };
  }

  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ...DEFAULT_APPEARANCE };
    }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ...DEFAULT_APPEARANCE };
  }

  const candidate = data as Record<string, unknown>;

  const colorTheme: ColorThemePreset =
    typeof candidate.colorTheme === "string" &&
    VALID_COLOR_THEMES.has(candidate.colorTheme as ColorThemePreset)
      ? (candidate.colorTheme as ColorThemePreset)
      : DEFAULT_APPEARANCE.colorTheme;

  const boardBackground: BoardBackground =
    typeof candidate.boardBackground === "string" &&
    VALID_BOARD_BACKGROUNDS.has(candidate.boardBackground as BoardBackground)
      ? (candidate.boardBackground as BoardBackground)
      : DEFAULT_APPEARANCE.boardBackground;

  const cornerStyle: CardCornerStyle =
    typeof candidate.cornerStyle === "string" &&
    VALID_CORNER_STYLES.has(candidate.cornerStyle as CardCornerStyle)
      ? (candidate.cornerStyle as CardCornerStyle)
      : DEFAULT_APPEARANCE.cornerStyle;

  const textScale: TextScale =
    typeof candidate.textScale === "string" &&
    VALID_TEXT_SCALES.has(candidate.textScale as TextScale)
      ? (candidate.textScale as TextScale)
      : DEFAULT_APPEARANCE.textScale;

  const colorMode: ColorMode =
    typeof candidate.colorMode === "string" &&
    VALID_COLOR_MODES.has(candidate.colorMode as ColorMode)
      ? (candidate.colorMode as ColorMode)
      : DEFAULT_APPEARANCE.colorMode;

  const motion: MotionPreference =
    typeof candidate.motion === "string" &&
    VALID_MOTION_PREFERENCES.has(candidate.motion as MotionPreference)
      ? (candidate.motion as MotionPreference)
      : DEFAULT_APPEARANCE.motion;

  return {
    schemaVersion: 1,
    colorTheme,
    boardBackground,
    cornerStyle,
    textScale,
    colorMode,
    motion,
  };
}

/**
 * Load device-local appearance preferences from localStorage with safe corrupted-state fallback.
 */
export function loadAppearancePreferences(): AppearancePreferences {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_APPEARANCE };
  }

  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return parseAppearancePreferences(raw);
  } catch (error) {
    console.warn("Recovered from corrupted OpenWall appearance preferences in localStorage", error);
    return { ...DEFAULT_APPEARANCE };
  }
}

/**
 * Save appearance preferences to localStorage safely.
 */
export function saveAppearancePreferences(preferences: AppearancePreferences): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn("Failed to persist OpenWall appearance preferences to localStorage", error);
  }
}

/**
 * Apply appearance preferences to the DOM via semantic attributes on document.documentElement.
 */
export function applyAppearanceToDOM(preferences: AppearancePreferences): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.setAttribute("data-color-theme", preferences.colorTheme);
  root.setAttribute("data-board-bg", preferences.boardBackground);
  root.setAttribute("data-corner-style", preferences.cornerStyle);
  root.setAttribute("data-text-scale", preferences.textScale);
  root.setAttribute("data-color-mode", preferences.colorMode);
  root.setAttribute("data-motion", preferences.motion);

  if (preferences.colorMode === "dark") {
    root.style.colorScheme = "dark";
  } else if (preferences.colorMode === "light") {
    root.style.colorScheme = "light";
  } else {
    root.style.colorScheme = "light dark";
  }
}
