"use client";

import { DisplayOptions, RepetitionOptions } from "@/components/session-options";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFitText } from "@/hooks/use-fit-text";
import { useRecitationPlayer } from "@/hooks/use-recitation-player";
import { BISMILLAH } from "@/lib/quran";
import { recordListening } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Ayah, DisplayPrefs, SessionSettings, SurahInfo } from "@/types";
import { AlertCircle, ChevronLeft, Loader2, Pause, Play, RotateCcw, Settings2, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect, useRef, useState, type FC } from "react";

type Props = {
  surah: SurahInfo;
  ayahs: Ayah[];
  settings: SessionSettings;
  prefs: DisplayPrefs;
  startAt?: { ayah: number; loop: number };
  onSettingsChange: (patch: Partial<SessionSettings>) => void;
  onPrefsChange: (patch: Partial<DisplayPrefs>) => void;
  onPlayed: (ayah: number) => void;
  onExit: (listenedMs: number, plays: number) => void;
};

const repLabel = (n: number, total: number) => (total === 0 ? `${n} / ∞` : `${n} / ${total}`);

export const Player: FC<Props> = ({ surah, ayahs, settings, prefs, startAt, onSettingsChange, onPrefsChange, onPlayed, onExit }) => {
  const plays = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { view, toggle, next, prev, goTo, retry } = useRecitationPlayer({
    surah,
    ayahs,
    settings,
    startAt,
    onPlayed: (n) => {
      plays.current += 1;
      onPlayed(n);
    },
  });
  const [chrome, setChrome] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [revealed, setRevealed] = useState({ arabic: false, translit: false });
  const reveal = (layer: "arabic" | "translit") => {
    touch.current = null;
    setRevealed((r) => ({ ...r, [layer]: true }));
  };
  const startedAt = useRef(Date.now());

  const ayah = ayahs[view.ayah - 1];
  const playing = view.status === "playing" || view.status === "buffering";
  const rangeLen = settings.endAyah - settings.startAyah + 1;
  const progress = ((view.ayah - settings.startAyah + (view.rep - 1) / Math.max(1, settings.ayahReps || view.rep)) / rangeLen) * 100;

  useEffect(() => setRevealed({ arabic: false, translit: false }), [view.ayah]);

  // Count listening time while audio plays (saved every 10s and when playback stops).
  useEffect(() => {
    if (!playing) return;
    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      recordListening(now - last);
      last = now;
    };
    const id = setInterval(flush, 10_000);
    return () => {
      clearInterval(id);
      flush();
    };
  }, [playing]);

  // Keyboard: space = play/pause, arrows = prev/next, Escape = exit immersive.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheetOpen || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === " ") (e.preventDefault(), toggle());
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") setChrome(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, next, prev, sheetOpen]);

  const { containerRef, contentRef } = useFitText<HTMLDivElement, HTMLDivElement>(
    [ayah?.arabic, prefs.showArabic, prefs.showTranslation, prefs.showTransliteration, chrome],
    { min: 12, max: 160 },
  );

  // Swipe left/right on the text for next/previous.
  const onPointerDown = (e: React.PointerEvent) => (touch.current = { x: e.clientX, y: e.clientY });
  const onPointerUp = (e: React.PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      setChrome((c) => !c);
    }
  };

  const exit = () => onExit(Date.now() - startedAt.current, plays.current);

  const Controls = (
    <div className="flex items-center justify-center gap-4 land:flex-col land:gap-3">
      <button onClick={prev} aria-label="Previous ayah" className="h-14 w-14 rounded-full grid place-items-center text-foreground/80 hover:bg-accent active:scale-95 transition">
        <SkipBack className="h-7 w-7 fill-current" />
      </button>
      <button
        onClick={view.status === "error" ? retry : toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="h-20 w-20 land:h-16 land:w-16 rounded-full grid place-items-center bg-primary text-primary-foreground shadow-lg active:scale-95 transition"
      >
        {view.status === "buffering" ? (
          <Loader2 className="h-9 w-9 animate-spin" />
        ) : view.status === "error" ? (
          <RotateCcw className="h-9 w-9" />
        ) : playing ? (
          <Pause className="h-9 w-9 fill-current" />
        ) : (
          <Play className="h-9 w-9 fill-current translate-x-0.5" />
        )}
      </button>
      <button onClick={next} aria-label="Next ayah" className="h-14 w-14 rounded-full grid place-items-center text-foreground/80 hover:bg-accent active:scale-95 transition">
        <SkipForward className="h-7 w-7 fill-current" />
      </button>
    </div>
  );

  const Counters = (
    <div className="flex items-center justify-center gap-5 text-sm tabular-nums text-muted-foreground land:flex-col land:gap-1">
      <span>
        <span className="font-semibold text-foreground">{repLabel(view.rep, settings.ayahReps)}</span> repeat
      </span>
      {(settings.rangeReps !== 1 || view.loop > 1) && (
        <span>
          <span className="font-semibold text-foreground">{repLabel(view.loop, settings.rangeReps)}</span> loop
        </span>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col land:flex-row bg-background text-foreground safe-pad select-none">
      {/* Top bar (portrait / tablet) */}
      <header
        className={cn(
          "flex items-center gap-2 px-2 pt-2 transition-opacity duration-300 land:hidden",
          chrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <button onClick={exit} aria-label="End session" className="h-11 w-11 rounded-full grid place-items-center hover:bg-accent">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 min-w-0 text-center leading-tight">
          <div className="eyebrow tabular-nums">
            Ayah {view.ayah} · {view.ayah - settings.startAyah + 1} of {rangeLen}
          </div>
          <div className="font-headline text-2xl font-semibold truncate leading-tight">{surah.englishName}</div>
          <div className="hidden">
            Ayah {view.ayah} · {view.ayah - settings.startAyah + 1} of {rangeLen}
          </div>
        </div>
        <button onClick={() => setSheetOpen(true)} aria-label="Session settings" className="h-11 w-11 rounded-full grid place-items-center hover:bg-accent">
          <Settings2 className="h-6 w-6" />
        </button>
      </header>

      {/* Progress */}
      <div className={cn("mx-4 mt-2 h-[3px] rounded-full bg-muted overflow-hidden land:hidden transition-opacity", chrome ? "opacity-100" : "opacity-30")}>
        <div className="h-full bg-gold transition-[width] duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
      </div>

      {/* Text: fills all remaining space */}
      <main
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={
          {
            "--fs-ar": prefs.fontScales.arabic,
            "--fs-tl": prefs.fontScales.translit,
            "--fs-tr": prefs.fontScales.trans,
          } as React.CSSProperties
        }
        className="relative flex flex-1 min-h-0 flex-col overflow-y-auto overscroll-contain px-5 py-4 md:px-12 land:py-3 touch-pan-y"
      >
        {ayah ? (
          // my-auto (not justify-center) so enlarged text scrolls instead of being cut off at the top.
          <div ref={contentRef} key={view.ayah} className="my-auto flex w-full flex-col gap-[0.35em] text-center animate-in fade-in [animation-duration:300ms] transition-none">
            {prefs.showArabic && view.ayah === 1 && surah.id !== 1 && surah.id !== 9 && (
              <p className="arabic text-muted-foreground" style={{ fontSize: "calc(clamp(18px, 0.4em, 34px) * var(--fs-ar))" }} dir="rtl" lang="ar">
                {BISMILLAH}
              </p>
            )}
            {prefs.showArabic && (
              <Blurrable blurred={prefs.blurArabic && !revealed.arabic} onReveal={() => reveal("arabic")} label="Tap to reveal the Arabic">
                <p dir="rtl" lang="ar" className="arabic" style={{ fontSize: "calc(1em * var(--fs-ar))" }}>
                  {ayah.arabic}
                  <span className="inline-block mx-[0.2em] text-[0.6em] text-gold align-middle">﴿{view.ayah.toLocaleString("ar-EG")}﴾</span>
                </p>
              </Blurrable>
            )}
            {prefs.showTransliteration && ayah.transliteration && (
              <Blurrable blurred={prefs.blurTranslit && !revealed.translit} onReveal={() => reveal("translit")} label="Tap to reveal the transliteration">
                <p className="italic text-muted-foreground leading-snug" style={{ fontSize: "calc(clamp(15px, 0.3em, 28px) * var(--fs-tl))" }}>
                  {ayah.transliteration}
                </p>
              </Blurrable>
            )}
            {prefs.showTranslation && ayah.english && (
              <p className="font-body text-foreground/80 leading-snug max-w-[60ch] mx-auto" style={{ fontSize: "calc(clamp(16px, 0.32em, 30px) * var(--fs-tr))" }}>
                {ayah.english}
              </p>
            )}
            {!prefs.showArabic && !prefs.showTransliteration && !prefs.showTranslation && (
              <p className="text-base text-muted-foreground">Listening only — turn text back on in settings.</p>
            )}
          </div>
        ) : null}

        {!chrome && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground/10 px-3 py-1 text-xs text-muted-foreground tabular-nums">
            {view.ayah} · {repLabel(view.rep, settings.ayahReps)} {playing ? "▶" : "❚❚"}
          </div>
        )}
      </main>

      {/* Bottom controls (portrait) / side rail (phone landscape) */}
      <footer
        className={cn(
          "px-4 pb-4 pt-2 space-y-3 transition-all duration-300",
          "land:w-44 land:shrink-0 land:border-l land:flex land:flex-col land:items-center land:justify-between land:py-3 land:space-y-0",
          chrome ? "opacity-100" : "opacity-0 pointer-events-none h-0 p-0 overflow-hidden land:w-0 land:border-0",
        )}
      >
        <div className="hidden land:flex w-full items-center justify-between">
          <button onClick={exit} aria-label="End session" className="h-10 w-10 rounded-full grid place-items-center hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
          <button onClick={() => setSheetOpen(true)} aria-label="Session settings" className="h-10 w-10 rounded-full grid place-items-center hover:bg-accent">
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
        <div className="hidden land:block text-center leading-tight">
          <div className="font-headline text-lg font-semibold truncate max-w-[10rem]">{surah.englishName}</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            Ayah {view.ayah} · {view.ayah - settings.startAyah + 1}/{rangeLen}
          </div>
        </div>
        {view.status === "error" && (
          <p className="flex items-center justify-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> Couldn&apos;t load audio — tap to retry
          </p>
        )}
        {view.status === "done" && <p className="text-center text-sm font-semibold text-primary">Session complete — Masha&apos;Allah! Tap play to go again.</p>}
        {Counters}
        {Controls}
      </footer>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:max-w-xl sm:mx-auto">
          <SheetHeader className="text-left">
            <p className="eyebrow">{surah.englishName}</p>
            <SheetTitle className="font-headline text-3xl font-semibold">Session</SheetTitle>
            <SheetDescription>Changes apply straight away.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-6 pb-6">
            <RepetitionOptions surah={surah} settings={settings} onChange={onSettingsChange} />
            <div className="border-t pt-5">
              <h3 className="mb-3 text-sm font-semibold">Display</h3>
              <DisplayOptions prefs={prefs} onChange={onPrefsChange} />
            </div>
            <div className="border-t pt-5">
              <h3 className="mb-3 text-sm font-semibold">Jump to ayah</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: rangeLen }, (_, i) => settings.startAyah + i).map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      goTo(n);
                      setSheetOpen(false);
                    }}
                    className={cn(
                      "h-10 min-w-10 px-2 rounded-lg border text-sm tabular-nums",
                      n === view.ayah ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

/** Blurs its content until tapped ("Test me"). */
const Blurrable: FC<{ blurred: boolean; onReveal: () => void; label: string; children: React.ReactNode }> = ({ blurred, onReveal, label, children }) => (
  <div
    onPointerUp={(e) => {
      if (!blurred) return;
      e.stopPropagation();
      onReveal();
    }}
    className={cn("relative", blurred && "cursor-pointer select-none")}
    aria-label={blurred ? label : undefined}
    role={blurred ? "button" : undefined}
  >
    <div className={cn("transition-[filter] duration-300", blurred && "blur-[8px]")} aria-hidden={blurred || undefined}>
      {children}
    </div>
    {blurred && (
      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border bg-card/90 px-3 py-1 font-body text-xs font-semibold text-muted-foreground shadow-sm">
        Tap to reveal
      </span>
    )}
  </div>
);
