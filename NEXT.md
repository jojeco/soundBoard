# Next up

A few small, well-scoped increments that build on the favorites/play-stats
layer added in this pass (`lib/soundPrefs.js`, `lib/prefsStorage.js`,
`hooks/useSoundPrefs.js`):

- **Retire `components/recording.js`.** It's dead/unimported, duplicates the
  record/playback flow that already lives in `app/Custom.js`, and has its own
  bugs (e.g. references `Audio.RecordingOptionsPresets_HIGH_QUALITY`, which
  doesn't exist — same class of typo just fixed in `app/Custom.js`). Either
  delete it or fold any still-useful bits into `Custom.js` and remove the file.
- **TypeScript conversion**, starting with `lib/soundPrefs.js` since it's
  already a small, pure, dependency-free module — a natural first file to
  convert and a good place to define shared `SoundPrefs`/`SortMode` types
  before spreading them to the screens and the hook.
- ~~**Wire `getRecentlyPlayed` into the UI.**~~ **DONE** — `app/soundBoard.js`
  now shows a horizontal "Recently played" strip (last 5) above the grid via
  `recentlyPlayed` from `hooks/useSoundPrefs.js`.
- ~~**Recently-played for custom sounds.**~~ **DONE** — the "Recently played"
  strip now renders on `app/Custom.js` too, and both screens have a
  confirm-guarded "Clear recents" button that keeps favorites and play counts
  (`clearRecents` in `lib/soundPrefs.js`). Deleting a custom sound calls
  `forgetSound`, and each successful fetch runs `pruneByPrefix("custom:", …)`,
  so a reused SQLite rowid can't inherit a deleted sound's stale stats.
- ~~**Give the two screens a shared prefs store.**~~ **DONE** — added
  `lib/prefsStore.js` (module-level pub/sub store) and refactored
  `hooks/useSoundPrefs.js` to read/write through one shared store instance
  instead of a per-screen `useState`, so `app/soundBoard.js` and
  `app/Custom.js` now always see the same prefs, loaded from storage exactly
  once.
- **Custom-sound recents are per-screen** — the strips are also scoped per
  screen, so a single unified strip would need the builtin `require()` handles
  available on `Custom.js`.
- **Retire `styles/CreateSoundStyles.js`.** Nothing imports it — the create
  screen (`app/Custom.js`) pulls from `styles/Stylesheet.js` instead, so the
  whole file (including its unused `soundButton`/`soundButtonPressed` pair) is
  dead weight. Same class of cleanup as `components/recording.js` above.
- ~~**Combos**~~ **DONE** — added `lib/combos.js` (pure model: combos, steps,
  delays, schedule-building, and an injected-clock `createComboRunner`),
  `lib/comboStorage.js` + `hooks/useCombos.js` (its own AsyncStorage key and
  store instance), and `components/ComboPanel.js` wired into
  `app/soundBoard.js` (Premade screen). Users can build, name, save, edit and
  play back an ordered sequence of premade sounds with a per-step delay, and
  combos persist across app restarts. Deliberately kept combos on their OWN
  storage key (`@soundboard/combos/v1`) instead of adding a field to the
  existing prefs blob — every mutator in `lib/soundPrefs.js` rebuilds that
  object as exactly `{version, favorites, stats}`, so any extra field would
  get silently wiped on the next favorite toggle or play.
- **Combos for custom recordings** — currently combo steps can only reference
  the builtin premade sounds (`app/soundBoard.js`'s `sounds` array); adding
  custom recordings would need a unified builtin/custom source map shared
  with `app/Custom.js`.
- **Optional: count combo plays toward stats** — combo playback intentionally
  skips `recordPlay` right now, so "most played"/"recently played" only
  reflect manual taps; could opt combo steps into that same accounting later.
