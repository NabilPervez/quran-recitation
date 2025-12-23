
export type AyahData = {
  arabic: string;
  indonesian: string;
  english?: string;
  transliteration?: string;
};

export type SurahInfo = {
  id: number;
  name: string;
  englishName: string;
  totalAyahs: number;
};
