import { useEffect, useState } from "react";
import type { BoardWidget, CountdownDisplayMode, CountdownWidgetConfig } from "./types";

export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = 60 * 1000;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;
export const FORTY_EIGHT_HOURS_MS = 48 * ONE_HOUR_MS;

export type CountdownPrecision = "seconds" | "minutes" | "days" | "none";

export interface CountdownDisplay {
  diffMs: number;
  isCompleted: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  primaryText: string;
  unitText?: string;
  subText: string;
  formattedTime: string;
  targetDateDisplay: string;
  finishedTimeDisplay?: string;
  completionMessage: string;
  screenReaderText: string;
  precision: CountdownPrecision;
  isUrgent: boolean;
}

export function formatTargetDate(date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timeZone || undefined,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
}

export function formatFinishedTime(date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timeZone || undefined,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
}

export function calculateCountdown(
  config: CountdownWidgetConfig,
  nowInput: Date | string | number = new Date(),
): CountdownDisplay {
  const targetDate = new Date(config.targetAt);
  const targetTime = targetDate.getTime();
  const now =
    typeof nowInput === "number"
      ? nowInput
      : typeof nowInput === "string"
        ? new Date(nowInput).getTime()
        : nowInput.getTime();

  const title = (config.title || "").trim() || "Countdown";
  const completionMessage = config.completionMessage?.trim() || "It’s time!";
  const rawDiff = targetTime - now;
  const isCompleted = isNaN(rawDiff) || rawDiff <= 0;
  const diffMs = isCompleted ? 0 : rawDiff;

  const targetDateDisplay = isNaN(targetTime) ? "" : formatTargetDate(targetDate, config.timezone);
  const finishedTimeDisplay = isNaN(targetTime)
    ? ""
    : formatFinishedTime(targetDate, config.timezone);

  if (isCompleted) {
    const primaryText = completionMessage;
    const subText = finishedTimeDisplay ? `Finished ${finishedTimeDisplay}` : "Finished";
    const screenReaderText = `${title}: Completed. ${completionMessage}. ${subText}.`;
    return {
      diffMs: 0,
      isCompleted: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      primaryText,
      unitText: undefined,
      subText,
      formattedTime: primaryText,
      targetDateDisplay,
      finishedTimeDisplay,
      completionMessage,
      screenReaderText,
      precision: "none",
      isUrgent: false,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(diffMs / ONE_MINUTE_MS);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(diffMs / ONE_HOUR_MS);
  const hours = totalHours % 24;
  const totalDays = Math.floor(diffMs / ONE_DAY_MS);
  const remainingDays = Math.ceil(diffMs / ONE_DAY_MS);
  const days = totalDays;

  const mode: CountdownDisplayMode = config.displayMode || "auto";

  if (mode === "auto") {
    if (diffMs > FORTY_EIGHT_HOURS_MS) {
      // More than 48 hours away: show large remaining days plus the target date
      const primaryText = String(remainingDays);
      const unitText = remainingDays === 1 ? "day" : "days";
      const subText = `until ${title}`;
      const formattedTime = `${remainingDays} ${unitText}`;
      const screenReaderText = `${title}: ${remainingDays} ${unitText} remaining until ${targetDateDisplay}`;
      return {
        diffMs,
        isCompleted: false,
        days: remainingDays,
        hours,
        minutes,
        seconds,
        primaryText,
        unitText,
        subText,
        formattedTime,
        targetDateDisplay,
        finishedTimeDisplay,
        completionMessage,
        screenReaderText,
        precision: "days",
        isUrgent: false,
      };
    }

    if (diffMs > ONE_HOUR_MS) {
      // Between 48 hours and one hour: show 1d 08h 24m
      const primaryText = `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
      const subText = `until ${title}`;
      const formattedTime = primaryText;
      const screenReaderText = `${title}: ${days} days, ${hours} hours, and ${minutes} minutes remaining`;
      return {
        diffMs,
        isCompleted: false,
        days,
        hours,
        minutes,
        seconds,
        primaryText,
        unitText: undefined,
        subText,
        formattedTime,
        targetDateDisplay,
        finishedTimeDisplay,
        completionMessage,
        screenReaderText,
        precision: "minutes",
        isUrgent: false,
      };
    }

    // Under one hour: show digital MM:SS minutes-and-seconds clock
    const clockMinutes = Math.floor(diffMs / ONE_MINUTE_MS);
    const clockSeconds = Math.floor((diffMs % ONE_MINUTE_MS) / 1000);
    const primaryText = `${String(clockMinutes).padStart(2, "0")}:${String(clockSeconds).padStart(2, "0")}`;
    const subText = `until ${title}`;
    const formattedTime = primaryText;
    const screenReaderText = `${title}: ${clockMinutes} minutes and ${clockSeconds} seconds remaining`;
    return {
      diffMs,
      isCompleted: false,
      days: 0,
      hours: 0,
      minutes: clockMinutes,
      seconds: clockSeconds,
      primaryText,
      unitText: undefined,
      subText,
      formattedTime,
      targetDateDisplay,
      finishedTimeDisplay,
      completionMessage,
      screenReaderText,
      precision: "seconds",
      isUrgent: true,
    };
  }

  if (mode === "days") {
    const primaryText = String(remainingDays);
    const unitText = remainingDays === 1 ? "day" : "days";
    const subText = `until ${title}`;
    const formattedTime = `${remainingDays} ${unitText}`;
    const screenReaderText = `${title}: ${remainingDays} ${unitText} remaining`;
    return {
      diffMs,
      isCompleted: false,
      days: remainingDays,
      hours,
      minutes,
      seconds,
      primaryText,
      unitText,
      subText,
      formattedTime,
      targetDateDisplay,
      finishedTimeDisplay,
      completionMessage,
      screenReaderText,
      precision: "days",
      isUrgent: false,
    };
  }

  // mode === "digital"
  let primaryText: string;
  if (totalHours === 0) {
    primaryText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  } else if (totalDays === 0) {
    primaryText = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  } else {
    primaryText = `${totalDays}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  const subText = `until ${title}`;
  const formattedTime = primaryText;
  const screenReaderText = `${title}: ${totalDays > 0 ? `${totalDays} days, ` : ""}${hours > 0 ? `${hours} hours, ` : ""}${minutes} minutes, ${seconds} seconds remaining`;
  return {
    diffMs,
    isCompleted: false,
    days,
    hours,
    minutes,
    seconds,
    primaryText,
    unitText: undefined,
    subText,
    formattedTime,
    targetDateDisplay,
    finishedTimeDisplay,
    completionMessage,
    screenReaderText,
    precision: "seconds",
    isUrgent: diffMs <= ONE_HOUR_MS,
  };
}

export function useCountdown(config: CountdownWidgetConfig): CountdownDisplay {
  const [now, setNow] = useState(() => new Date());

  const display = calculateCountdown(config, now);

  useEffect(() => {
    if (display.isCompleted) return;

    const intervalMs =
      display.precision === "seconds" ? 1000 : display.precision === "minutes" ? 15000 : 60000;

    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [display.isCompleted, display.precision]);

  return display;
}

export function getCountdownConfig(
  widget: BoardWidget,
  fallbackTimezone = "UTC",
): CountdownWidgetConfig {
  if (widget.countdown) {
    return {
      title: widget.countdown.title || "Countdown",
      targetAt: widget.countdown.targetAt || new Date(Date.now() + 12 * ONE_DAY_MS).toISOString(),
      displayMode: widget.countdown.displayMode || "auto",
      completionMessage: widget.countdown.completionMessage ?? "It’s time!",
      timezone: widget.countdown.timezone || fallbackTimezone,
    };
  }

  // Migrating from old decorative widget or top-level properties:
  let title = "";
  if (!title && widget.text) {
    const lines = widget.text.split("\n");
    title = lines
      .slice(1)
      .join(" ")
      .replace(/^until\s+/i, "")
      .trim();
  }
  if (!title) title = "Trip to the beach";

  return {
    title,
    targetAt: new Date(Date.now() + 12 * ONE_DAY_MS).toISOString(),
    displayMode: "auto",
    completionMessage: "It’s time!",
    timezone: fallbackTimezone,
  };
}

export function updateBoardWidgetWithCountdown(
  widget: BoardWidget,
  config: CountdownWidgetConfig,
): BoardWidget {
  return {
    ...widget,
    countdown: { ...config },
    text: undefined,
  };
}

export function createIsoInTimezone(dateStr: string, timeStr: string, timeZone?: string): string {
  if (!timeZone) {
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  }
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    const utcEstimate = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(utcEstimate));
    const getPart = (type: string) => {
      const val = parts.find((p) => p.type === type)?.value;
      return val ? parseInt(val, 10) : 0;
    };
    const tzYear = getPart("year");
    const tzMonth = getPart("month");
    const tzDay = getPart("day");
    let tzHour = getPart("hour");
    if (tzHour === 24) tzHour = 0;
    const tzMinute = getPart("minute");
    const tzSecond = getPart("second");
    const tzWallClock = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond);
    const diff = utcEstimate - tzWallClock;
    return new Date(utcEstimate + diff).toISOString();
  } catch {
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  }
}

export function parseIsoToPartsInTimezone(
  isoStr: string,
  timeZone?: string,
): { date: string; time: string } {
  try {
    const dateObj = new Date(isoStr);
    if (isNaN(dateObj.getTime())) {
      const now = new Date();
      return {
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
        time: "12:00",
      };
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(dateObj);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    let hour = value("hour");
    if (hour === "24") hour = "00";
    return {
      date: `${value("year")}-${value("month")}-${value("day")}`,
      time: `${hour}:${value("minute")}`,
    };
  } catch {
    // fallback to local
  }
  const d = new Date(isoStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${mins}` };
}
