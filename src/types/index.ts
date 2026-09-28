export type Ayah = {
  numberInSurah: number;
  globalNumber: number;
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
  showTranslation: boolean;
  showTransliteration: boolean;
  testMode: boolean;
  textScale: number;
  theme: Theme;
};
