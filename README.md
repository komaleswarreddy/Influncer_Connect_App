# Affiliate Connect — Mobile app

Expo (SDK 53) / React Native app for influencers: campaigns and invites, stats, UGC jobs, bookings, contracts, invoices and Instagram tools. Routing is file-based with expo-router (`app/`). It talks to the Partner Connect API, which lives in the web and API repository: [Zopkit/Affiliate-Connect](https://github.com/Zopkit/Affiliate-Connect).

- Android package: `com.affiliateplatform.app` (current version in `app.json`)
- Sign-in: AWS Cognito Hosted UI (shared pool with the web app), then `POST /api/auth/cognito/mobile-token-login`

## Requirements

- Node 20 and npm
- A running Partner Connect API (local `http://localhost:3003`, or the hosted one)
- Expo Go or a development build on a phone or emulator; an Expo/EAS account for cloud builds

## Setup

```bash
npm install                  # runs patch-package on postinstall
cp .env.example .env         # set EXPO_PUBLIC_API_URL (base URL, no /api suffix)
npm start                    # Expo dev server (runs a preflight check first)
```

Never commit `.env`. Every `EXPO_PUBLIC_*` value is bundled into the app and visible to anyone who has the APK, so only public identifiers belong there (API URL, Cognito client id), never secrets.

| Script                         | Use when                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| `npm run start:clear`          | Metro cache problems                                             |
| `npm run start:tunnel`         | Phone and computer are not on the same network                   |
| `npm run start:dev-client:usb` | Physical Android over USB (`npm run adb:reverse` forwards ports) |
| `npm run android` / `ios`      | Launch a development build                                       |
| `npm run lint`                 | Expo lint                                                        |
| `npx tsc --noEmit`             | Type check                                                       |

## Environment

| Variable                             | Notes                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`                | API base URL without `/api`, for example `http://localhost:3003`                |
| `EXPO_PUBLIC_COGNITO_*`              | Region, user pool, hosted-UI domain, mobile client id, redirect and logout URIs |
| `EXPO_PUBLIC_USE_MOCK_AUTH` / `_API` | Offline UI work only. Keep both `false` for real testing and every release      |

See `.env.example` for the full, commented list.

## Builds and releases (EAS)

```bash
npm run build:preview        # internal APK (profile "preview")
npm run build:production     # release build (profile "production")
```

- Profiles are in `eas.json`; `appVersionSource` is `local`.
- Native values in the committed `android/` project (`versionName`, `versionCode`) override `app.json`. Bump the version in both places before a release build.
- Step-by-step: [docs/APK-AND-TEST-GUIDE.md](docs/APK-AND-TEST-GUIDE.md) (build, install, and 47 UI test cases) and [docs/BUILD_APK_WITHOUT_BACKEND.md](docs/BUILD_APK_WITHOUT_BACKEND.md).

## Tech stack and key packages

Versions come from `package.json` (the lockfile pins the exact ones). Expo packages must stay on the versions that match SDK 53; use `npx expo install <package>` to add or upgrade them.

| Area              | Packages                                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core              | expo ~53, react-native 0.79, react 19, TypeScript ~5.8, metro 0.82                                                                                                               |
| Navigation        | expo-router ~5, @react-navigation/native and bottom-tabs 7, react-native-screens, react-native-safe-area-context                                                                 |
| UI                | react-native-paper 5, react-native-reanimated 3.17, react-native-svg, lottie-react-native, expo-image, expo-linear-gradient, expo-blur, @expo/vector-icons, @expo-google-fonts/* |
| State             | zustand 5, @react-native-async-storage/async-storage                                                                                                                             |
| Auth and security | expo-auth-session (Cognito PKCE), expo-secure-store, expo-web-browser                                                                                                            |
| Device features   | expo-camera, expo-image-picker, expo-document-picker, expo-clipboard, expo-video, react-native-view-shot, react-native-webview                                                   |
| Monitoring        | @sentry/react-native 8                                                                                                                                                           |
| Tooling           | eas-cli (builds), patch-package (see `patches/`), cross-env, eslint 9 with eslint-config-expo, expo-dev-client                                                                   |

Keeping dependencies healthy: CI runs `npm audit`. After upgrading any native package, make a new development or preview build; a JavaScript reload is not enough.

## Project layout

```
app/          expo-router routes (login, register/, influencer/, account screens)
components/   shared UI
lib/          API clients, parsers, push, helpers
store/        zustand stores
theme/        design tokens and navigation themes
assets/       images, fonts, animations
plugins/      Expo config plugins (Android network security)
scripts/      dev helpers (preflight, adb, build wrappers)
patches/      patch-package patches
docs/         guides: testing, APK builds, contract feature, known gaps
```

## CI

`.github/workflows/ci.yml` runs a TypeScript type check and a dependency audit on every pull request and push to `main` (both informational for now).

## Related

- The API contract is checked from the API repository: its tests read this app's sources when this repo is checked out next to it (`../partner-connect-mobile`) or pointed to with `MOBILE_DIR`. If you rename or add API calls here, run `npm test` there.
- Known gaps and unfinished features: [docs/known-gaps.md](docs/known-gaps.md).
