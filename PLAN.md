# Ayah Echo — UX overhaul plan

Goal: the best possible screen for **listening to an ayah over and over and reading it**,
on phones and tablets, portrait and landscape.

## Problems found (v1)

| # | Problem | Impact |
|---|---------|--------|
| 1 | Arabic text uses `font-headline` (Alegreya, a Latin font); Amiri is loaded but unused | Arabic falls back to a system font — poor readability |
| 2 | Every ayah change (and every loop) re-fetches the API, waits an artificial 300 ms and fades the card out | Audible gap + blank flash between ayahs, wasted data |
| 3 | Any fetch error calls `handleSessionEnd()` | One network blip throws the user out of their session |
| 4 | Playback logic spread across 3 effects + `onPause`/`onPlay` handlers with stale closures | Missed/double repeats, pauses while the phone is locked |
| 5 | Fixed font sizes (`text-7xl`) | Long ayahs (e.g. 2:282) overflow and scroll; short ones waste the screen |
| 6 | Layout is a stacked card + controls + big red "End Session" button | Doesn't use the screen; unusable in phone landscape; easy to end by accident |
| 7 | No Media Session / wake lock | No lock-screen controls; screen sleeps while reading |
| 8 | Can't hide translation / transliteration or the Arabic | No way to test recall; clutter while memorising |
| 9 | No persistence | Settings and position lost on reload; no resume |
| 10 | No infinite loop of an ayah/range, no gap control | Core memorisation patterns missing |
| 11 | `dangerouslySetInnerHTML` for transliteration; unused Indonesian edition fetched | Minor safety/efficiency issues |

## Plan / progress

- [x] Analyse code and live behaviour
- [x] Data layer: fetch the whole surah once (text + translation + transliteration), cache it, build audio URLs directly; strip the duplicated Bismillah
- [x] Playback engine hook: single audio element, ref-based state machine, gap between repeats, ∞ ayah / range loops, preload next ayah, error → retry instead of ending the session
- [x] Media Session (lock-screen play/pause/next/prev) + Screen Wake Lock
- [x] Full-screen player: auto-fit text to the available space, tap to hide/show controls, swipe for next/prev, keyboard shortcuts
- [x] Responsive layouts: portrait (controls at bottom), landscape (controls in side rail), tablet
- [x] Display options: translation / transliteration toggles, "test me" mode (blur Arabic, tap to reveal), text size, light / sepia / dark themes
- [x] Settings adjustable mid-session in a sheet
- [x] Setup screen: searchable surah picker, quick range + repeat presets, resume last session
- [x] Persist settings, display prefs and position in localStorage
- [x] Verify in browser (phone portrait, phone landscape, tablet) and `next build`
- [x] Commit and push

## Later ideas
- Per-ayah "memorised" marks and spaced-repetition review queue
- Choice of reciter; record-and-compare
- Offline (PWA) caching of a surah's audio
