import type { Ayah } from "@/types";

const API = "https://api.alquran.cloud/v1";
// Same single surah-level request as Quran Memorization (Solo Hifz); audio URLs and
// mirrors come from the ar.alafasy edition as in Quran Reflection's fetchAyahAudio.
const EDITIONS = "ar.alafasy,quran-uthmani,en.transliteration,en.sahih";
export const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

// Used only if the API response has no audio URL.
const fallbackAudioUrl = (globalNumber: number) =>
  `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3`;

// Compare letters only: diacritics and alef forms vary between surahs in the API text.
const bare = (w: string) => w.replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا");

function stripBismillah(text: string) {
  const words = text.split(/\s+/);
  if (words.length > 4 && bare(words[0]) === "بسم" && bare(words[3]).startsWith("الرح")) return words.slice(4).join(" ");
  return text;
}

const cache = new Map<number, Promise<Ayah[]>>();

/** Fetch every ayah of a surah (text, translation, transliteration) in one request. */
export function fetchSurah(surahId: number): Promise<Ayah[]> {
  const hit = cache.get(surahId);
  if (hit) return hit;

  const request = (async () => {
    const key = `surah:v3:${surahId}`;
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) return JSON.parse(stored) as Ayah[];
    } catch {}

    const res = await fetch(`${API}/surah/${surahId}/editions/${EDITIONS}`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const json = await res.json();
    type Edition = { edition: { identifier: string }; ayahs: { number: number; numberInSurah: number; text: string; audio?: string; audioSecondary?: string[] }[] };
    const editions = json.data as Edition[];
    const pick = (id: string) => editions.find((e) => e.edition.identifier === id) ?? { ayahs: [] as Edition["ayahs"] };
    const audio = pick("ar.alafasy");
    const arabic = editions.find((e) => e.edition.identifier === "quran-uthmani") ?? audio;
    const translit = pick("en.transliteration");
    const english = pick("en.sahih");

    const ayahs: Ayah[] = arabic.ayahs.map((a, i) => {
      let text = a.text;
      // The API prefixes ayah 1 with the Bismillah for every surah except Al-Fatihah;
      // the recitation audio for that ayah does not include it.
      if (surahId !== 1 && a.numberInSurah === 1) text = stripBismillah(text);
      return {
        numberInSurah: a.numberInSurah,
        globalNumber: a.number,
        arabic: text,
        audio: [audio.ayahs[i]?.audio ?? fallbackAudioUrl(a.number), ...(audio.ayahs[i]?.audioSecondary ?? [])],
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

