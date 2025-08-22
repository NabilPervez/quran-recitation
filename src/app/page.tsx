"use client";

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { surahs } from "@/lib/surahs";
import { transliterate } from "@/lib/transliteration";
import type { AyahData, SurahInfo } from "@/types";
import { ChevronsLeft, ChevronsRight, Loader2, Pause, Play, Repeat, Repeat1, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FC } from "react";

type SessionSettings = {
  surah: SurahInfo;
  startAyah: number;
  ayahReps: number;
  surahReps: number;
};

type PlayerState = {
  currentAyah: number;
  currentAyahRep: number;
  currentSurahRep: number;
  isPlaying: boolean;
  errorCount: number;
};

const getAudioUrl = (surahId: number, ayahNumber: number): string => {
    const surah = String(surahId).padStart(3, '0');
    const ayah = String(ayahNumber).padStart(3, '0');
    return `https://verses.quran.com/Alafasy/mp3/${surah}${ayah}.mp3`;
};

// --- Sub-Components ---

const SettingsForm: FC<{
  onStart: (settings: SessionSettings) => void;
  isSessionActive: boolean;
}> = ({ onStart, isSessionActive }) => {
  const [selectedSurahId, setSelectedSurahId] = useState<string>("1");
  const [startAyah, setStartAyah] = useState<number>(1);
  const [ayahReps, setAyahReps] = useState<number>(3);
  const [surahReps, setSurahReps] = useState<number>(1);
  const selectedSurah = surahs.find(s => s.id === parseInt(selectedSurahId, 10))!;

  const handleStart = () => {
    onStart({
      surah: selectedSurah,
      startAyah: Math.max(1, Math.min(startAyah, selectedSurah.totalAyahs)),
      ayahReps: Math.max(1, ayahReps),
      surahReps: Math.max(1, surahReps),
    });
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg border-accent/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-accent-foreground">Memorization Settings</CardTitle>
        <CardDescription>Select a surah and set your repetition goals.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="surah-select">Surah</Label>
          <Select value={selectedSurahId} onValueChange={setSelectedSurahId} disabled={isSessionActive}>
            <SelectTrigger id="surah-select">
              <SelectValue placeholder="Select a surah" />
            </SelectTrigger>
            <SelectContent>
              {surahs.map(surah => (
                <SelectItem key={surah.id} value={String(surah.id)}>
                  {surah.id}. {surah.englishName} ({surah.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-ayah">Starting Ayah</Label>
          <Input id="start-ayah" type="number" value={startAyah} onChange={e => setStartAyah(Number(e.target.value))} min="1" max={selectedSurah.totalAyahs} disabled={isSessionActive} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ayah-reps">Ayah Repetitions</Label>
          <Input id="ayah-reps" type="number" value={ayahReps} onChange={e => setAyahReps(Number(e.target.value))} min="1" disabled={isSessionActive} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="surah-reps">Surah Repetitions</Label>
          <Input id="surah-reps" type="number" value={surahReps} onChange={e => setSurahReps(Number(e.target.value))} min="1" disabled={isSessionActive} />
        </div>
        <div className="md:col-span-2">
          <Button onClick={handleStart} disabled={isSessionActive} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Play className="mr-2 h-4 w-4" /> Start Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AyahDisplay: FC<{ data: AyahData }> = ({ data }) => {
  return (
    <Card className="w-full max-w-4xl shadow-lg border-accent/20 transition-all duration-500 ease-in-out">
      <CardContent className="p-6 md:p-10 text-center flex flex-col gap-8">
        <p className="font-headline text-4xl md:text-6xl lg:text-7xl leading-normal text-foreground" dir="rtl" lang="ar">
          {data.arabic1}
        </p>
        <p className="text-xl md:text-2xl text-muted-foreground font-serif italic">
          {transliterate(data.arabic1)}
        </p>
        <p className="text-lg md:text-xl text-muted-foreground">
          {data.english}
        </p>
      </CardContent>
    </Card>
  );
};

const PlayerControls: FC<{
  playerState: PlayerState;
  settings: SessionSettings;
  onPlayPause: () => void;
  onMistake: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRepeat: () => void;
}> = ({ playerState, settings, onPlayPause, onMistake, onNext, onPrevious, onRepeat }) => (
  <div className="flex flex-col items-center gap-4 w-full max-w-md">
    <div className="flex items-center justify-center gap-4">
       <Button onClick={onPrevious} variant="ghost" size="icon" className="text-accent-foreground/70 hover:text-accent-foreground" disabled={playerState.currentAyah === 1 && playerState.currentSurahRep === 1}>
        <ChevronsLeft className="h-6 w-6" />
      </Button>
      <Button onClick={onRepeat} variant="ghost" size="icon" className="text-accent-foreground/70 hover:text-accent-foreground">
        <Repeat1 className="h-5 w-5" />
      </Button>
      <Button onClick={onPlayPause} size="lg" className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
        {playerState.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
      </Button>
       <Button variant="ghost" size="icon" className="text-accent-foreground/70 hover:text-accent-foreground">
         <Repeat className="h-5 w-5" />
       </Button>
      <Button onClick={onNext} variant="ghost" size="icon" className="text-accent-foreground/70 hover:text-accent-foreground">
        <ChevronsRight className="h-6 w-6" />
      </Button>
    </div>
    <div className="w-full text-center">
      <p className="text-muted-foreground">
        Ayah Repetition: {playerState.currentAyahRep} / {settings.ayahReps}
      </p>
      <p className="text-muted-foreground">
        Surah Loop: {playerState.currentSurahRep} / {settings.surahReps}
      </p>
    </div>
    <Button onClick={onMistake} variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
      <XCircle className="mr-2 h-4 w-4" /> I made a mistake
    </Button>
  </div>
);


// --- Main Page Component ---

export default function Home() {
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentAyah: 1,
    currentAyahRep: 1,
    currentSurahRep: 1,
    isPlaying: false,
    errorCount: 0,
  });
  const [ayahData, setAyahData] = useState<AyahData | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const [sessionTime, setSessionTime] = useState(0);

  const { toast } = useToast();

  const handleSessionEnd = useCallback(() => {
    if (sessionStartTime.current) {
      setSessionTime(Math.round((new Date().getTime() - sessionStartTime.current.getTime()) / 1000));
    }
    setIsSessionActive(false);
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
    setSettings(null);
    setAyahData(null);
    setAudioSrc("");
    setIsSummaryOpen(true);
  }, []);

  const advanceToNext = useCallback(() => {
    if (!settings) return;

    let nextAyah = playerState.currentAyah + 1;
    let nextSurahRep = playerState.currentSurahRep;

    if (nextAyah > settings.surah.totalAyahs) {
      nextSurahRep++;
      if (nextSurahRep > settings.surahReps) {
        handleSessionEnd();
        return;
      }
      nextAyah = 1;
    }

    setPlayerState(prev => ({
      ...prev,
      currentAyah: nextAyah,
      currentSurahRep: nextSurahRep,
      currentAyahRep: 1,
      errorCount: 0,
    }));
  }, [settings, playerState, handleSessionEnd]);


  const handleNextAyah = () => {
     if (!settings) return;
     advanceToNext();
  };

  const handlePreviousAyah = () => {
    if (!settings || (playerState.currentAyah === 1 && playerState.currentSurahRep === 1)) return;

    let prevAyah = playerState.currentAyah - 1;
    let prevSurahRep = playerState.currentSurahRep;

    if (prevAyah < 1) {
      prevSurahRep--;
      // This should not happen if button is disabled correctly, but as a safeguard.
      if (prevSurahRep < 1) return;
      prevAyah = settings.surah.totalAyahs;
    }

     setPlayerState(prev => ({
      ...prev,
      currentAyah: prevAyah,
      currentSurahRep: prevSurahRep,
      currentAyahRep: 1,
      errorCount: 0,
    }));
  }

  const handleRepeatAyah = () => {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.error("Audio replay error:", e));
      }
  }


  const handleAudioEnd = useCallback(() => {
    if (!settings) return;

    if (playerState.currentAyahRep < settings.ayahReps) {
      setPlayerState(prev => ({ ...prev, currentAyahRep: prev.currentAyahRep + 1 }));
    } else {
      advanceToNext();
    }
  }, [settings, playerState, advanceToNext]);

  useEffect(() => {
    const fetchAyah = async () => {
      if (!settings || !isSessionActive) return;

      setIsLoading(true);
      setAudioSrc(""); // Clear previous audio
      try {
        const response = await fetch(`https://quranapi.pages.dev/api/${settings.surah.id}/${playerState.currentAyah}.json`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data: AyahData = await response.json();
        setAyahData(data);
        setAudioSrc(getAudioUrl(settings.surah.id, playerState.currentAyah));
      } catch (error) {
        console.error("Failed to fetch ayah data:", error);
        toast({
          variant: "destructive",
          title: "API Error",
          description: `Could not fetch Ayah ${playerState.currentAyah} of Surah ${settings.surah.englishName}.`,
        });
        handleSessionEnd();
      } finally {
        setIsLoading(false);
      }
    };
    fetchAyah();
  }, [settings, playerState.currentAyah, playerState.currentSurahRep, isSessionActive, toast, handleSessionEnd]);
  
  useEffect(() => {
    if (audioSrc && audioRef.current && isSessionActive) {
      if (playerState.isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioSrc, playerState.isPlaying, isSessionActive]);

  useEffect(() => {
    if (playerState.isPlaying && audioRef.current && audioSrc) {
        // This effect is for subsequent plays after the first one on a new src
        // Or when a paused audio is played again.
        audioRef.current.play().catch(e => console.error("Audio play error:", e));
    }
  }, [playerState.currentAyahRep, playerState.isPlaying, audioSrc]);


  const handleStartSession = (newSettings: SessionSettings) => {
    setSettings(newSettings);
    setPlayerState({
      currentAyah: newSettings.startAyah,
      currentAyahRep: 1,
      currentSurahRep: 1,
      isPlaying: true, // Auto-play on start
      errorCount: 0,
    });
    setIsSessionActive(true);
    sessionStartTime.current = new Date();
    setSessionTime(0);
  };

  const handlePlayPause = () => {
    if (!isSessionActive) return;
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleMistake = () => {
    if (!isSessionActive) return;
    setPlayerState(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    toast({
      title: "Mistake Noted",
      description: "Don't worry, keep trying! Repetition is key.",
    });
  };

  const closeSummary = () => {
    setIsSummaryOpen(false);
    toast({
      title: "Session Complete!",
      description: "Masha'Allah! You have completed your memorization session.",
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 space-y-8 bg-background font-body">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary-foreground tracking-tight">
          Al-Fatiha Recite
        </h1>
        <p className="text-muted-foreground text-lg mt-2">A Quran Memorization Tool for Converts</p>
      </div>

      {!isSessionActive ? (
        <SettingsForm onStart={handleStartSession} isSessionActive={isSessionActive} />
      ) : (
        <>
          {isLoading && !ayahData && (
            <div className="flex items-center gap-4 text-primary-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xl">Loading Ayah...</span>
            </div>
          )}

          {!isLoading && ayahData && (
            <>
              <AyahDisplay data={ayahData} />
              <PlayerControls
                playerState={playerState}
                settings={settings!}
                onPlayPause={handlePlayPause}
                onMistake={handleMistake}
                onNext={handleNextAyah}
                onPrevious={handlePreviousAyah}
                onRepeat={handleRepeatAyah}
              />
              <Button onClick={handleSessionEnd} variant="destructive" className="mt-4">
                End Session
              </Button>
            </>
          )}
        </>
      )}

      <audio
        ref={audioRef}
        src={audioSrc}
        onEnded={handleAudioEnd}
        onPlay={() => setPlayerState(p => ({...p, isPlaying: true}))}
        onPause={() => setPlayerState(p => ({...p, isPlaying: false}))}
        onCanPlayThrough={() => {
            if (playerState.isPlaying) {
                audioRef.current?.play().catch(e => console.error("Autoplay error:", e));
            }
        }}
      />

      <AlertDialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Complete!</AlertDialogTitle>
            <AlertDialogDescription>
              Masha'Allah! You have completed your memorization session.
              Total time: {Math.floor(sessionTime / 60)}m {sessionTime % 60}s.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeSummary}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

    