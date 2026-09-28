"use client";

import { DisplayOptions, RepetitionOptions } from "@/components/session-options";
import { surahs } from "@/lib/surahs";
import type { SavedPosition } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { DisplayPrefs, SessionSettings } from "@/types";
import { ChevronDown, History, Loader2, Play, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FC } from "react";

type Props = {
  settings: SessionSettings;
  prefs: DisplayPrefs;
  resume: SavedPosition | null;
  loading: boolean;
  onSettingsChange: (patch: Partial<SessionSettings>) => void;
  onPrefsChange: (patch: Partial<DisplayPrefs>) => void;
  onStart: (startAt?: { ayah: number; loop: number }) => void;
  onResume: (p: SavedPosition) => void;
};

export const Setup: FC<Props> = ({ settings, prefs, resume, loading, onSettingsChange, onPrefsChange, onStart, onResume }) => {
  const surah = surahs.find((s) => s.id === settings.surahId)!;
  const [query, setQuery] = useState("");
  const [showDisplay, setShowDisplay] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[-' ]/g, "");
    if (!q) return surahs;
    return surahs.filter(
      (s) => String(s.id) === q || s.englishName.toLowerCase().replace(/[-' ]/g, "").includes(q) || s.name.includes(query.trim()),
    );
  }, [query]);

  // Keep the selected surah in view when the list first renders.
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
  }, []);

  const resumeSurah = resume && surahs.find((s) => s.id === resume.settings.surahId);

  return (
    <div className="min-h-[100dvh] bg-background safe-pad">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pb-28 pt-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-8 md:pt-10 land:grid land:grid-cols-2 land:pt-4">
        <div className="md:col-span-2 land:col-span-2 flex items-end justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-primary md:text-4xl">Ayah Echo</h1>
            <p className="text-muted-foreground">Listen, repeat, memorise — one ayah at a time.</p>
          </div>
        </div>

        {resume && resumeSurah && (
          <button
            onClick={() => onResume(resume)}
            className="md:col-span-2 land:col-span-2 flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left hover:bg-primary/15"
          >
            <History className="h-6 w-6 shrink-0 text-primary" />
            <span className="flex-1">
              <span className="block font-semibold">Continue {resumeSurah.englishName}</span>
              <span className="block text-sm text-muted-foreground">
                Ayah {resume.ayah} · range {resume.settings.startAyah}–{resume.settings.endAyah}
              </span>
            </span>
            <Play className="h-5 w-5 fill-current text-primary" />
          </button>
        )}

        {/* Surah picker */}
        <section className="flex min-h-0 flex-col rounded-2xl border bg-card">
          <label className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search surah by name or number"
              className="h-12 flex-1 bg-transparent text-base outline-none"
              aria-label="Search surah"
            />
          </label>
          <div ref={listRef} role="listbox" aria-label="Surah" className="h-[40dvh] overflow-y-auto p-1 md:h-[60dvh] land:h-[70dvh]">
            {filtered.map((s) => (
              <button
                key={s.id}
                role="option"
                aria-selected={s.id === settings.surahId}
                onClick={() => onSettingsChange({ surahId: s.id, startAyah: 1, endAyah: s.totalAyahs })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                  s.id === settings.surahId ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <span className="w-8 text-center text-sm tabular-nums opacity-70">{s.id}</span>
                <span className="flex-1">
                  <span className="block font-semibold leading-tight">{s.englishName}</span>
                  <span className="block text-xs opacity-70">{s.totalAyahs} ayahs</span>
                </span>
                <span className="arabic text-xl leading-none" lang="ar">
                  {s.name}
                </span>
              </button>
            ))}
            {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground">No surah matches “{query}”.</p>}
          </div>
        </section>

        {/* Options */}
        <section className="space-y-6">
          <div className="rounded-2xl border bg-card p-4">
            <h2 className="mb-4 font-headline text-xl font-bold">
              {surah.englishName} <span className="arabic font-normal">{surah.name}</span>
            </h2>
            <RepetitionOptions surah={surah} settings={settings} onChange={onSettingsChange} />
          </div>
          <div className="rounded-2xl border bg-card">
            <button onClick={() => setShowDisplay((v) => !v)} className="flex w-full items-center justify-between p-4 font-semibold" aria-expanded={showDisplay}>
              Display
              <ChevronDown className={cn("h-5 w-5 transition-transform", showDisplay && "rotate-180")} />
            </button>
            {showDisplay && (
              <div className="px-4 pb-4">
                <DisplayOptions prefs={prefs} onChange={onPrefsChange} />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sticky start button */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          onClick={() => onStart()}
          disabled={loading}
          className="mx-auto flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
          Start · ayah {settings.startAyah}
          {settings.endAyah !== settings.startAyah ? `–${settings.endAyah}` : ""}
        </button>
      </div>
    </div>
  );
};
