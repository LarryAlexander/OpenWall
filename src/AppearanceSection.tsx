import {
  Check,
  EyeOff,
  Feather,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  Type,
} from "lucide-react";
import {
  BOARD_BACKGROUNDS,
  COLOR_MODES,
  COLOR_THEMES,
  CORNER_STYLES,
  DEFAULT_APPEARANCE,
  MOTION_PREFERENCES,
  TEXT_SCALES,
} from "./appearance";
import type {
  AppearancePreferences,
  BoardBackground,
  CardCornerStyle,
  ColorMode,
  ColorThemePreset,
  MotionPreference,
  TextScale,
} from "./types";

interface AppearanceSectionProps {
  preferences: AppearancePreferences;
  onChange: (next: AppearancePreferences) => void;
  onReset?: () => void;
}

export function AppearanceSection({ preferences, onChange, onReset }: AppearanceSectionProps) {
  const update = <K extends keyof AppearancePreferences>(
    key: K,
    value: AppearancePreferences[K],
  ) => {
    onChange({ ...preferences, [key]: value });
  };

  const isModified =
    preferences.colorTheme !== DEFAULT_APPEARANCE.colorTheme ||
    preferences.boardBackground !== DEFAULT_APPEARANCE.boardBackground ||
    preferences.cornerStyle !== DEFAULT_APPEARANCE.cornerStyle ||
    preferences.textScale !== DEFAULT_APPEARANCE.textScale ||
    preferences.colorMode !== DEFAULT_APPEARANCE.colorMode ||
    preferences.motion !== DEFAULT_APPEARANCE.motion;

  return (
    <section className="appearance-section" aria-labelledby="appearance-section-title">
      <div className="appearance-section-header">
        <div className="appearance-icon-lead">
          <Palette aria-hidden="true" />
        </div>
        <div className="appearance-title-group">
          <p className="eyebrow">Personalization</p>
          <h2 id="appearance-section-title">Appearance & board display</h2>
          <p>
            Customized for this device. Preferences stay in this browser and are not shared in
            household backups.
          </p>
        </div>
        <div className="appearance-header-actions">
          <span className="local-pill">
            <Palette aria-hidden="true" /> Device only
          </span>
          {isModified && (
            <button
              type="button"
              className="appearance-reset-btn"
              onClick={onReset ?? (() => onChange(DEFAULT_APPEARANCE))}
              title="Reset appearance to defaults"
            >
              <RotateCcw aria-hidden="true" /> Reset defaults
            </button>
          )}
        </div>
      </div>

      {/* 1. Light / Dark / System Mode */}
      <div className="appearance-group">
        <div className="appearance-group-label">
          <h3>Display mode</h3>
          <p>Follow your device’s daylight theme or lock OpenWall to light or dark mode.</p>
        </div>
        <div className="appearance-segmented-mode" role="radiogroup" aria-label="Display mode">
          {COLOR_MODES.map((mode) => {
            const isSelected = preferences.colorMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`appearance-mode-card ${isSelected ? "selected" : ""}`}
                onClick={() => update("colorMode", mode.id as ColorMode)}
              >
                <div className="mode-card-icon">
                  {mode.id === "system" ? (
                    <Monitor aria-hidden="true" />
                  ) : mode.id === "light" ? (
                    <Sun aria-hidden="true" />
                  ) : (
                    <Moon aria-hidden="true" />
                  )}
                </div>
                <div className="mode-card-copy">
                  <strong>{mode.name}</strong>
                  <small>{mode.description}</small>
                </div>
                {isSelected && (
                  <span className="mode-check-badge">
                    <Check aria-hidden="true" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Color Theme Presets */}
      <div className="appearance-group">
        <div className="appearance-group-label">
          <h3>Color theme preset</h3>
          <p>Warm palettes inspired by natural paper, earthenware, and home materials.</p>
        </div>
        <div className="appearance-preset-grid" role="radiogroup" aria-label="Color theme preset">
          {COLOR_THEMES.map((theme) => {
            const isSelected = preferences.colorTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`appearance-theme-card ${isSelected ? "selected" : ""}`}
                onClick={() => update("colorTheme", theme.id as ColorThemePreset)}
              >
                <div className="theme-swatch-box">
                  <span
                    className="theme-primary-swatch"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span
                    className="theme-surface-swatch"
                    style={{ backgroundColor: theme.surfaceColor }}
                  />
                  <span
                    className="theme-accent-swatch"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
                <div className="theme-card-info">
                  <div className="theme-name-row">
                    <strong>{theme.name}</strong>
                    {isSelected && (
                      <span className="theme-selected-pill">
                        <Check aria-hidden="true" /> Active
                      </span>
                    )}
                  </div>
                  <small>{theme.description}</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cork / Board Background Choices */}
      <div className="appearance-group">
        <div className="appearance-group-label">
          <h3>Corkboard surface</h3>
          <p>Choose the backdrop texture and wood frame style for your family board.</p>
        </div>
        <div
          className="appearance-board-grid"
          role="radiogroup"
          aria-label="Corkboard surface background"
        >
          {BOARD_BACKGROUNDS.map((board) => {
            const isSelected = preferences.boardBackground === board.id;
            return (
              <button
                key={board.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`appearance-board-card ${isSelected ? "selected" : ""}`}
                onClick={() => update("boardBackground", board.id as BoardBackground)}
              >
                <div
                  className={`board-preview-frame board-bg-${board.id}`}
                  style={{
                    borderColor: board.frameColor,
                    backgroundColor: board.previewColor,
                  }}
                >
                  <div className="board-preview-mini-card" />
                </div>
                <div className="board-card-info">
                  <div className="board-name-row">
                    <strong>{board.name}</strong>
                    {isSelected && (
                      <span className="theme-selected-pill">
                        <Check aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <small>{board.description}</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Card Corner Style & Text Scale (Side-by-side or stacked) */}
      <div className="appearance-dual-row">
        {/* Card Corner Style */}
        <div className="appearance-group appearance-half">
          <div className="appearance-group-label">
            <h3>Card corners</h3>
            <p>Corner rounding applied across cards, notes, and countdowns.</p>
          </div>
          <div className="appearance-corners-row" role="radiogroup" aria-label="Card corner style">
            {CORNER_STYLES.map((corner) => {
              const isSelected = preferences.cornerStyle === corner.id;
              return (
                <button
                  key={corner.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`appearance-corner-chip ${isSelected ? "selected" : ""}`}
                  onClick={() => update("cornerStyle", corner.id as CardCornerStyle)}
                  title={`${corner.name} (${corner.radiusDisplay}): ${corner.description}`}
                >
                  <span
                    className={`corner-preview-box corner-shape-${corner.id}`}
                    aria-hidden="true"
                  />
                  <span className="corner-chip-name">{corner.name}</span>
                  <small className="corner-chip-dim">{corner.radiusDisplay}</small>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Scale */}
        <div className="appearance-group appearance-half">
          <div className="appearance-group-label">
            <h3>Text scale</h3>
            <p>Size adjustment for glanceable viewing across the kitchen or room.</p>
          </div>
          <div className="appearance-scale-row" role="radiogroup" aria-label="Text scale">
            {TEXT_SCALES.map((scale) => {
              const isSelected = preferences.textScale === scale.id;
              return (
                <button
                  key={scale.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`appearance-scale-chip ${isSelected ? "selected" : ""}`}
                  onClick={() => update("textScale", scale.id as TextScale)}
                  title={`${scale.name} (${scale.percentage}): ${scale.description}`}
                >
                  <Type className={`scale-icon-${scale.id}`} aria-hidden="true" />
                  <span className="scale-chip-name">{scale.name}</span>
                  <small className="scale-chip-pct">{scale.percentage}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Motion & Transitions */}
      <div className="appearance-group">
        <div className="appearance-group-label">
          <h3>Motion & transitions</h3>
          <p>
            Controls page navigation, card entry, dialog popups, and countdown digit ticking. Your
            operating system’s reduced-motion preference is always honored.
          </p>
        </div>
        <div className="appearance-motion-row" role="radiogroup" aria-label="Motion preference">
          {MOTION_PREFERENCES.map((motion) => {
            const isSelected = preferences.motion === motion.id;
            return (
              <button
                key={motion.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`appearance-motion-card ${isSelected ? "selected" : ""}`}
                onClick={() => update("motion", motion.id as MotionPreference)}
              >
                <div className="motion-icon-badge">
                  {motion.id === "full" ? (
                    <Sparkles aria-hidden="true" />
                  ) : motion.id === "gentle" ? (
                    <Feather aria-hidden="true" />
                  ) : (
                    <EyeOff aria-hidden="true" />
                  )}
                </div>
                <div className="motion-copy">
                  <div className="motion-title-row">
                    <strong>{motion.name}</strong>
                    {isSelected && (
                      <span className="theme-selected-pill">
                        <Check aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <small>{motion.description}</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
