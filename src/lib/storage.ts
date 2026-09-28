import { DEFAULT_FONT_SCALES, clampFontScale } from "@/lib/fonts";
import type { DisplayPrefs, SessionSettings } from "@/types";

export const DEFAULT_SETTINGS: SessionSettings = {
  surahId: 1,
  startAyah: 1,
  endAyah: 7,
  ayahReps: 3,
  rangeReps: 1,
  gapMs: 800,
};

export const DEFAULT_PREFS: DisplayPrefs = {
  showArabic: true,
  showTranslation: true,
  showTransliteration: false,
  blurArabic: false,
  blurTranslit: false,
  fontScales: DEFAULT_FONT_SCALES,
  theme: "light",
};

export type SavedPosition = { settings: SessionSettings; ayah: number; loop: number; savedAt: number };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const loadSettings = () => read("ae:settings", DEFAULT_SETTINGS);
export const saveSettings = (s: SessionSettings) => write("ae:settings", s);
export function loadPrefs(): DisplayPrefs {
  const p = read("ae:prefs", DEFAULT_PREFS) as DisplayPrefs & { testMode?: boolean };
  if (p.testMode) p.blurArabic = true; // migrate the old single "Test me" switch
  delete p.testMode;
  const f = { ...DEFAULT_FONT_SCALES, ...(p.fontScales ?? {}) };
  return {
    ...p,
    fontScales: { arabic: clampFontScale(f.arabic), translit: clampFontScale(f.translit), trans: clampFontScale(f.trans) },
  };
}
export const savePrefs = (p: DisplayPrefs) => write("ae:prefs", p);

export function loadPosition(): SavedPosition | null {
  try {
    const raw = localStorage.getItem("ae:position");
    return raw ? (JSON.parse(raw) as SavedPosition) : null;
  } catch {
    return null;
  }
}
export const savePosition = (p: SavedPosition) => write("ae:position", p);
export const clearPosition = () => {
  try {
    localStorage.removeItem("ae:position");
  } catch {}
};

// ---------- Progress ----------

export type SessionLog = {
  surahId: number;
  startAyah: number;
  endAyah: number;
  listenedMs: number;
  plays: number;
  endedAt: number;
};

export type Progress = {
  sessions: SessionLog[]; // newest first, capped
  ayahPlays: Record<string, number>; // "surah:ayah" -> times heard
  days: string[]; // YYYY-MM-DD with any listening, newest first
  dayPlays: Record<string, number>; // YYYY-MM-DD -> recitations heard
  dayMs: Record<string, number>; // YYYY-MM-DD -> ms of audio playing
  hourMs: number[]; // 24 buckets: when in the day you listen
};

const EMPTY_PROGRESS: Progress = { sessions: [], ayahPlays: {}, days: [], dayPlays: {}, dayMs: {}, hourMs: Array(24).fill(0) };

export const loadProgress = (): Progress => structuredClone(read("ae:progress", EMPTY_PROGRESS));

export const dateKey = (d: Date = new Date()) => d.toLocaleDateString("en-CA");
const today = () => dateKey();

const markDay = (p: Progress) => {
  if (p.days[0] !== today()) p.days = [today(), ...p.days].slice(0, 400);
};

export function recordPlay(surahId: number, ayah: number) {
  const p = loadProgress();
  const key = `${surahId}:${ayah}`;
  p.ayahPlays[key] = (p.ayahPlays[key] ?? 0) + 1;
  p.dayPlays[today()] = (p.dayPlays[today()] ?? 0) + 1;
  markDay(p);
  write("ae:progress", p);
}

/** Add listening time (called periodically while audio is playing). */
export function recordListening(ms: number) {
  if (ms <= 0) return;
  const p = loadProgress();
  p.dayMs[today()] = (p.dayMs[today()] ?? 0) + ms;
  if (p.hourMs.length !== 24) p.hourMs = Array(24).fill(0);
  p.hourMs[new Date().getHours()] += ms;
  markDay(p);
  write("ae:progress", p);
}

export function recordSession(log: SessionLog) {
  if (log.plays === 0 && log.listenedMs < 30_000) return;
  const p = loadProgress();
  p.sessions = [log, ...p.sessions].slice(0, 100);
  write("ae:progress", p);
}

/** Consecutive days (ending today or yesterday) with listening. */
export function streak(days: string[]) {
  if (!days.length) return 0;
  const d = new Date();
  let count = 0;
  const fmt = (x: Date) => x.toLocaleDateString("en-CA");
  if (days[0] !== fmt(d)) d.setDate(d.getDate() - 1);
  const set = new Set(days);
  while (set.has(fmt(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export const clearProgress = () => write("ae:progress", EMPTY_PROGRESS);
