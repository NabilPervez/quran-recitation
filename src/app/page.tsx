"use client";

import { Player } from "@/components/player";
import { Setup } from "@/components/setup";
import { useToast } from "@/hooks/use-toast";
import { fetchSurah } from "@/lib/quran";
import {
  DEFAULT_PREFS,
  DEFAULT_SETTINGS,
  clearPosition,
  loadPosition,
  loadPrefs,
  loadSettings,
  savePrefs,
  saveSettings,
  type SavedPosition,
} from "@/lib/storage";
import { surahs } from "@/lib/surahs";
import type { Ayah, DisplayPrefs, SessionSettings } from "@/types";
import { useCallback, useEffect, useState } from "react";

type Session = { ayahs: Ayah[]; startAt?: { ayah: number; loop: number } };

export default function Home() {
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SETTINGS);
  const [prefs, setPrefs] = useState<DisplayPrefs>(DEFAULT_PREFS);
  const [resume, setResume] = useState<SavedPosition | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(loadSettings());
    setPrefs(loadPrefs());
    setResume(loadPosition());
  }, []);

  const surah = surahs.find((s) => s.id === settings.surahId)!;

  // Warm the cache for the selected surah so Start is instant.
  useEffect(() => {
    fetchSurah(settings.surahId).catch(() => {});
  }, [settings.surahId]);

  const updateSettings = useCallback((patch: Partial<SessionSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const updatePrefs = useCallback((patch: Partial<DisplayPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("sepia", "dark");
    if (prefs.theme !== "light") root.classList.add(prefs.theme);
  }, [prefs.theme]);

  const start = async (s: SessionSettings, startAt?: { ayah: number; loop: number }) => {
    setLoading(true);
    try {
      const ayahs = await fetchSurah(s.surahId);
      setSession({ ayahs, startAt });
    } catch {
      toast({ variant: "destructive", title: "Couldn't load the surah", description: "Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const exit = (listenedMs: number) => {
    setSession(null);
    setResume(loadPosition());
    const mins = Math.round(listenedMs / 60000);
    if (mins >= 1) toast({ title: "Session saved", description: `${mins} min of listening. You can continue where you left off.` });
  };

  if (session) {
    return (
      <Player
        surah={surah}
        ayahs={session.ayahs}
        settings={settings}
        prefs={prefs}
        startAt={session.startAt}
        onSettingsChange={updateSettings}
        onPrefsChange={updatePrefs}
        onExit={exit}
      />
    );
  }

  return (
    <Setup
      settings={settings}
      prefs={prefs}
      resume={resume}
      loading={loading}
      onSettingsChange={updateSettings}
      onPrefsChange={updatePrefs}
      onStart={() => {
        clearPosition();
        start(settings);
      }}
      onResume={(p) => {
        updateSettings(p.settings);
        start(p.settings, { ayah: p.ayah, loop: p.loop });
      }}
    />
  );
}
