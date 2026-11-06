# Mobile Implementation Gaps

This note tracks areas that are still mocked, partially implemented, or need production hardening.

## Auth

- **Working**
  - Email/password login via `/api/auth/login`.
  - Cognito ID-token exchange via `/api/auth/cognito/mobile-token-login` (Kinde has been removed).
  - Session refresh via `/api/auth/me`.
- **Gap**
  - `register()` in `mobile/store/auth-store.ts` is mock-only (delay + fake user/token), not backed by a real registration endpoint.

## Campaigns

- **Working**
  - Campaign browse/apply flow UI exists (list, filters, details, contract/progress navigation).
- **Gap**
  - `mobile/store/campaign-store.ts` relies on `mockCampaigns` and `mockParticipations`.
  - Live fetch/join/participation persistence is not wired to backend APIs.

## Influencer Analytics + Ratings

- **Working**
  - Dashboard, media-kit, and ratings screens are present and integrated with store state.
- **Gap**
  - `mobile/store/influencer-store.ts` currently simulates platform analytics (Instagram/YouTube/Twitter) and ratings with mock data.
  - Production-grade OAuth/platform connectors are not implemented in mobile store logic.

## Progress Tracking

- **Working**
  - `mobile/store/progress-store.ts` calls `contentProgressApi` endpoints for fetch/submit/update/delete.
- **Gap**
  - End-to-end behavior depends on backend route parity and tenancy/auth setup; no offline fallback.

## API Configuration

- **Working**
  - `mobile/lib/api.ts` supports environment-based base URL and optional mock responses.
- **Gap**
  - `EXPO_PUBLIC_USE_MOCK_API` can mask backend failures during development if left enabled.
  - `mobile/app/account-screens/support-hub.tsx` still uses a hardcoded `API_URL` constant for support tickets.

## UI/UX Integration

- **Working**
  - Premium tokens and UI primitives are applied across major screens.
- **Gap**
  - Some legacy hardcoded colors and per-screen styles remain in non-critical paths and should be gradually replaced with `appShell`/`palette`.
  - `mobile/app/influencer/(tabs)/dashboard.tsx` should be kept to a single canonical implementation to avoid drift.
