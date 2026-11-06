# Mobile 7-Feature UI Test Guide (Local)

Step-by-step guide to manually test all seven mobile features using **Expo Go / `npm start`** on your machine — not the APK/dev client build.

---

## Before you start

### 1. Run database migrations

From the **repo root**:

```powershell
npm run db:migrate
```

This applies all Drizzle migrations, including `0027_push_tokens` (`influencer_push_tokens` for Expo push registration).

**Verify (optional):** After migrate, confirm the table exists:

```powershell
npx tsx scripts/apply-0027-push-tokens.ts
```

You should see `Table influencer_push_tokens already exists.` if migration 0027 is applied.

### 2. Start the backend API

From the **repo root**:

```powershell
npm run dev
```

Default API: `http://localhost:3000`

### 3. Configure mobile env

In `mobile/`, copy env if needed:

```powershell
Copy-Item mobile\.env.example mobile\.env
```

Important variables in `mobile/.env`:

| Variable                    | Local value             | Notes                                                                                          |
| --------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`       | `http://localhost:3000` | Physical Android: run `npm run adb:reverse` from `mobile/` so `127.0.0.1:3000` reaches your PC |
| `EXPO_PUBLIC_USE_MOCK_API`  | `false`                 | Use `true` only for offline UI smoke tests (mock trending ideas, push register, etc.)          |
| `EXPO_PUBLIC_USE_MOCK_AUTH` | `false`                 | Use `true` for mock email login without Kinde                                                  |

### 4. Start the mobile app

From **`mobile/`**:

```powershell
npm install
npm start
```

- Press **`a`** for Android emulator, **`i`** for iOS simulator, or scan the QR code with **Expo Go**.
- Bottom tabs after login: **Home · Campaigns · Stats · Settings** (no separate Inbox tab — use Home **Invites & notifications** card)

### 5. Sign in

1. Open the app → **Sign in** screen.
2. **Real API:** Use Kinde / Google sign-in with an **influencer** account tied to your tenant.
3. **Mock auth (UI only):** Set `EXPO_PUBLIC_USE_MOCK_AUTH=true`, restart Metro, use **Or mock sign-in** with any email/password that passes validation.

You should land on the influencer **Home** tab.

---

## Feature map (quick reference)

| #   | Feature                   | Where to open                                                        |
| --- | ------------------------- | -------------------------------------------------------------------- |
| 1   | Trending content ideas    | Settings tab → **Trending ideas**                                    |
| 2   | Affiliate store (catalog) | Settings → **Catalog**                                               |
| 3   | Video playback preview    | Instagram scheduler, UGC deliver, booking deliver                    |
| 4   | AI captions               | Instagram → Schedule Content → Create post                           |
| 5   | Collab inbox + push       | Home → **Open invite inbox** or `/influencer/invites`                |
| 6   | Bookings + UGC earnings   | Settings → **Monetization** section                                  |
| 7   | Post analyzer             | **Stats** tab → scroll to **Analyze post URL** (below analyzer grid) |

---

## Feature 1 — Trending content ideas

**Goal:** LLM-backed niche ideas with platform filter, optional keyword, refresh, and “Use for schedule”.

### Steps

1. Tap bottom tab **Settings** (gear icon).
2. Under **Tools**, tap **Trending ideas**.
3. At the top, tap platform pills: **Instagram** | **TikTok** | **YouTube** (example: **Instagram**).
4. In **Optional keyword or topic**, type: `summer skincare routine`.
5. Tap **Refresh ideas**.
6. Wait for cards to load. Each card shows **title**, **hook**, **hashtags**, **Best time**, and **rationale**.
7. On any idea, tap **Use for schedule**.
8. You should navigate to **Create scheduled post** with the idea pre-filled (topic/caption context).

### Expected results

- Ideas list populates (real API needs LLM keys configured on server; mock API returns a demo idea if `EXPO_PUBLIC_USE_MOCK_API=true`).
- After refresh, you may see **Cached brief (refreshes every few hours)**.
- **Use for schedule** opens the scheduler compose screen.

### Example data

| Field    | Example                   |
| -------- | ------------------------- |
| Platform | Instagram                 |
| Keyword  | `summer skincare routine` |

---

## Feature 2 — Affiliate store (catalog)

This covers **catalog lifecycle** (pending / approved / rejected).

### Catalog setup & status

1. **Settings** → **Catalog**.
2. If no catalog exists, follow setup:
   - **Catalog name:** `Parul's Closet`
   - **Business type:** tap **Clothing**
   - **Description:** `Affordable ethnic wear for college students`
   - Tap **Continue →** and complete builder steps until submitted.
3. **Pending approval:** Screen explains catalog is awaiting review.
4. **Approved (admin must approve in web/backend):** Hero shows product count and **share URL** like `{API}/catalog/{slug}`.
5. **Rejected:** Hero shows **Catalog not approved** with guidance to fix and resubmit.

### Expected results

- Approved catalog displays slug-based public URL.

### Example data

| Field         | Example          |
| ------------- | ---------------- |
| Catalog name  | `Parul's Closet` |
| Business type | Clothing         |

---

## Feature 3 — Video playback preview

**Goal:** Native video preview via `VideoPreview` after picking or attaching video media.

> **Expo Go note:** Video preview uses `expo-video`. It works in Expo Go on most devices; if playback fails, retry on a dev client build. Image picks still work without video.

### Path A — Scheduled Instagram post

1. **Settings** → **Instagram** (badge **NEW**).
2. Tap **Schedule Content** card (or row **Schedule Content** → `{N} upcoming`).
3. Tap **Upload your reel**.
4. Choose post type that supports video (e.g. **Reel**).
5. Tap **Pick media** / gallery picker and select a **video** from the device.
6. Confirm **VideoPreview** appears (9:16 frame) with **Rewind 5s**, **Play/Pause**, **Forward 5s** controls (no next/previous track buttons).

### Path B — UGC deliverable

1. Open a UGC brief you’re assigned to (e.g. **Campaigns** or **UGC jobs** flow → deliver screen).
2. On **UGC deliver** screen, tap **Pick file from gallery & submit**.
3. Select a **video** file.
4. Confirm **VideoPreview** shows above the action buttons.

### Path C — Rate-card booking deliverable

1. **Settings** → **Monetization** → **Bookings**.
2. Open an active booking → **Deliver** (or navigate to booking deliver screen).
3. **Pick file from gallery & submit** → choose a video.
4. Confirm **VideoPreview** renders.

### Expected results

- Video thumbnail/player visible before submit.
- **Rewind 5s** and **Forward 5s** jump playback correctly.
- Images show as static preview (no `VideoPreview` for non-video MIME types).

### Example data

| Field             | Example                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| Media             | Any `.mp4` from device gallery (≤ platform size limits)                        |
| UGC link fallback | `https://drive.google.com/file/d/example/view` in link field + **Submit link** |

---

## Feature 4 — AI captions (scheduler)

**Goal:** Generate caption options from a topic, pick one, apply back to scheduled post.

### Steps

1. **Settings** → **Instagram** → **Schedule Content**.
2. Tap **Upload your reel** (opens **Create scheduled post**).
3. Optionally pick media and set schedule time (not required to test AI only).
4. Scroll to **AI topic**.
5. In the AI topic field, type: `Morning coffee routine — cozy aesthetic, soft lighting`.
6. Tap **Ask the AI**.
7. On **AI captions** screen, review 2–3 suggestion cards (caption + hashtags).
8. Tap **Apply** on the caption you like.
9. You return to **Create scheduled post** with caption/hashtags filled in.
10. Optional: tap **Try new ones** on results screen to regenerate.
11. Tap **Back** or system back to return without applying.

### Expected results

- Navigation to `/account-screens/ai-caption-results`.
- **Apply** merges caption into the compose form.
- Server needs AI/LLM configured; errors show as alert **AI captions** / **Generation failed**.

### Example data

| Field                           | Example                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| AI topic                        | `Morning coffee routine — cozy aesthetic, soft lighting`                                      |
| Manual caption (fallback topic) | Leave AI topic empty but fill **Write a caption** — **Ask the AI** uses caption text as topic |

---

## Feature 5 — Collab inbox + push notifications

**Goal:** Full inbox via Home card or invites screen — notifications list, campaign invites, mark-read, accept/decline.

### Part A — Inbox UI (always testable locally)

1. On **Home**, tap **Open invite inbox** on the **Invites & notifications** card (or navigate to `/influencer/invites`).
2. **Notifications** section:
   - If empty: _No notifications yet._
   - If items exist: each row has **title**, **body**, **Open** (primary), **Mark read** (secondary).
3. Tap **Open** on a notification — routes to campaign/invite/detail based on type.
4. Tap **Mark read** — row should update; Home card unread count decreases.
5. **Pending invites** section:
   - Each invite shows campaign name and **Expires** date.
   - **Decline** (secondary) — invite removed/updated.
   - **Accept** (primary) — marks viewed, accepts, navigates to campaign progress.

6. Pull down to **refresh** the inbox.

### Part B — Push notifications (limited in Expo Go)

Push registration runs on app launch (`registerForPushNotifications`). **Remote push delivery requires a physical device and often a dev client**, not Expo Go.

To test push end-to-end with real API:

1. Use a **dev client** build on a physical phone (not required for this local UI guide).
2. Log in as influencer — token registers to `influencer_push_tokens`.
3. From web/admin, trigger an action that creates a notification (campaign invite, UGC update, booking payment, etc.).
4. Device should receive push; tapping opens deep link (campaign, inbox, etc.).

**For `npm start` / Expo Go:** validate inbox UI and API-loaded notifications; treat push as **backend verified** (migration + token register API) unless using dev client.

### Trigger test data (real API)

Ask a brand user on the web app to:

- Send a **campaign invite** to your influencer account, or
- Approve/decline an application that generates a notification.

Then pull-to-refresh the invites screen.

### Expected results

- Home **Invites & notifications** card shows unread count.
- Notifications and invites load from `/api/...` (not hardcoded).
- Accept invite → campaign participation flow starts.

---

## Feature 6 — Bookings + UGC earnings (Monetization)

**Goal:** Two rows under **Monetization** on Settings: **Bookings** and **UGC earnings**.

### Part A — Bookings

1. Tap **Settings** tab.
2. Under **Monetization** (subtitle: _Bookings and UGC payouts_), tap **Bookings**.
3. Review list of rate-card bookings (status, brand, dates).
4. Tap a booking to open detail / deliver flow if available.
5. Confirm navigation works back to Settings.

### Part B — UGC earnings

1. **Settings** → **Monetization** → **UGC earnings**.
2. Top card: **Total earned** (₹ amount).
3. Scroll payment/history rows: brief title, amount, status, date.
4. If no payouts yet, screen still loads without crash (empty or zero total).

### Expected results

- Both rows appear only under **Monetization**, not mixed into Tools.
- Amounts formatted in INR (₹).
- Errors show red error text with retry on fetch failure.

### Example data

Requires existing bookings/UGC payments in DB for your influencer. If empty, verify screens show empty states cleanly.

---

## Feature 7 — Post analyzer on My Stats

**Goal:** Analyze a public post URL from the top of **Stats** tab.

### Steps

1. Tap bottom tab **Stats** (bar chart icon).
2. Scroll past hero, rating, and analyzer grid to the **Analyze post URL** card.
3. Tap the text field (placeholder: `https://instagram.com/p/...`).
4. Paste a real public post URL, example:
   ```
   https://www.instagram.com/reel/DCxxxxxxxx/
   ```
5. Tap **Analyze**.
6. Wait for **Analyzing…** to finish.
7. **PostMetricsCard** appears below with views, likes, comments, engagement, etc. (depends on platform support).
8. Scroll down — **My Stats** hero, rating card, analyzer grid, and **history** of past analyses load.
9. Submit another URL to append to history; use **Retry** if history fetch errors.

### Expected results

- Invalid URL → error message under the button.
- Supported URL → metrics card visible without leaving the tab.
- History list grows after successful analyses.

### Example URLs (replace with live public posts)

| Platform  | Example format                                |
| --------- | --------------------------------------------- |
| Instagram | `https://www.instagram.com/p/ABC123/`         |
| YouTube   | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |

---

## Full end-to-end walkthrough (one session)

Use this checklist to touch all seven features in order (~20–30 minutes):

| Step | Action                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------- |
| 1    | Root: `npm run db:migrate` → `npm run dev`                                                                        |
| 2    | Mobile: `npm start` → sign in as influencer                                                                       |
| 3    | **Settings** → **Trending ideas** → Instagram + keyword `fitness tips` → **Refresh ideas** → **Use for schedule** |
| 4    | On scheduler screen, **AI topic** → **Ask the AI** → **Apply** a caption → go back                                |
| 5    | Pick a **video** → confirm **VideoPreview** → cancel or save draft                                                |
| 6    | **Settings** → **Catalog** → verify status UI (pending/approved/rejected)                                         |
| 7    | **Home** → **Open invite inbox** → **Mark read** / **Accept** or **Decline** an invite                            |
| 8    | **Settings** → **Bookings** → open one booking                                                                    |
| 9    | **Settings** → **UGC earnings** → check total                                                                     |
| 10   | **Stats** → scroll to **Analyze post URL** → paste Instagram URL → **Analyze**                                    |

---

## Troubleshooting

| Issue                        | Fix                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| API unreachable on phone     | `cd mobile` → `npm run adb:reverse`; or set `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000`   |
| Trending ideas empty / error | Check server logs; confirm LLM env vars; or set `EXPO_PUBLIC_USE_MOCK_API=true` for UI-only |
| AI captions fail             | Server AI route must be configured; check network tab / Fastify logs                        |
| Affiliate links empty        | Influencer needs affiliate role + products in tenant                                        |
| Catalog stuck pending        | Approve catalog from brand web admin                                                        |
| Video preview blank          | Try shorter MP4; Expo Go codec limits; use dev client for production-like test              |
| Push not received            | Expected in Expo Go; use dev client + physical device                                       |
| Post analyzer errors         | URL must be public; platform must be supported by post-analyzer backend                     |

---

## Automated sanity check (non-UI)

From repo root:

```powershell
npx tsx scripts/verify-mobile-features-e2e.ts
```

Confirms required files, routes, and UI strings exist for all seven features.

---

## Related files

| Area                  | Path                                                |
| --------------------- | --------------------------------------------------- |
| Push tokens migration | `drizzle/0027_push_tokens.sql`                      |
| Trending API          | `server/routes/content-ideas.ts`                    |
| Push tokens API       | `server/routes/push-tokens.ts`                      |
| Inbox UI              | `mobile/app/influencer/(tabs)/inbox.tsx`            |
| Trending screen       | `mobile/app/account-screens/trending-ideas.tsx`     |
| Affiliate links       | `mobile/app/account-screens/affiliate-links.tsx`    |
| AI captions           | `mobile/app/account-screens/ai-caption-results.tsx` |
| Stats analyzer        | `mobile/app/influencer/(tabs)/my-stats.tsx`         |
