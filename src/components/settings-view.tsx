"use client";

import { DisplayOptions } from "@/components/session-options";
import { PageHeader } from "@/components/tab-bar";
import { clearPosition, clearProgress } from "@/lib/storage";
import type { DisplayPrefs } from "@/types";
import { useState, type FC } from "react";

export const SettingsView: FC<{ prefs: DisplayPrefs; onPrefsChange: (p: Partial<DisplayPrefs>) => void }> = ({ prefs, onPrefsChange }) => {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Ayah Echo" title="Settings" />

      <section className="space-y-3">
        <h2 className="eyebrow">Reading</h2>
        <div className="card-soft p-4">
          <DisplayOptions prefs={prefs} onChange={onPrefsChange} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">While listening</h2>
        <div className="card-soft p-4 text-sm leading-relaxed text-muted-foreground">
          <ul className="space-y-1.5">
            <li><b className="text-foreground">Tap the verse</b> to hide the controls and read full screen.</li>
            <li><b className="text-foreground">Swipe</b> left or right for the next or previous ayah.</li>
            <li><b className="text-foreground">Lock your phone</b> — playback and repeats keep going, with controls on the lock screen.</li>
            <li>On a keyboard: <b className="text-foreground">Space</b> play/pause, <b className="text-foreground">← →</b> previous/next.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">Data</h2>
        <div className="card-soft p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Progress and settings are saved only on this device.</p>
          <button
            onClick={() => {
              if (!confirm) return setConfirm(true);
              clearProgress();
              clearPosition();
              setConfirm(false);
            }}
            className="h-11 rounded-full border border-destructive/40 px-5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            {confirm ? "Tap again to erase all progress" : "Reset progress"}
          </button>
        </div>
      </section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Recitation by Mishary Rashid Alafasy · Text and translation (Saheeh International) via alquran.cloud
      </p>
    </div>
  );
};
