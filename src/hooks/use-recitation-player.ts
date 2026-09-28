"use client";

import { savePosition } from "@/lib/storage";
import type { Ayah, SessionSettings, SurahInfo } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type PlayerStatus = "idle" | "playing" | "paused" | "buffering" | "error" | "done";

export type PlayerView = {
  ayah: number; // numberInSurah
  rep: number; // 1-based repetition of current ayah
  loop: number; // 1-based repetition of the whole range
  status: PlayerStatus;
};

type Args = {
  surah: SurahInfo;
  ayahs: Ayah[];
  settings: SessionSettings;
  startAt?: { ayah: number; loop: number };
  /** Called each time an ayah finishes playing through. */
  onPlayed?: (ayah: number) => void;
};

/**
 * Playback state machine. All transitions happen inside audio event handlers using refs,
 * so repeats keep working while the page is in the background or the phone is locked.
 */
export function useRecitationPlayer({ surah, ayahs, settings, startAt, onPlayed }: Args) {
  const onPlayedRef = useRef(onPlayed);
  onPlayedRef.current = onPlayed;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ayahsRef = useRef(ayahs);
  ayahsRef.current = ayahs;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const pos = useRef({ ayah: startAt?.ayah ?? settings.startAyah, rep: 1, loop: startAt?.loop ?? 1 });
  const [view, setView] = useState<PlayerView>({ ...pos.current, status: "idle" });
  const statusRef = useRef<PlayerStatus>("idle");
  const mirror = useRef(0); // index into the current ayah's audio URLs

  const publish = useCallback((status?: PlayerStatus) => {
    if (status) statusRef.current = status;
    setView({ ...pos.current, status: statusRef.current });
  }, []);

  const ayahData = useCallback((n: number) => ayahs[n - 1], [ayahs]);

  const clearGap = () => {
    if (gapTimer.current) clearTimeout(gapTimer.current);
    gapTimer.current = null;
  };

  const preloadNext = useCallback(() => {
    const s = settingsRef.current;
    const next = pos.current.ayah >= s.endAyah ? s.startAyah : pos.current.ayah + 1;
    const a = ayahData(next);
    if (!a) return;
    const el = preloadRef.current ?? new Audio();
    el.preload = "auto";
    el.src = a.audio[0];
    preloadRef.current = el;
  }, [ayahData]);

  /** Point the audio element at the current ayah and optionally start it. */
  const loadCurrent = useCallback(
    (autoplay: boolean) => {
      const audio = audioRef.current;
      const a = ayahData(pos.current.ayah);
      if (!audio || !a) return;
      mirror.current = 0;
      const url = a.audio[0];
      if (audio.src !== url) audio.src = url;
      else audio.currentTime = 0;
      savePosition({ settings: settingsRef.current, ayah: pos.current.ayah, loop: pos.current.loop, savedAt: Date.now() });
      if (autoplay) {
        publish("buffering");
        audio.play().catch((e) => {
          if (e?.name === "AbortError") return;
          publish(e?.name === "NotAllowedError" ? "paused" : "error");
        });
      } else {
        publish("paused");
      }
      preloadNext();
    },
    [ayahData, preloadNext, publish],
  );

  const goTo = useCallback(
    (ayah: number, opts?: { loop?: number; autoplay?: boolean }) => {
      clearGap();
      const s = settingsRef.current;
      pos.current = {
        ayah: Math.min(Math.max(ayah, s.startAyah), s.endAyah),
        rep: 1,
        loop: opts?.loop ?? pos.current.loop,
      };
      const autoplay = opts?.autoplay ?? (statusRef.current === "playing" || statusRef.current === "buffering");
      loadCurrent(autoplay);
    },
    [loadCurrent],
  );

  const next = useCallback(() => {
    const s = settingsRef.current;
    if (pos.current.ayah < s.endAyah) return goTo(pos.current.ayah + 1);
    goTo(s.startAyah, { loop: pos.current.loop + 1 });
  }, [goTo]);

  const prev = useCallback(() => {
    const s = settingsRef.current;
    const audio = audioRef.current;
    // Like most players: restart the ayah if we're a few seconds in.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      pos.current.rep = 1;
      return publish();
    }
    if (pos.current.ayah > s.startAyah) return goTo(pos.current.ayah - 1);
    if (pos.current.loop > 1) return goTo(s.endAyah, { loop: pos.current.loop - 1 });
    goTo(s.startAyah);
  }, [goTo, publish]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (statusRef.current === "done") {
      pos.current = { ayah: settingsRef.current.startAyah, rep: 1, loop: 1 };
      return loadCurrent(true);
    }
    if (!audio.src || statusRef.current === "error") return loadCurrent(true);
    publish("buffering");
    audio.play().catch((e) => {
      if (e?.name !== "AbortError") publish("paused");
    });
  }, [loadCurrent, publish]);

  const pause = useCallback(() => {
    clearGap();
    audioRef.current?.pause();
    publish("paused");
  }, [publish]);

  const toggle = useCallback(() => {
    const st = statusRef.current;
    if (st === "playing" || st === "buffering" || gapTimer.current) pause();
    else play();
  }, [pause, play]);

  const onEnded = useCallback(() => {
    const s = settingsRef.current;
    const p = pos.current;
    const audio = audioRef.current;
    if (!audio) return;
    onPlayedRef.current?.(p.ayah);

    const advance = () => {
      gapTimer.current = null;
      if (s.ayahReps === 0 || p.rep < s.ayahReps) {
        p.rep += 1;
        audio.currentTime = 0;
        audio.play().catch(() => publish("paused"));
        publish("playing");
        return;
      }
      if (p.ayah < s.endAyah) {
        pos.current = { ayah: p.ayah + 1, rep: 1, loop: p.loop };
        return loadCurrent(true);
      }
      if (s.rangeReps === 0 || p.loop < s.rangeReps) {
        pos.current = { ayah: s.startAyah, rep: 1, loop: p.loop + 1 };
        return loadCurrent(true);
      }
      publish("done");
    };

    if (s.gapMs > 0) {
      gapTimer.current = setTimeout(advance, s.gapMs);
    } else {
      advance();
    }
  }, [loadCurrent, publish]);

  // Create the audio element once.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    const onPlaying = () => publish("playing");
    const onWaiting = () => publish("buffering");
    const onError = () => {
      if (!audio.src) return;
      // Try the API's mirror URLs before giving up.
      const urls = ayahsRef.current[pos.current.ayah - 1]?.audio ?? [];
      if (mirror.current + 1 < urls.length) {
        mirror.current += 1;
        audio.src = urls[mirror.current];
        audio.play().catch(() => {});
        return;
      }
      publish("error");
    };
    // Paused from outside the app (headphones unplugged, OS controls).
    const onPause = () => {
      if (!audio.ended && !gapTimer.current && statusRef.current === "playing") publish("paused");
    };
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);
    audio.addEventListener("pause", onPause);
    return () => {
      clearGap();
      audio.pause();
      audio.removeAttribute("src");
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, [publish]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [onEnded]);

  // Start the session as soon as the element exists.
  useEffect(() => {
    loadCurrent(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the range is edited mid-session, keep the current ayah inside it.
  useEffect(() => {
    const p = pos.current;
    if (p.ayah < settings.startAyah || p.ayah > settings.endAyah) goTo(settings.startAyah, { loop: 1 });
    else {
      preloadNext();
      publish();
    }
  }, [settings.startAyah, settings.endAyah, settings.ayahReps, settings.rangeReps, goTo, preloadNext, publish]);

  // Lock-screen / headphone controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: `${surah.englishName} · Ayah ${view.ayah}`,
      artist: "Mishary Alafasy",
      album: "Ayah Echo",
    });
    ms.playbackState = view.status === "playing" || view.status === "buffering" ? "playing" : "paused";
  }, [surah, view.ayah, view.status]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => play()],
      ["pause", () => pause()],
      ["nexttrack", () => next()],
      ["previoustrack", () => prev()],
    ];
    for (const [action, h] of handlers) {
      try {
        ms.setActionHandler(action, h);
      } catch {}
    }
    return () => {
      for (const [action] of handlers) {
        try {
          ms.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [play, pause, next, prev]);

  // Keep the screen awake while reciting.
  useEffect(() => {
    const active = view.status === "playing" || view.status === "buffering";
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
          if (cancelled) lock.release();
        }
      } catch {}
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, [view.status]);

  return { view, play, pause, toggle, next, prev, goTo, retry: () => loadCurrent(true) };
}
