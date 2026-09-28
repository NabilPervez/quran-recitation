// Listening analytics. Structure follows Lift Moar's src/lib/analytics.js
// (consistency heatmap + automatic "Quick Read" callouts), adapted to recitation data.

import { dateKey, type Progress } from "@/lib/storage";
import { surahs } from "@/lib/surahs";
import type { SurahInfo } from "@/types";

export type Tone = "good" | "watch" | "flag";
export type Read = { tone: Tone; title: string; detail: string };

const DAY = 86_400_000;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Every day that had listening, as a map of date -> { plays, ms }. */
function activity(p: Progress) {
  const map = new Map<string, { plays: number; ms: number }>();
  const touch = (k: string) => map.get(k) ?? { plays: 0, ms: 0 };
  for (const [k, n] of Object.entries(p.dayPlays ?? {})) map.set(k, { ...touch(k), plays: n });
  for (const [k, ms] of Object.entries(p.dayMs ?? {})) map.set(k, { ...touch(k), ms });
  // Older data (before per-day tracking) only has session logs and day markers.
  for (const s of p.sessions) {
    const k = dateKey(new Date(s.endedAt));
    if (!p.dayMs?.[k] && !p.dayPlays?.[k]) {
      const cur = touch(k);
      map.set(k, { plays: cur.plays + s.plays, ms: cur.ms + s.listenedMs });
    }
  }
  for (const k of p.days) if (!map.has(k)) map.set(k, { plays: 1, ms: 0 });
  return map;
}

export function consistency(p: Progress, weeks = 12) {
  const act = activity(p);
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const active = (d: Date) => act.has(dateKey(d));

  let thisWeek = 0;
  let thisMonth = 0;
  for (const k of act.keys()) {
    const d = new Date(`${k}T12:00:00`);
    if (d >= weekStart) thisWeek++;
    if (d >= monthStart) thisMonth++;
  }

  // Day streak: consecutive days ending today (or yesterday — today isn't over yet).
  let dayStreak = 0;
  let cursor = new Date(now);
  if (!active(cursor)) cursor = addDays(cursor, -1);
  while (active(cursor)) {
    dayStreak++;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  const sorted = [...act.keys()].sort();
  for (let i = 0; i < sorted.length; i++) {
    const prev = i && new Date(`${sorted[i - 1]}T12:00:00`);
    const cur = new Date(`${sorted[i]}T12:00:00`);
    run = prev && Math.round((+cur - +prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const gridStart = addDays(weekStart, -7 * (weeks - 1));
  const heatmap = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = addDays(gridStart, i);
    const a = act.get(dateKey(d));
    return { date: +d, plays: d > now ? -1 : a?.plays ?? 0, ms: a?.ms ?? 0 };
  });

  return { thisWeek, thisMonth, dayStreak, bestStreak: best, activeDays: act.size, heatmap, weeks };
}

/** Last `n` days of minutes and recitations, oldest first. */
export function recentDays(p: Progress, n = 14) {
  const act = activity(p);
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(today, i - (n - 1));
    const a = act.get(dateKey(d));
    return { date: d, minutes: Math.round((a?.ms ?? 0) / 60000), plays: a?.plays ?? 0 };
  });
}

function sumRange(p: Progress, fromDaysAgo: number, toDaysAgo: number) {
  const act = activity(p);
  let ms = 0;
  let plays = 0;
  for (let i = toDaysAgo; i < fromDaysAgo; i++) {
    const a = act.get(dateKey(addDays(new Date(), -i)));
    ms += a?.ms ?? 0;
    plays += a?.plays ?? 0;
  }
  return { ms, plays };
}

export function totals(p: Progress) {
  const act = activity(p);
  let ms = 0;
  for (const a of act.values()) ms += a.ms;
  const plays = Object.values(p.ayahPlays).reduce((a, b) => a + b, 0);
  const ayahs = Object.keys(p.ayahPlays).length;
  return { minutes: Math.round(ms / 60000), plays, ayahs };
}

export type SurahStat = {
  surah: SurahInfo;
  plays: number;
  heard: number;
  most: { ayah: number; plays: number };
  least: { ayah: number; plays: number };
  weak: number[]; // heard far less than the rest
};

export function surahStats(p: Progress): SurahStat[] {
  const by = new Map<number, Map<number, number>>();
  for (const [key, n] of Object.entries(p.ayahPlays)) {
    const [s, a] = key.split(":").map(Number);
    if (!by.has(s)) by.set(s, new Map());
    by.get(s)!.set(a, n);
  }
  const out: SurahStat[] = [];
  for (const [id, ayahs] of by) {
    const surah = surahs.find((s) => s.id === id);
    if (!surah) continue;
    const entries = [...ayahs.entries()].sort((a, b) => a[0] - b[0]);
    const counts = entries.map(([, n]) => n).sort((a, b) => a - b);
    const median = counts[Math.floor(counts.length / 2)];
    const most = entries.reduce((m, e) => (e[1] > m[1] ? e : m));
    const least = entries.reduce((m, e) => (e[1] < m[1] ? e : m));
    out.push({
      surah,
      plays: counts.reduce((a, b) => a + b, 0),
      heard: entries.length,
      most: { ayah: most[0], plays: most[1] },
      least: { ayah: least[0], plays: least[1] },
      weak: entries.filter(([, n]) => n <= median / 2).map(([a]) => a),
    });
  }
  return out.sort((a, b) => b.plays - a.plays);
}

const HOUR_LABEL = (h: number) =>
  h < 5 ? "late at night" : h < 9 ? "around Fajr and early morning" : h < 12 ? "in the morning" : h < 17 ? "in the afternoon" : h < 21 ? "in the evening" : "at night";

/** Automatic callouts, like Lift Moar's Quick Read. */
export function quickRead(p: Progress): Read[] {
  const c = consistency(p);
  const items: Read[] = [];
  const t = totals(p);

  if (t.plays < 5) {
    return [{ tone: "watch", title: "Not enough data yet", detail: "Listen to a few more recitations to unlock trends." }];
  }

  // Streak
  const lastActive = [...activity(p).keys()].sort().pop();
  const daysSince = lastActive ? Math.round((+new Date(dateKey()) - +new Date(lastActive)) / DAY) : 99;
  if (daysSince >= 3) {
    items.push({ tone: "flag", title: `${daysSince} days since you last listened`, detail: "Even one short ayah today restarts the habit." });
  } else if (daysSince === 1 && c.dayStreak > 0) {
    items.push({ tone: "watch", title: `Keep your ${c.dayStreak}-day streak`, detail: "You haven't listened yet today." });
  } else if (c.dayStreak >= 3) {
    items.push({ tone: "good", title: `${c.dayStreak}-day streak`, detail: c.dayStreak >= c.bestStreak ? "Your best run yet — keep it going." : `Your best is ${c.bestStreak} days.` });
  }

  // This week vs last week
  const thisWk = sumRange(p, 7, 0);
  const lastWk = sumRange(p, 14, 7);
  const metric = (x: { ms: number; plays: number }) => x.ms || x.plays * 8000;
  if (metric(lastWk) > 0) {
    const change = (metric(thisWk) - metric(lastWk)) / metric(lastWk);
    if (change >= 0.1) items.push({ tone: "good", title: `Listening up ${Math.round(change * 100)}%`, detail: "Last 7 days compared with the 7 before." });
    else if (change <= -0.25) items.push({ tone: "flag", title: `Listening down ${Math.round(-change * 100)}%`, detail: "Last 7 days compared with the 7 before." });
    else items.push({ tone: "watch", title: "Steady week", detail: "About the same listening as the week before." });
  }

  // Ayahs that need more repetition, in the surah you're working on
  const stats = surahStats(p);
  const current = p.sessions[0] ? stats.find((s) => s.surah.id === p.sessions[0].surahId) : stats[0];
  if (current && current.weak.length && current.heard >= 3) {
    const list = current.weak.slice(0, 5).map((a) => `${current.surah.id}:${a}`).join(", ");
    items.push({ tone: "watch", title: `Give ${current.weak.length === 1 ? "this ayah" : "these ayahs"} more repetition`, detail: `${current.surah.englishName}: ${list}${current.weak.length > 5 ? "…" : ""}` });
  }

  // Coverage milestones
  for (const s of stats) {
    const pct = s.heard / s.surah.totalAyahs;
    if (pct >= 1) items.push({ tone: "good", title: `Heard all of ${s.surah.englishName}`, detail: `${s.plays} recitations across ${s.surah.totalAyahs} ayahs.` });
    else if (pct >= 0.75) items.push({ tone: "good", title: `Almost through ${s.surah.englishName}`, detail: `${s.surah.totalAyahs - s.heard} ayahs still to hear.` });
  }

  // When you listen
  const hours = p.hourMs ?? [];
  const totalH = hours.reduce((a, b) => a + b, 0);
  if (totalH > 5 * 60000) {
    const peak = hours.indexOf(Math.max(...hours));
    items.push({ tone: "good", title: `You listen most ${HOUR_LABEL(peak)}`, detail: "A fixed time each day makes the habit stick." });
  }

  return items.slice(0, 6);
}
