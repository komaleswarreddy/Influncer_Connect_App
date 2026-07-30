# Affiliate Platform — Mobile (Expo)

Expo SDK 53 / React Native app for influencers: campaigns, invites, stats, UGC jobs, bookings, Instagram tools. Routing is file-based via **expo-router** (`app/`).

## Setup

```bash
npm install                 # runs patch-package on postinstall
cp .env.example .env        # set EXPO_PUBLIC_API_URL (backend base URL, no /api suffix)
npm start                   # Expo Go dev server (runs scripts/expo-preflight.js first)
```

Useful variants:

| Script                            | Use when                                                               |
| --------------------------------- | ---------------------------------------------------------------------- |
| `npm run start:clear`             | Metro cache issues                                                     |
| `npm run start:tunnel`            | Device not on the same LAN                                             |
| `npm run start:dev-client:usb`    | Physical Android over USB (`npm run adb:reverse` forwards :8081/:3003) |
| `npm run android` / `npm run ios` | Dev-client build launch                                                |

## Builds (EAS)

```bash
npm run build:apk           # helper wrapper around EAS Android build
npm run build:preview       # eas build --profile preview
npm run build:production    # eas build --profile production
```

Profiles live in `eas.json`. `.easignore` excludes the committed `android/` folder — EAS cloud builds re-run prebuild from `app.config.js`, which is the source of truth for native config.

## Project layout

```
app/               expo-router routes (login, register/, influencer/, account-screens/)
components/        shared UI (ui/, influencer/, my-stats/, catalog/, scheduler/)
lib/               API clients, parsers, push, mock data
store/             zustand stores
theme/             design tokens, paper/navigation themes
assets/            images, fonts, lottie
plugins/           expo config plugins (Android network security)
scripts/           dev helper scripts (preflight, adb, EAS wrappers)
patches/           patch-package patches
```

## Notes

- Auth: Cognito Hosted UI (Google) → `POST /api/auth/cognito/mobile-token-login` (same shared pool as web).
- `EXPO_PUBLIC_USE_MOCK_AUTH` / `EXPO_PUBLIC_USE_MOCK_API` enable offline UI work without a backend; keep both `false` normally.
- Mobile-specific guides live in [../docs/mobile/](../docs/mobile/) (APK without backend, UI test guide, known gaps).
