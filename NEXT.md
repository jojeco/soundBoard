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
- **Wire `getRecentlyPlayed` into the UI.** The pure logic module already
  exports it and it's covered by tests, but no screen surfaces a "recently
  played" strip/section yet — only the 4-mode sort bar consumes the sort
  logic today.
- **Dedupe the duplicated `soundBoard-styles.js` `SBP` key** (there are two
  `SBP:` entries in the `StyleSheet.create` call — the second silently wins)
  and reconcile it with the new `pressedStyle` prop `SoundButton` accepts, so
  pressed-state styling is defined in one place instead of two.
