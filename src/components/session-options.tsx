"use client";

import { cn } from "@/lib/utils";
import type { DisplayPrefs, SessionSettings, SurahInfo, Theme } from "@/types";
import { DEFAULT_FONT_SCALES, FONT_LAYERS, FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP, clampFontScale } from "@/lib/fonts";
import { Minus, Plus } from "lucide-react";
import type { FC, ReactNode } from "react";

export const Field: FC<{ label: string; hint?: string; children: ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
    {children}
  </div>
);

export const Chips: FC<{
  options: { value: number | string; label: string }[];
  value: number | string;
  onChange: (v: any) => void;
  label: string;
}> = ({ options, value, onChange, label }) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        onClick={() => onChange(o.value)}
        className={cn(
          "min-w-11 h-11 px-3 rounded-full border text-base font-semibold transition-colors",
          value === o.value
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border hover:bg-accent",
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const Stepper: FC<{
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}> = ({ value, min, max, onChange, label }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      aria-label={`Decrease ${label}`}
      disabled={value <= min}
      onClick={() => onChange(Math.max(min, value - 1))}
      className="h-11 w-11 shrink-0 rounded-full border bg-card grid place-items-center disabled:opacity-40 hover:bg-accent"
    >
      <Minus className="h-4 w-4" />
    </button>
    <input
      aria-label={label}
      inputMode="numeric"
      className="h-11 w-16 rounded-xl border bg-card text-center text-lg font-semibold tabular-nums"
      value={value}
      onChange={(e) => {
        const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
        if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
      }}
    />
    <button
      type="button"
      aria-label={`Increase ${label}`}
      disabled={value >= max}
      onClick={() => onChange(Math.min(max, value + 1))}
      className="h-11 w-11 shrink-0 rounded-full border bg-card grid place-items-center disabled:opacity-40 hover:bg-accent"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
);

export const Toggle: FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({
  checked,
  onChange,
  label,
  hint,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3 text-left hover:bg-accent"
  >
    <span>
      <span className="block font-semibold">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </span>
    <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted-foreground/30")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </span>
  </button>
);

const AYAH_REPS = [1, 3, 5, 7, 10, 20, 0].map((v) => ({ value: v, label: v === 0 ? "∞" : String(v) }));
const RANGE_REPS = [1, 2, 3, 5, 10, 0].map((v) => ({ value: v, label: v === 0 ? "∞" : `${v}×` }));
const GAPS = [0, 500, 1000, 2000, 4000].map((v) => ({ value: v, label: v === 0 ? "None" : `${v / 1000}s` }));

/** Repetition + range controls shared by the setup screen and the in-session sheet. */
export const RepetitionOptions: FC<{
  surah: SurahInfo;
  settings: SessionSettings;
  onChange: (patch: Partial<SessionSettings>) => void;
}> = ({ surah, settings, onChange }) => (
  <div className="space-y-5">
    <Field label="Ayahs" hint={`${settings.endAyah - settings.startAyah + 1} of ${surah.totalAyahs}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="w-10 text-sm text-muted-foreground">From</span>
          <Stepper
            label="start ayah"
            value={settings.startAyah}
            min={1}
            max={surah.totalAyahs}
            onChange={(v) => onChange({ startAyah: v, endAyah: Math.max(v, settings.endAyah) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-10 text-sm text-muted-foreground">To</span>
          <Stepper
            label="end ayah"
            value={settings.endAyah}
            min={1}
            max={surah.totalAyahs}
            onChange={(v) => onChange({ endAyah: v, startAyah: Math.min(v, settings.startAyah) })}
          />
        </div>
        {(settings.startAyah !== 1 || settings.endAyah !== surah.totalAyahs) && (
          <button
            type="button"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            onClick={() => onChange({ startAyah: 1, endAyah: surah.totalAyahs })}
          >
            Whole surah
          </button>
        )}
      </div>
    </Field>
    <Field label="Repeat each ayah" hint="∞ = stay on one ayah until you tap next">
      <Chips label="Repeat each ayah" options={AYAH_REPS} value={settings.ayahReps} onChange={(v) => onChange({ ayahReps: v })} />
    </Field>
    <Field label="Then repeat the whole range">
      <Chips label="Repeat range" options={RANGE_REPS} value={settings.rangeReps} onChange={(v) => onChange({ rangeReps: v })} />
    </Field>
    <Field label="Pause between repeats" hint="Time to recite it back yourself">
      <Chips label="Pause between repeats" options={GAPS} value={settings.gapMs} onChange={(v) => onChange({ gapMs: v })} />
    </Field>
  </div>
);

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "sepia", label: "Sepia" },
  { value: "dark", label: "Dark" },
];

export const DisplayOptions: FC<{ prefs: DisplayPrefs; onChange: (patch: Partial<DisplayPrefs>) => void }> = ({ prefs, onChange }) => (
  <div className="space-y-3">
    <Toggle label="Arabic" checked={prefs.showArabic} onChange={(v) => onChange({ showArabic: v })} />
    <Toggle label="Transliteration" checked={prefs.showTransliteration} onChange={(v) => onChange({ showTransliteration: v })} />
    <Toggle label="Translation" checked={prefs.showTranslation} onChange={(v) => onChange({ showTranslation: v })} />
    <p className="eyebrow pt-2">Test me</p>
    <Toggle
      label="Blur the Arabic"
      hint="Recite from memory, tap to check"
      checked={prefs.blurArabic}
      onChange={(v) => onChange({ blurArabic: v, showArabic: v ? true : prefs.showArabic })}
    />
    <Toggle
      label="Blur the transliteration"
      hint="Tap to check"
      checked={prefs.blurTranslit}
      onChange={(v) => onChange({ blurTranslit: v, showTransliteration: v ? true : prefs.showTransliteration })}
    />
    <ReadingSize prefs={prefs} onChange={onChange} />
    <Field label="Theme">
      <Chips label="Theme" options={THEMES} value={prefs.theme} onChange={(v) => onChange({ theme: v })} />
    </Field>
  </div>
);

/** Per-layer reading size, as in Quran Reflection's "Reading Size" settings. */
export const ReadingSize: FC<{ prefs: DisplayPrefs; onChange: (patch: Partial<DisplayPrefs>) => void }> = ({ prefs, onChange }) => {
  const f = prefs.fontScales;
  const changed = FONT_LAYERS.some(({ key }) => f[key] !== 1);
  return (
    <Field label="Reading size" hint="50–300%, on top of auto-fit">
      <div className="rounded-xl border bg-background p-4 text-center">
        <p dir="rtl" lang="ar" className="arabic" style={{ fontSize: `${28 * f.arabic}px` }}>
          قُلْ هُوَ ٱللَّهُ أَحَدٌ
        </p>
        <p className="italic text-muted-foreground" style={{ fontSize: `${15 * f.translit}px` }}>
          Qul huwal laahu ahad
        </p>
        <p className="text-foreground/80" style={{ fontSize: `${16 * f.trans}px` }}>
          Say, "He is Allah, [who is] One,
        </p>
      </div>
      <div className="space-y-2 pt-1">
        {FONT_LAYERS.map(({ key, label }) => {
          const value = f[key];
          const step = (dir: number) => onChange({ fontScales: { [key]: clampFontScale(value + dir * FONT_SCALE_STEP) } as DisplayPrefs["fontScales"] });
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{label}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease ${label.toLowerCase()} size`}
                  disabled={value <= FONT_SCALE_MIN + 0.001}
                  onClick={() => step(-1)}
                  className="h-10 w-10 rounded-full border bg-card grid place-items-center text-sm font-semibold disabled:opacity-40 hover:bg-accent"
                >
                  A−
                </button>
                <span className="w-12 text-center text-sm font-semibold tabular-nums">{Math.round(value * 100)}%</span>
                <button
                  type="button"
                  aria-label={`Increase ${label.toLowerCase()} size`}
                  disabled={value >= FONT_SCALE_MAX - 0.001}
                  onClick={() => step(1)}
                  className="h-10 w-10 rounded-full border bg-card grid place-items-center text-base font-semibold disabled:opacity-40 hover:bg-accent"
                >
                  A+
                </button>
              </div>
              </div>
              <input
                type="range"
                aria-label={`${label} size`}
                min={FONT_SCALE_MIN}
                max={FONT_SCALE_MAX}
                step={FONT_SCALE_STEP}
                value={value}
                onChange={(e) => onChange({ fontScales: { [key]: clampFontScale(Number(e.target.value)) } as DisplayPrefs["fontScales"] })}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </div>
          );
        })}
        {changed && (
          <button
            type="button"
            onClick={() => onChange({ fontScales: DEFAULT_FONT_SCALES })}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Reset sizes
          </button>
        )}
      </div>
    </Field>
  );
};
