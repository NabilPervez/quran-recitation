"use client";

import { PageHeader } from "@/components/tab-bar";
import { loadProgress, streak, type Progress, type SessionLog } from "@/lib/storage";
import { surahs } from "@/lib/surahs";
import { ChevronRight, Flame, Headphones, Repeat } from "lucide-react";
import { useEffect, useMemo, useState, type FC } from "react";

const fmtMins = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

const fmtDate = (t: number) => {
  const d = new Date(t);
  const diff = Math.floor((Date.now() - t) / 86400000);
  if (diff === 0) return `Today, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const ProgressView: FC<{ onRepeat: (s: SessionLog) => void }> = ({ onRepeat }) => {
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => setProgress(loadProgress()), []);

  const stats = useMemo(() => {
    if (!progress) return null;
    const bySurah = new Map<number, { plays: number; ayahs: number }>();
    for (const [key, n] of Object.entries(progress.ayahPlays)) {
      const id = Number(key.split(":")[0]);
      const cur = bySurah.get(id) ?? { plays: 0, ayahs: 0 };
      bySurah.set(id, { plays: cur.plays + n, ayahs: cur.ayahs + 1 });
    }
    return {
      totalPlays: Object.values(progress.ayahPlays).reduce((a, b) => a + b, 0),
      totalMs: progress.sessions.reduce((a, s) => a + s.listenedMs, 0),
      streak: streak(progress.days),
      surahs: [...bySurah.entries()]
        .map(([id, v]) => ({ surah: surahs.find((s) => s.id === id)!, ...v }))
        .filter((x) => x.surah)
        .sort((a, b) => b.plays - a.plays),
    };
  }, [progress]);

  if (!progress || !stats) return null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Your journey" title="Progress" subtitle="Everything stays on this device." />

      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: Flame, value: stats.streak, label: "day streak" },
          { Icon: Repeat, value: stats.totalPlays, label: "recitations" },
          { Icon: Headphones, value: Math.round(stats.totalMs / 60000), label: "minutes listened" },
        ].map(({ Icon, value, label }) => (
          <div key={label} className="card-soft p-4">
            <Icon className="h-4 w-4 text-gold" />
            <div className="mt-2 font-headline text-3xl font-semibold leading-none tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {stats.surahs.length === 0 && (
        <div className="card-soft p-6 text-center">
          <p className="font-headline text-2xl">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a session from Listen — every recitation you hear is counted here.</p>
        </div>
      )}

      {stats.surahs.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">By surah</h2>
          <div className="card-soft divide-y">
            {stats.surahs.map(({ surah, plays, ayahs }) => (
              <div key={surah.id} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-headline text-xl font-semibold">{surah.englishName}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{plays} recitations</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${(ayahs / surah.totalAyahs) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {ayahs}/{surah.totalAyahs} ayahs heard
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {progress.sessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">Recent sessions</h2>
          <div className="card-soft divide-y">
            {progress.sessions.slice(0, 15).map((s) => {
              const surah = surahs.find((x) => x.id === s.surahId);
              return (
                <button key={s.endedAt} onClick={() => onRepeat(s)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/60">
                  <span className="flex-1">
                    <span className="block font-medium">
                      {surah?.englishName} · {s.startAyah}
                      {s.endAyah !== s.startAyah && `–${s.endAyah}`}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {fmtDate(s.endedAt)} · {fmtMins(s.listenedMs)} · {s.plays} recitations
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-primary">Again</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
