
"use client";

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { surahs } from "@/lib/surahs";
import type { AyahData, SurahInfo } from "@/types";
import { ChevronsLeft, ChevronsRight, Loader2, Minus, Pause, Play, Plus, Repeat, Repeat1 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FC } from "react";

type SessionSettings = {
  surah: SurahInfo;
  startAyah: number;
  endAyah: number;
  ayahReps: number;
  surahReps: number;
};

type PlayerState = {
  currentAyah: number;
  currentAyahRep: number;
  currentSurahRep: number;
  isPlaying: boolean;
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
  const [endAyah, setEndAyah] = useState<number>(1);
  const [ayahReps, setAyahReps] = useState<number>(3);
  const [surahReps, setSurahReps] = useState<number>(1);
  const selectedSurah = surahs.find(s => s.id === parseInt(selectedSurahId, 10))!;

  useEffect(() => {
    setStartAyah(1);
    setEndAyah(selectedSurah.totalAyahs);
  }, [selectedSurahId]);


  const handleStart = () => {
    onStart({
      surah: selectedSurah,
      startAyah: Math.max(1, Math.min(startAyah, selectedSurah.totalAyahs)),
      endAyah: Math.max(startAyah, Math.min(endAyah, selectedSurah.totalAyahs)),
      ayahReps: Math.max(1, ayahReps),
      surahReps: Math.max(1, surahReps),
    });
  };

  return (
    <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-100">
        <CardTitle className="font-headline text-2xl text-gray-900">Quran Memorization Settings</CardTitle>
        <CardDescription className="text-gray-600">Select a surah and set your repetition goals.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
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
          <Input
            id="start-ayah"
            type="number"
            value={startAyah}
            onChange={e => {
              const val = Number(e.target.value);
              setStartAyah(val);
              if (val > endAyah) setEndAyah(val);
            }}
            min="1"
            max={selectedSurah.totalAyahs}
            disabled={isSessionActive}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-ayah">Ending Ayah</Label>
          <Input id="end-ayah" type="number" value={endAyah} onChange={e => setEndAyah(Number(e.target.value))} min={startAyah} max={selectedSurah.totalAyahs} disabled={isSessionActive} />
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
          <Button onClick={handleStart} disabled={isSessionActive} className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white rounded-xl shadow-emerald-100 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            <Play className="mr-2 h-4 w-4" /> Start Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AyahDisplay: FC<{ data: AyahData | null, isVisible: boolean }> = ({ data, isVisible }) => {
  if (!data) {
    return (
      <Card className={`w-full max-w-5xl bg-white rounded-2xl shadow-sm border-2 border-gray-100 transition-opacity duration-500 ease-in-out opacity-0`}>
        <CardContent className="p-6 md:p-10 text-center flex flex-col gap-8 h-[290px]" />
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-5xl bg-white rounded-2xl shadow-sm border-2 border-gray-100 transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <CardContent className="p-6 md:p-10 text-center flex flex-col gap-8 min-h-[290px] justify-center">
        <p className="font-headline text-4xl md:text-6xl lg:text-7xl leading-normal text-foreground" dir="rtl" lang="ar">
          {data.arabic}
        </p>
        {data.transliteration && (
          <p
            className="text-lg md:text-xl text-muted-foreground font-mono"
            dangerouslySetInnerHTML={{ __html: data.transliteration }}
          />
        )}
        {data.english && (
          <p className="text-lg md:text-xl text-muted-foreground">
            {data.english}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const PlayerControls: FC<{
  playerState: PlayerState;
  settings: SessionSettings;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRepeat: () => void;
  onSettingsChange: (newSettings: Partial<SessionSettings>) => void;
  isAutoplayEnabled: boolean;
  onAutoplayChange: (enabled: boolean) => void;
}> = ({ playerState, settings, onPlayPause, onNext, onPrevious, onRepeat, onSettingsChange, isAutoplayEnabled, onAutoplayChange }) => (
  <div className="flex flex-col items-center gap-6 w-full max-w-md">
    <div className="flex items-center justify-center gap-2">
      <Button onClick={onPrevious} variant="ghost" size="icon" className="text-accent-foreground/70 hover:text-accent-foreground" disabled={playerState.currentAyah === settings.startAyah && playerState.currentSurahRep === 1}>
        <ChevronsLeft className="h-6 w-6" />
      </Button>
      <Button onClick={onPlayPause} size="lg" className="rounded-full h-16 w-16 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-emerald-100 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
        {playerState.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
      </Button>
      <Button onClick={onNext} variant="ghost" size="icon" className="text-accent-foreground/70 hover:text-accent-foreground">
        <ChevronsRight className="h-6 w-6" />
      </Button>
    </div>
    <div className="flex items-center justify-center gap-2">
      <Label htmlFor="autoplay-switch" className="text-muted-foreground text-sm">Autoplay</Label>
      <Switch id="autoplay-switch" checked={isAutoplayEnabled} onCheckedChange={onAutoplayChange} />
    </div>
    <div className="flex items-center justify-center gap-8 w-full text-center">
      <div className="flex items-center gap-2">
        <Button onClick={() => onSettingsChange({ ayahReps: Math.max(1, settings.ayahReps - 1) })} variant="outline" size="icon" className="h-8 w-8"><Minus className="h-4 w-4" /></Button>
        <span className="text-muted-foreground text-sm whitespace-nowrap">Ayah: {playerState.currentAyahRep} / {settings.ayahReps}</span>
        <Button onClick={() => onSettingsChange({ ayahReps: settings.ayahReps + 1 })} variant="outline" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => onSettingsChange({ surahReps: Math.max(1, settings.surahReps - 1) })} variant="outline" size="icon" className="h-8 w-8"><Minus className="h-4 w-4" /></Button>
        <span className="text-muted-foreground text-sm whitespace-nowrap">Surah: {playerState.currentSurahRep} / {settings.surahReps}</span>
        <Button onClick={() => onSettingsChange({ surahReps: settings.surahReps + 1 })} variant="outline" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  </div>
);


// --- Main Page Component ---

const AyahTitle: FC<{ settings: SessionSettings | null, playerState: PlayerState }> = ({ settings, playerState }) => {
  if (!settings) return null;

  return (
    <div className="text-center mb-6">
      <h1 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 tracking-tight">{settings.surah.englishName}</h1>
      <p className="text-gray-600 text-lg mt-2">{settings.surah.name} : Ayah {playerState.currentAyah}</p>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentAyah: 1,
    currentAyahRep: 1,
    currentSurahRep: 1,
    isPlaying: false,
  });
  const [ayahData, setAyahData] = useState<AyahData | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isDisplayVisible, setIsDisplayVisible] = useState(true);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const { toast } = useToast();

  const handleSessionEnd = useCallback(() => {
    if (sessionStartTime.current) {
      setSessionTime(Math.round((new Date().getTime() - sessionStartTime.current.getTime()) / 1000));
    }
    setIsSessionActive(false);
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
    setSettings(null);
    setAyahData(null);
    setAudioSrc('');
    setIsSummaryOpen(true);
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
  }, []);

  const advanceToNext = useCallback(() => {
    if (!settings) return;

    setPlayerState(prev => {
      let nextAyah = prev.currentAyah;
      let nextSurahRep = prev.currentSurahRep;

      // Check if we are at the end of the surah
      if (prev.currentAyah >= settings.endAyah) {
        nextSurahRep++;
        // Check if we've completed all surah repetitions
        if (nextSurahRep > settings.surahReps) {
          handleSessionEnd();
          return { ...prev, isPlaying: false }; // Stop playing and end session
        }
        // Loop back to the start of the range for the next surah repetition
        nextAyah = settings.startAyah;
      } else {
        // Go to the next ayah in the range
        nextAyah = prev.currentAyah + 1;
      }

      return {
        ...prev,
        currentAyah: nextAyah,
        currentSurahRep: nextSurahRep,
        currentAyahRep: 1,
        isPlaying: isAutoplayEnabled, // Autoplay next ayah if enabled
      };
    });
  }, [settings, isAutoplayEnabled, handleSessionEnd]);


  const handleNextAyah = () => {
    if (!settings) return;
    advanceToNext();
  };

  const handlePreviousAyah = () => {
    if (!settings) return;
    if (playerState.currentAyah <= settings.startAyah && playerState.currentSurahRep === 1) return;

    setPlayerState(prev => {
      let prevAyah = prev.currentAyah - 1;
      let prevSurahRep = prev.currentSurahRep;

      if (prevAyah < settings.startAyah) {
        prevSurahRep--;
        if (prevSurahRep < 1) return prev; // Should be disabled, but safeguard
        prevAyah = settings.endAyah;
      }

      return {
        ...prev,
        currentAyah: prevAyah,
        currentSurahRep: prevSurahRep,
        currentAyahRep: 1,
      };
    });
  }

  const handleRepeatAyah = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (playerState.isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio replay error:", e));
      }
    }
  }

  const playNextOrRepeat = useCallback(() => {
    if (!settings) return;

    if (playerState.currentAyahRep < settings.ayahReps) {
      setPlayerState(prev => ({ ...prev, currentAyahRep: prev.currentAyahRep + 1, isPlaying: true }));
    } else {
      advanceToNext();
    }
  }, [settings, playerState.currentAyahRep, advanceToNext]);

  const handleAudioEnd = useCallback(() => {
    if (isAutoplayEnabled) {
      if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = setTimeout(() => {
        playNextOrRepeat();
      }, 1000); // 1-second pause
    } else {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [isAutoplayEnabled, playNextOrRepeat]);

  // Effect for fetching Ayah data
  useEffect(() => {
    const fetchAyah = async () => {
      if (!settings || !isSessionActive) return;
      setIsDisplayVisible(false);
      setIsLoading(true);

      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        // Indonesian API call (unchanged)
        const indoResponse = await fetch(`https://quran-api.santrikoding.com/api/surah/${settings.surah.id}`);
        if (!indoResponse.ok) throw new Error("Network response for Indonesian API was not ok");
        const surahData = await indoResponse.json();

        const verse = surahData.ayat[playerState.currentAyah - 1];
        if (!verse) throw new Error("Verse not found in API response");

        let englishTranslation = "Translation not available.";
        try {
          // English API call
          const englishResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${settings.surah.id}:${playerState.currentAyah}/en.sahih`);
          if (englishResponse.ok) {
            const englishApiData = await englishResponse.json();
            if (englishApiData.code === 200 && englishApiData.data && englishApiData.data.text) {
              englishTranslation = englishApiData.data.text;
            }
          }
        } catch (e) {
          console.error("Failed to fetch English translation:", e);
        }

        const data: AyahData = {
          arabic: verse.ar,
          indonesian: verse.idn,
          transliteration: verse.tr,
          english: englishTranslation,
        };

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
        setIsDisplayVisible(true);
      }
    };

    if (isSessionActive) {
      fetchAyah();
    }
  }, [settings, playerState.currentAyah, playerState.currentSurahRep, isSessionActive, toast, handleSessionEnd]);


  // Effect for controlling audio playback based on isPlaying state and audioSrc
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    const playAudio = () => {
      audio.play().catch(e => {
        console.error("Audio play error:", e);
        setPlayerState(p => ({ ...p, isPlaying: false }));
      });
    };

    if (playerState.isPlaying) {
      if (audio.currentSrc !== audioSrc) {
        audio.load();
        const handleDataLoaded = () => {
          playAudio();
          audio.removeEventListener('loadeddata', handleDataLoaded);
        };
        audio.addEventListener('loadeddata', handleDataLoaded);
      } else {
        playAudio();
      }
    } else {
      audio.pause();
    }
  }, [playerState.isPlaying, audioSrc]);

  // Effect for handling repetitions
  useEffect(() => {
    const audio = audioRef.current;
    if (playerState.isPlaying && audio && playerState.currentAyahRep > 1) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Audio replay error:", e));
    }
  }, [playerState.currentAyahRep, playerState.isPlaying]);


  const handleStartSession = (newSettings: SessionSettings) => {
    setSettings(newSettings);
    setPlayerState({
      currentAyah: newSettings.startAyah,
      currentAyahRep: 1,
      currentSurahRep: 1,
      isPlaying: true, // Auto-play on start
    });
    setIsSessionActive(true);
    sessionStartTime.current = new Date();
    setSessionTime(0);
  };

  const handlePlayPause = () => {
    if (!isSessionActive || !audioSrc) return;

    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }

    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSettingsChange = (newSettings: Partial<SessionSettings>) => {
    setSettings(prev => prev ? { ...prev, ...newSettings } : null);
  };

  const closeSummary = () => {
    setIsSummaryOpen(false);
    toast({
      title: "Session Complete!",
      description: "Masha'Allah! You have completed your memorization session.",
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start md:justify-center px-4 pb-4 pt-2 md:p-8 space-y-8 bg-background font-body">
      {!isSessionActive && (
        <div className="text-center hidden md:block">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 tracking-tight">
            Ayah Echo
          </h1>
        </div>
      )}

      {!isSessionActive ? (
        <SettingsForm onStart={handleStartSession} isSessionActive={isSessionActive} />
      ) : (
        <>
          <AyahTitle settings={settings} playerState={playerState} />
          {isLoading && !ayahData && (
            <div className="flex items-center gap-4 text-accent-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xl">Loading Ayah...</span>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-8 w-full">
            <AyahDisplay data={ayahData} isVisible={isDisplayVisible && !isLoading} />
            <PlayerControls
              playerState={playerState}
              settings={settings!}
              onPlayPause={handlePlayPause}
              onNext={handleNextAyah}
              onPrevious={handlePreviousAyah}
              onRepeat={handleRepeatAyah}
              onSettingsChange={handleSettingsChange}
              isAutoplayEnabled={isAutoplayEnabled}
              onAutoplayChange={setIsAutoplayEnabled}
            />
            <Button onClick={handleSessionEnd} variant="destructive" className="mt-4">
              End Session
            </Button>
          </div>
        </>
      )}

      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onEnded={handleAudioEnd}
          onPlay={() => {
            if (!playerState.isPlaying) setPlayerState(p => ({ ...p, isPlaying: true }))
          }}
          onPause={() => {
            if (playerState.isPlaying && !autoplayTimeoutRef.current) {
              setPlayerState(p => ({ ...p, isPlaying: false }))
            }
          }}
        />
      )}

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





