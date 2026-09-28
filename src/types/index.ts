import type { FontScales } from "@/lib/fonts";

export type Ayah = {
  numberInSurah: number;
  globalNumber: number;
  /** Primary recitation URL followed by mirror URLs. */
  audio: string[];
  arabic: string;
  english: string;
  transliteration: string;
};

export type SurahInfo = {
  id: number;
  name: string;
  englishName: string;
  totalAyahs: number;
};

/** 0 means "loop forever". */
export type SessionSettings = {
  surahId: number;
  startAyah: number;
  endAyah: number;
  ayahReps: number;
  rangeReps: number;
  gapMs: number;
};

export type Theme = "light" | "sepia" | "dark";

export type DisplayPrefs = {
  showArabic: boolean;
  showTranslation: boolean;
  showTransliteration: boolean;
  /** "Test me": blur a layer until tapped. */
  blurArabic: boolean;
  blurTranslit: boolean;
  fontScales: FontScales;
  theme: Theme;
};
