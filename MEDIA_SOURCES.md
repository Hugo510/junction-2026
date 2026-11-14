# Media sources

Every sound or image that ships in this repository is listed here with its author, source and
licence. The repository is MIT, so only material that is public domain (CC0) or made by the team
goes in. Photos and videos used in the deck or the demo video are **not** stored in the repo.

## In the app

| File | What | Author | Source | Licence |
| --- | --- | --- | --- | --- |
| `apps/mobile/assets/sounds/sea.mp3` | "Waves on the bay": gurgling waves on the Gulf of Finland, 41.5 s, looped in the sea-sounds exercise | miklovan | <https://freesound.org/people/miklovan/sounds/195889/> | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

Notes on `sea.mp3`:

- Downloaded on 14 November 2026 as Freesound's own high-quality MP3 rendering of the recording
  (`195889_224081-hq.mp3`, 1,059,216 bytes). The original upload is a 24-bit, 44.1 kHz FLAC, which
  needs a Freesound login. The file was not edited or re-encoded.
- The licence was read on the sound's page on the day of the download.

## Made by the team

| What | Where | How |
| --- | --- | --- |
| Illustrations, icons, companion avatars, the hearth, the body map | `apps/mobile/src/ui`, `apps/mobile/src/features` | Drawn in code (SVG) during the event |
| Optional generated sea sound | `apps/mobile/scripts/make-sea-sound.js` | Filtered noise, written during the event. Not bundled; kept as a fallback with no third-party file |
| App icon and splash images | `apps/mobile/assets/images` | Made during the event |

## Fonts

| Font | Use | Licence |
| --- | --- | --- |
| Nunito | App typeface, loaded from the `@expo-google-fonts/nunito` package | SIL Open Font License 1.1 |

## Not in the repository

Photos and videos for the deck and the demo video (for example from Pexels) are free to use but
are not CC0, so they stay out of the repo. The full list, with licences and the reasoning, is kept
by Meg in the project notes.
