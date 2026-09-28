// Reader font scaling — ported from Quran Reflection (src/lib/fonts.js).
// Each layer's size is a multiplier on top of the auto-fitted / responsive base size,
// so it stays sensible across phone, tablet and orientation.

export const FONT_SCALE_MIN = 0.8;
export const FONT_SCALE_MAX = 1.8;
export const FONT_SCALE_STEP = 0.1;

export type FontLayer = "arabic" | "translit" | "trans";
export type FontScales = Record<FontLayer, number>;

export const DEFAULT_FONT_SCALES: FontScales = { arabic: 1, translit: 1, trans: 1 };

export const FONT_LAYERS: { key: FontLayer; label: string }[] = [
  { key: "arabic", label: "Arabic" },
  { key: "translit", label: "Transliteration" },
  { key: "trans", label: "Translation" },
];

/** Clamp to the allowed range and round away float drift from repeated steps */
export function clampFontScale(v: number) {
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round(v * 100) / 100));
}
