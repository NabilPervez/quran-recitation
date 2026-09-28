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
  showTranslation: true,
  showTransliteration: false,
  testMode: false,
  textScale: 1,
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
export const loadPrefs = () => read("ae:prefs", DEFAULT_PREFS);
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
