"use client";

import { PageHeader } from "@/components/tab-bar";
import { consistency, quickRead, recentDays, surahStats, totals, type Tone } from "@/lib/analytics";
import { loadProgress, type Progress, type SessionLog } from "@/lib/storage";
import { surahs } from "@/lib/surahs";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";

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

// Numbers use DM Sans with tabular figures: Cormorant's old-style numerals read poorly at size.
const Num: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn("font-body font-semibold tabular-nums tracking-tight", className)}>{children}</span>
);

const Card: FC<{ title: string; subtitle?: string; children: ReactNode; className?: string }> = ({ title, subtitle, children, className }) => (
  <section className={cn("card-soft p-4", className)}>
    <h2 className="font-headline text-xl font-semibold leading-tight">{title}</h2>
    {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

const TONE: Record<Tone, string> = {
  good: "bg-[hsl(145_45%_40%/0.12)] text-[hsl(145_45%_30%)] dark:text-[hsl(145_45%_65%)] ring-[hsl(145_45%_40%/0.3)]",
  watch: "bg-accent text-primary ring-gold/40",
  flag: "bg-destructive/10 text-destructive ring-destructive/30",
};
const TONE_LABEL: Record<Tone, string> = { good: "GOOD", watch: "WATCH", flag: "FLAG" };

const HEAT = ["bg-muted", "bg-gold/30", "bg-gold/60", "bg-gold"];
const heatLevel = (plays: number) => (plays <= 0 ? 0 : plays < 10 ? 1 : plays < 30 ? 2 : 3);

export const ProgressView: FC<{ onRepeat: (s: SessionLog) => void; onPractice: (surahId: number, ayahs: number[]) => void }> = ({ onRepeat, onPractice }) => {
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => setProgress(loadProgress()), []);

  const data = useMemo(() => {
    if (!progress) return null;
    return {
      c: consistency(progress, 12),
      t: totals(progress),
      reads: quickRead(progress),
      days: recentDays(progress, 14),
      surahs: surahStats(progress),
    };
  }, [progress]);

  if (!progress || !data) return null;
  const { c, t, reads, days, surahs: stats } = data;
  const maxMin = Math.max(1, ...days.map((d) => d.minutes || d.plays / 6));

  if (t.plays === 0 && progress.sessions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Your journey" title="Progress" subtitle="Everything stays on this device." />
        <div className="card-soft p-6 text-center">
          <p className="font-headline text-2xl">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a session from Listen — every recitation you hear is counted here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
      <div className="md:col-span-2 pb-2">
        <PageHeader eyebrow="Your journey" title="Progress" subtitle="Everything stays on this device." />
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:col-span-2">
        {[
          { value: c.dayStreak, label: "day streak", sub: `best ${c.bestStreak}` },
          { value: t.plays.toLocaleString(), label: "recitations", sub: `${t.ayahs} different ayahs` },
          { value: t.minutes.toLocaleString(), label: "minutes", sub: "of recitation" },
          { value: c.activeDays, label: "active days", sub: `${c.thisMonth} this month` },
        ].map((s) => (
          <div key={s.label} className="card-soft p-4">
            <Num className="block text-3xl leading-none">{s.value}</Num>
            <div className="mt-1.5 text-sm font-medium">{s.label}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Read */}
      <Card title="Quick read" subtitle="Automatic notes on your habits and weak spots" className="md:col-span-2">
        <ul className="space-y-3">
          {reads.map((r, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1", TONE[r.tone])}>{TONE_LABEL[r.tone]}</span>
              <div>
                <div className="text-sm font-semibold">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Consistency */}
      <Card title="Consistency" subtitle={`Last ${c.weeks} weeks · darker = more recitations`}>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[
            { v: c.thisWeek, l: "days this week" },
            { v: c.thisMonth, l: "days this month" },
            { v: c.bestStreak, l: "best streak" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/60 p-2.5">
              <Num className="block text-xl">{x.v}</Num>
              <div className="text-[11px] text-muted-foreground">{x.l}</div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div className="mx-auto grid w-max grid-flow-col grid-rows-7 gap-[3px]">
            {c.heatmap.map((d) => (
              <div
                key={d.date}
                title={d.plays >= 0 ? `${new Date(d.date).toLocaleDateString()} · ${d.plays} recitations` : ""}
                className={cn("h-3 w-3 rounded-[3px]", d.plays < 0 ? "opacity-0" : HEAT[heatLevel(d.plays)])}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Last 14 days */}
      <Card title="Last 14 days" subtitle="Minutes of recitation per day">
        <div className="flex items-end gap-1.5">
          {days.map((d) => {
            const v = d.minutes || d.plays / 6;
            const today = d.date.toDateString() === new Date().toDateString();
            return (
              <div key={+d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date.toLocaleDateString()} · ${d.minutes} min · ${d.plays} recitations`}>
                <div className="flex h-28 w-full items-end">
                  <div
                    className={cn("w-full rounded-t-md", today ? "bg-primary" : "bg-gold/70", v === 0 && "bg-muted")}
                    style={{ height: v === 0 ? 3 : `${Math.max(6, (v / maxMin) * 100)}%` }}
                  />
                </div>
                <span className={cn("text-[10px] tabular-nums", today ? "font-bold text-primary" : "text-muted-foreground")}>
                  {d.date.toLocaleDateString([], { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <Num>{days.reduce((a, d) => a + d.minutes, 0)}</Num> min · <Num>{days.reduce((a, d) => a + d.plays, 0)}</Num> recitations in 14 days
        </p>
      </Card>

      {/* By surah */}
      {stats.length > 0 && (
        <Card title="By surah" subtitle="Coverage, most and least repeated ayahs" className="md:col-span-2">
          <div className="divide-y">
            {stats.map((s) => (
              <div key={s.surah.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-headline text-xl font-semibold">{s.surah.englishName}</span>
                  <span className="text-xs text-muted-foreground">
                    <Num>{s.plays}</Num> recitations
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${(s.heard / s.surah.totalAyahs) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <Num>{s.heard}</Num>/<Num>{s.surah.totalAyahs}</Num> ayahs
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Most: ayah <Num className="text-foreground">{s.most.ayah}</Num> (<Num>{s.most.plays}</Num>×)
                  </span>
                  <span>
                    Least: ayah <Num className="text-foreground">{s.least.ayah}</Num> (<Num>{s.least.plays}</Num>×)
                  </span>
                  {s.weak.length > 0 && (
                    <button onClick={() => onPractice(s.surah.id, s.weak)} className="font-semibold text-primary hover:underline">
                      Practise weakest →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent sessions */}
      {progress.sessions.length > 0 && (
        <Card title="Recent sessions" className="md:col-span-2">
          <div className="-mx-4 divide-y">
            {progress.sessions.slice(0, 10).map((s) => {
              const surah = surahs.find((x) => x.id === s.surahId);
              return (
                <button key={s.endedAt} onClick={() => onRepeat(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/60">
                  <span className="flex-1">
                    <span className="block font-medium">
                      {surah?.englishName} · <Num className="font-medium">{s.startAyah}{s.endAyah !== s.startAyah && `–${s.endAyah}`}</Num>
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
        </Card>
      )}
    </div>
  );
};
