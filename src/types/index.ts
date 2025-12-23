
export type AyahData = {
  arabic: string;
  indonesian: string;
  english?: string;
  englishSecondary?: string;
  transliteration?: string;
};

export type SurahInfo = {
  id: number;
  name: string;
  englishName: string;
  totalAyahs: number;
};
