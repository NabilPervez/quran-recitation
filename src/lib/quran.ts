import type { Ayah } from "@/types";

const API = "https://api.alquran.cloud/v1";
const EDITIONS = "quran-uthmani,en.sahih,en.transliteration";
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

// Global ayah number -> Mishary Alafasy recitation.
export const audioUrl = (globalNumber: number) =>
  `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3`;

const cache = new Map<number, Promise<Ayah[]>>();

/** Fetch every ayah of a surah (text, translation, transliteration) in one request. */
export function fetchSurah(surahId: number): Promise<Ayah[]> {
  const hit = cache.get(surahId);
  if (hit) return hit;

  const request = (async () => {
    const key = `surah:${surahId}`;
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) return JSON.parse(stored) as Ayah[];
    } catch {}

    const res = await fetch(`${API}/surah/${surahId}/editions/${EDITIONS}`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const json = await res.json();
    const [arabic, english, translit] = json.data as { ayahs: { number: number; numberInSurah: number; text: string }[] }[];

    const ayahs: Ayah[] = arabic.ayahs.map((a, i) => {
      let text = a.text;
      // The API prefixes ayah 1 with the Bismillah for every surah except Al-Fatihah;
      // the recitation audio for that ayah does not include it.
      if (surahId !== 1 && a.numberInSurah === 1 && text.startsWith(BISMILLAH)) {
        text = text.slice(BISMILLAH.length).trim();
      }
      return {
        numberInSurah: a.numberInSurah,
        globalNumber: a.number,
        arabic: text,
        english: english.ayahs[i]?.text ?? "",
        transliteration: translit.ayahs[i]?.text ?? "",
      };
    });

    try {
      sessionStorage.setItem(key, JSON.stringify(ayahs));
    } catch {}
    return ayahs;
  })();

  cache.set(surahId, request);
  request.catch(() => cache.delete(surahId));
  return request;
}

export { BISMILLAH };
