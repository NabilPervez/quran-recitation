export type AyahData = {
  surahNo: number;
  ayahNo: number;
  arabic1: string;
  english: string;
  audio: {
    "1": string; // Mishary Rashid Al Afasy
  };
  totalAyah: number;
  surahName: string;
  surahNameE: string;
};

export type SurahInfo = {
  id: number;
  name: string;
  englishName: string;
  totalAyahs: number;
};
