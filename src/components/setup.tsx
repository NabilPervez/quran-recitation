"use client";

import { RepetitionOptions } from "@/components/session-options";
import { PageHeader } from "@/components/tab-bar";
import { surahs } from "@/lib/surahs";
import type { SavedPosition } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { SessionSettings } from "@/types";
import { Loader2, Play, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FC } from "react";

type Props = {
  settings: SessionSettings;
  resume: SavedPosition | null;
  loading: boolean;
  onSettingsChange: (patch: Partial<SessionSettings>) => void;
  onStart: () => void;
  onResume: (p: SavedPosition) => void;
};

export const Setup: FC<Props> = ({ settings, resume, loading, onSettingsChange, onStart, onResume }) => {
  const surah = surahs.find((s) => s.id === settings.surahId)!;
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const norm = (x: string) => x.toLowerCase().replace(/[-' ]/g, "");
    const q = norm(query.trim());
    if (!q) return surahs;
    return surahs.filter((s) => String(s.id) === q || norm(s.englishName).includes(q) || s.name.includes(query.trim()));
  }, [query]);

  // Keep the selected surah in view (also after saved settings load).
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (query || !list || !el) return;
    if (el.offsetTop < list.scrollTop || el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2;
    }
  }, [settings.surahId, query]);

  const resumeSurah = resume && surahs.find((s) => s.id === resume.settings.surahId);

  return (
    <>
      <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-8 land:grid land:grid-cols-2">
        <div className="md:col-span-2 land:col-span-2">
          <PageHeader eyebrow="Ayah Echo · Hifz" title="Listen & repeat" subtitle="Choose a surah and how many times to hear each ayah." />
        </div>

        {resume && resumeSurah && (
          <button
            onClick={() => onResume(resume)}
            className="card-soft md:col-span-2 land:col-span-2 flex items-center gap-4 border-gold/50 p-4 text-left hover:bg-accent/60"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Play className="h-5 w-5 translate-x-px fill-current" />
            </span>
            <span className="flex-1">
              <span className="eyebrow block">Continue</span>
              <span className="block font-headline text-2xl font-semibold leading-tight">{resumeSurah.englishName}</span>
              <span className="block text-sm text-muted-foreground">
                Ayah {resume.ayah} · range {resume.settings.startAyah}–{resume.settings.endAyah}
              </span>
            </span>
          </button>
        )}

        {/* Surah picker */}
        <section className="card-soft flex min-h-0 flex-col overflow-hidden">
          <label className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search surah by name or number"
              className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              aria-label="Search surah"
            />
          </label>
          <div ref={listRef} role="listbox" aria-label="Surah" className="relative h-[38dvh] overflow-y-auto p-1.5 md:h-[58dvh] land:h-[62dvh]">
            {filtered.map((s) => {
              const selected = s.id === settings.surahId;
              return (
                <button
                  key={s.id}
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSettingsChange({ surahId: s.id, startAyah: 1, endAyah: s.totalAyahs })}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    selected ? "bg-accent ring-1 ring-gold/60" : "hover:bg-accent/60",
                  )}
                >
                  <span className={cn("w-8 text-center text-xs tabular-nums", selected ? "text-primary font-semibold" : "text-muted-foreground")}>{s.id}</span>
                  <span className="flex-1">
                    <span className="block font-headline text-xl font-semibold leading-tight">{s.englishName}</span>
                    <span className="block text-xs text-muted-foreground">{s.totalAyahs} ayahs</span>
                  </span>
                  <span className="arabic text-xl leading-none" lang="ar">
                    {s.name}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground">No surah matches “{query}”.</p>}
          </div>
        </section>

        {/* Options */}
        <section className="card-soft p-5">
          <p className="eyebrow">Surah {surah.id}</p>
          <h2 className="mb-5 mt-1 flex items-baseline justify-between gap-3 font-headline text-3xl font-semibold">
            {surah.englishName}
            <span className="arabic text-2xl font-normal">{surah.name}</span>
          </h2>
          <RepetitionOptions surah={surah} settings={settings} onChange={onSettingsChange} />
        </section>
      </div>

      {/* Start button, sits above the tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4 pb-3 pt-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
        <button
          onClick={onStart}
          disabled={loading}
          className="pointer-events-auto mx-auto flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(135,103,26,0.3)] active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
          Start · {surah.englishName} {settings.startAyah}
          {settings.endAyah !== settings.startAyah ? `–${settings.endAyah}` : ""}
        </button>
      </div>
    </>
  );
};
