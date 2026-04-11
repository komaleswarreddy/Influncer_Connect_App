# Mobile app (`mobile/`) — full UI & navigation inventory

This document lists **every screen, route, bottom tab, navigation chrome, reusable component surface, buttons, labels, pickers/dropdowns, modals, alerts, and notable user-visible strings** as implemented in the codebase. It reflects the **file-based Expo Router** structure under `app/` and shared components under `components/`.

**Note:** There is **no** React Navigation `Drawer` or slide-out sidebar in this project. The **Account** area uses a **vertical menu** (`PremiumCard` + `ListRow` rows with chevrons), which acts as the hub for tools and settings.

---

## 1. App shell & global behavior

### Root layout (`app/_layout.tsx`)

- **Fonts:** SpaceMono (asset), Inter 400/600/700 (Google Fonts).
- **Providers:** `PaperProvider` (React Native Paper), React Navigation `ThemeProvider`, optional `KindeAuthProvider` when `kindeDomain` + `kindeClientId` are set (`lib/auth-config`).
- **Startup:** `loadAuth()` from `auth-store`; shows full-screen **ActivityIndicator** on `palette.surface` until fonts + auth init complete.
- **Stack screens (explicit):**
  - `login` — title “Login”, **header hidden**
  - `register/influencer` — title “Register”, **header hidden**
  - `dashboard` — title “Dashboard”, **header hidden**
  - `influencer` — **header hidden** (nested stack for influencer app)
  - `(tabs)` — **header hidden** (template tabs; see §3)
  - `+not-found` — default header
- **Status bar:** `light` in dark mode, `dark` in light mode.

### Entry redirect (`app/index.tsx`)

- If **authenticated** → `Redirect` to **`/influencer/dashboard`**
- Else → **`/login`**
- While `!isInitialized` → renders `null`

### Legacy redirects

| File | Behavior |
|------|----------|
| `app/dashboard.tsx` | Redirect → `/influencer/dashboard` |
| `app/(tabs)/index.tsx` | Redirect → `/influencer/dashboard` |
| `app/(tabs)/explore.tsx` | Redirect → `/influencer/dashboard` |

---

## 2. Influencer app navigation (primary user flow)

### Stack (`app/influencer/_layout.tsx`)

- **Auth gate:** If not authenticated → redirect to `/login`.
- **On mount (when authed):** `refreshSession()`.
- **Header:** Shown for pushed screens using `appShell.canvas`, `Inter_700Bold` 18pt titles, `palette.primary` tint.
- **Screens:**
  - `(tabs)` — **header hidden** (main bottom tabs)
  - `contract` — **header hidden**, card presentation
  - `campaign-progress` — **header hidden**, card presentation

### Bottom tab bar (`app/influencer/(tabs)/_layout.tsx`) — **`PremiumTabBar`**

Custom bottom bar: white rounded top, **ice-blue pill** behind the active tab, labels in **UPPERCASE** (9pt, semi-bold).

| Tab route | Header title (stack) | Tab label (shown in bar) | Tab icon (Ionicons) |
|-----------|----------------------|--------------------------|---------------------|
| `dashboard` | Home | **HOME** | `home-outline` |
| `campaigns` | Campaigns | **CAMPAIGNS** | `layers-outline` — **stack header hidden** for this tab (`headerShown: false`) |
| `ratings` | Analytics | **ANALYTICS** | `bar-chart-outline` |
| `account` | Settings | **SETTINGS** | `settings-outline` |

**Interactions:** `tabPress` / `tabLongPress` (long press emits navigation event). Active tab uses `palette.primary`; inactive uses `appShell.tabInactive`.

---

## 3. Template `(tabs)` layout — **not the main shell after login**

`app/(tabs)/_layout.tsx` defines **Expo template-style** tabs (used if navigated manually; home flow redirects away).

| Screen | Tab title | Icon (`IconSymbol` — SF Symbols style) |
|--------|-----------|----------------------------------------|
| `index` | Home | `house.fill` |
| `explore` | Explore | `paperplane.fill` |
| `influencer/ratings` | Ratings | `star.fill` |
| `influencer/campaign-progress` | Progress | `chart.bar.fill` |
| `influencer/account` | Account | `person.crop.circle` |

Uses `HapticTab`, `TabBarBackground`, iOS absolute tab bar position for blur.

---

## 4. Screen-by-screen inventory

### 4.1 Login (`app/login.tsx`)

**Hero / branding**

- Eyebrow: “Affiliate Platform”
- Title: “Welcome back”
- Tagline: “Sign in to continue to your workspace”
- Section title: “Sign in”
- Conditional hint (mock auth): “Development: mock email sign-in below.” or “Enter your credentials to access your account”

**Kinde (when configured)**

- `KindeAuthButtons` **premium** appearance: “Continue with Google” (MaterialCommunityIcons `google`), gradient pill
- If `useMockAuth` and Kinde: divider text **“Or mock sign-in”**

**Mock email form (`useMockAuth`)**

- **Fields:** Email, Password (Paper `TextInput` outlined; password **eye / eye-off** toggle)
- **Checkbox:** “Remember me”
- **Link:** “Forgot password?” → opens **Dialog**
- **Primary CTA:** Gradient button **“Sign in”** (or `ActivityIndicator` when loading)
- **Errors:** Inline red text; `authError` / form errors

**Forgot password dialog (`Portal` + `Dialog`)**

- Title: “Reset Password”
- Body: “Enter your email to receive password reset instructions.”
- Email field label: “Email”
- Buttons: **“Send Email”**, **“Cancel”**
- API: `POST .../api/auth/reset-password`

**Footer**

- “© {year} Affiliate Platform. All rights reserved.”
- Links: **Terms** (`https://your-terms-url.com`), **Privacy** (`https://your-privacy-url.com`)

**Config error (no Kinde, no mock)**

- “Set kindeDomain and kindeClientId in app config, or enable useMockAuth for local testing.”

---

### 4.2 Register influencer (`app/register/influencer.tsx`)

**When Kinde configured**

- `SectionHeader`: title “Join as Influencer”, subtitle “Sign in with Kinde. You can complete your profile after login.”
- `KindeAuthButtons` mode **register** (paper style — not premium on this screen)
- Link: “Already have an account? Sign in”
- If `useMockAuth`: subtext “Or use the legacy mock form below (development only).” then **`LegacyMockRegisterForm`** below

**Legacy mock form (`LegacyMockRegisterForm`)**

- `SectionHeader`: “Join as Influencer (dev)”, subtitle about mock registration
- **Text inputs (placeholders):** Full Name, Email, Password, Confirm Password, Phone, Instagram Profile URL, YouTube Profile URL
- **Toggles:** “Show/Hide Password”, “Show/Hide Confirm Password”
- **Niche:** horizontal **chips** — full list in code: Fashion, Beauty, Lifestyle, Fitness, Health, Food, Travel, Technology, Gaming, Education, Business, Finance, Entertainment, Sports, Music, Art, Photography, Parenting, Home & Decor, Automotive
- **Country:** horizontal **chips** — United States, United Kingdom, Canada, Australia, India, Germany, France, Japan, Brazil, Other
- **Bio:** multiline, placeholder “Bio (optional, max 500 chars)”
- **Checkbox:** “I agree to the terms and conditions” (☑/☐)
- **Button:** `PrimaryButton` **“Register”**
- **Link:** “Already have an account? Sign in”

**Kinde not configured and no mock**

- `SectionHeader` “Kinde not configured” + setup instructions
- “Go back”

---

### 4.3 Influencer Home / Dashboard (`app/influencer/(tabs)/dashboard.tsx`)

**Loading:** “Loading...” + spinner

**Header card**

- Title: “Your Stats”
- Button: **“More Details”** (no `onPress` in code — visual only)

**Media kit promo (when any of IG/YT/Twitter connected)**

- Icon: `document-text-outline` (Ionicons)
- Title: “Your Media Kit is Ready!”
- Sub: “View your combined social media analytics in one place.”
- CTA: **“View Media Kit”** → `/account-screens/media-kit`

**Stats row (static demo data)**

- POTENTIAL: `58%`
- Viewers: `65,031` — icon `eye-outline`
- Engagement: `25,214` — icon `chatbubble-ellipses-outline`

**Monthly goal**

- “Monthly Goal”
- “350 Points”, progress bar `53%`

**Social points row:** Instagram / Twitter / YouTube logos (`logo-instagram`, `logo-twitter`, `logo-youtube`) — each `1230` points

**Actions performed**

- “3 Posts Added”, “Premium Plan Bought”, “2 Videos Added”, “Sponsorship Signed” (emoji icons in code)

**Instagram analytics card**

- Title: “Instagram Analytics”
- Connected: green dot + “Connected”
- Else: **“Connect Instagram”** → expands inline
- Inline: “Enter your Instagram username:”, close `close`, placeholder “username”, **“Connect”** / “Connecting...”

**YouTube card:** same pattern — “YouTube Analytics”, **“Connect YouTube”**, username field, **“Connect”**

**Twitter card:** “Twitter Analytics”, **“Connect Twitter”**, placeholder “@username”, **“Connect”**

**Alerts:** Various `Alert.alert` for errors/success on connect; global `error` from store shows “Error” alert

---

### 4.4 Campaigns (`app/influencer/(tabs)/campaigns/index.tsx`)

**Header:** “Campaigns”

**Sub-layout (`campaigns/_layout.tsx`):** Stack with `index` titled “Campaigns”; `campaign-progress` titled “Campaign Progress” (this nested file may not match the root `influencer/campaign-progress` route — see router usage).

**`CampaignFilters` (see §6)** — filter button, chips, modals

**Segmented tabs**

- **“Available Campaigns”**
- **“My Campaigns”**

**Campaign cards (each)**

- Title (or “Untitled Campaign”), status badge
- Description (3 lines max) or “No description available”
- “Type: …”, “Commission: …%” or “N/A”
- Optional “Brand: {tenant name}”
- “Start:” / “End:” dates (“TBD”, “Ongoing”)
- “Niche:”, “Age:”

**Status-specific**

- **Applied:** badge “Applied (Pending Contract)”, “Please review and sign the contract”, button **“View & Sign Contract”**
- **Joined:** **“Track Progress”** → `/influencer/campaign-progress` with params
- **Available:** **“View & Apply”** → opens modal

**Empty states**

- “No campaigns match your current filters.”
- “No available campaigns.” / “No joined or applied campaigns.”

**Pull to refresh** on list

**Join flow alert**

- Title: “Campaign Applied Successfully!”
- Message: “You have applied for the campaign. Please review and sign the contract.”
- **“View Contract”** / **“Later”**

**Modal: Campaign details**

- Close **“✕”**, title **“Campaign Details”**
- Embeds `CampaignDetails` component

---

### 4.5 Campaign details (`components/influencer/CampaignDetails.tsx`) — modal or standalone

- **“Back to Campaigns”** (calls `onClose`)
- Campaign name, status badge, type badge, commission text
- Start/end, target age, niche
- Sections: **Description** (read more/less), **Content Requirements** (bullet list), **Basic Guidelines** (read more/less), **Preferred Platform**
- If participation exists: **Your Participation** — status, joined date, promo codes
- **“Apply for Campaign”** if not joined/applied
- Alerts: success/error on apply

---

### 4.6 Ratings / Analytics tab (`app/influencer/(tabs)/ratings.tsx`)

**Note:** Tab header title is “Analytics” but main heading text is **“Campaign Ratings”**.

**Per participation card**

- Campaign name, status, description
- Type, commission, brand, dates, niche, age
- “Your Rating:” + stars or “Not rated”
- Optional review text
- **“Rate Campaign”** if unrated
- **“View Admin Ratings”**

**Modals**

1. **Rate Campaign:** star picker 1–5, placeholder “Write a review (optional)”, **“Submit Rating”**, **“Cancel”**
2. **Admin Ratings:** list or “No admin ratings yet.”, **“Close”**

**Alerts:** validation and success/error for submit

**Icons:** `star` / `star-outline` for stars

---

### 4.7 Account / Settings tab (`app/influencer/(tabs)/account.tsx`)

**SectionHeader:** title “Account”, subtitle “Tools and profile”

**Profile incomplete banner** (when `profileCompleted === false` or `nextStep === 'COMPLETE_INFLUENCER_PROFILE'`)

- Icon: `person-circle-outline`
- “Complete your profile”
- “Add details in Settings when you are ready.”
- Chevron → `/account-screens/settings`

**Menu (`PremiumCard` + `ListRow`)**

| Label | Ionicons | Route |
|-------|----------|--------|
| Media Kit | `document-text-outline` | `/account-screens/media-kit` |
| Rate Calculator | `calculator-outline` | `/account-screens/rate-calculator` |
| Support | `help-circle-outline` | `/account-screens/support-hub` |
| Settings | `settings-outline` | `/account-screens/settings` |

Each row: optional **chevron-forward**

**Logout**

- If Kinde: **`AccountKindeLogout`** — `log-out-outline`, text **“Log out”**
- Else: same styling, calls `logout()` + `router.replace('/login')`

---

### 4.8 Settings (`app/account-screens/settings.tsx`)

**Shell:** `Screen` with **dot background** (`DotBackground`)

**Horizontal tab bar** (chips)

- **Profile** | **Password** | **Notifications** | **Logout** (with `log-out-outline` when Kinde **Password tab is removed**)

**Logout tab:** Alert “Logout” / “Are you sure you want to logout?” — **Cancel** / **Logout**

**Content by tab**

- **Profile:** `ProfileSection` (see §5)
- **Password:** `PasswordSection` — if Kinde, message about Google-managed password; else full change-password form
- **Notifications:** `NotificationSection`

---

### 4.9 Media Kit (`app/account-screens/media-kit.tsx`)

**States**

- Loading: spinner
- Error: “Could not load Media Kit. Please ensure your accounts are connected on the dashboard.”
- Empty: “Your Media Kit is empty. Connect at least one social media account on your dashboard to view your analytics.”

**Content**

- **“Export as PDF”** / “Exporting...” (captures view → `expo-print`)
- Profile: avatar, `userName`, subtitle “Influencer Media Kit”
- **“Audience Overview”** — paragraph with locations + blended engagement %
- Per platform card (**Instagram** / **YouTube** / **Twitter**): “{Platform} Analytics”, @{username}, Followers or Subscribers, Engagement %, Top Location, Age Range, Male %, Female %

---

### 4.10 Rate Calculator (`app/account-screens/rate-calculator.tsx`)

**Title:** “Influencer Rate Calculator”

**Platform tabs** (FontAwesome icons)

- Instagram (`instagram`), YouTube (`youtube-play`), Twitter (`twitter`) — labels “Instagram”, “Youtube”, “Twitter”

**Inputs**

- Followers / Subscribers — numeric
- Engagement Rate (%) — decimal
- **Niche / Industry** — `@react-native-picker/picker` with all keys from `nicheMultipliers` (Finance/Investment, Technology/SaaS, … General Entertainment, Pets/Animals)
- **Content Type** — picker; options depend on platform (e.g. Standard Post, Video/Reel, Story, Carousel for Instagram)
- **Usage Rights** — picker: Standard, 3 months ads, 6 months ads, 1 year ads

**Result card**

- “Your Estimated Rate”
- USD range and INR range (formatted)

---

### 4.11 Support Hub (`app/account-screens/support-hub.tsx`)

**Top tabs**

- **FAQs** — icon `help-circle`
- **Contact Support** — `MaterialIcons` `support-agent`

**FAQs tab**

- Title “Support FAQ”
- Accordion: each question with `chatbubble-ellipses`, chevron up/down; answer on expand  
- **All FAQ questions (verbatim):**  
  - How do I connect my bank account?  
  - Why is my payment pending?  
  - How does link tracking work?  
  - What does 'engagement rate' mean?  
  - How do I apply for a campaign?  
  - Can I update my profile information?  
  - How do I reset my password?  
  - What if I have a technical problem?  
  - How do I check my campaign status?  
  - How do I contact support?  

**Contact Support tab**

- Title “Contact Support”
- **Issue chips:** Payouts, A Campaign, Technical Problem, My Account
- **Subject** (max 100), **Description** (max 1000)
- **“Pick Image”** (`image` icon) — optional screenshot
- **“Submit Ticket”** / loading spinner
- Success: “Thank you!”, ticket #, “Our team will get back to you within 24 hours.”
- Footer: “Powered by Zopkit”, “Hyderabad, IT-HUB”, “contact@zopkit.com”

---

### 4.12 Campaign Progress (`app/influencer/campaign-progress.tsx`)

**Params:** `participationId`, `campaignId`

**Missing participation**

- Icon `alert-circle`
- “No campaign participation selected.”
- **“Go to Campaigns”**

**Loading:** “Loading progress...”

**Error state:** message + **“Retry”** + **“Go to Campaigns”**

**No data:** `information-circle`, explanation + **“Go to Campaigns”**

**Main UI**

- Header: back `arrow-back`, title **“Campaign Progress”**
- Campaign name + description
- **Overall Progress** — bar + “X of Y completed (Z%)”
- **Content Requirements** — per item: content type, counts, bar, optional “Schedule: …”
- **Submissions:** date, status badge (Approved / Rejected / Pending Review), URL, **Edit** (`pencil`), **Delete** (`trash`), optional “Feedback: …”
- **“Submit Content”** (`add-circle`) when quota not met

**Submit modal**

- “Submit Content”
- “Content Type” (read-only from requirement)
- “Content URL *” placeholder “Enter content URL (Instagram, YouTube, etc.)”
- **Cancel**, **Submit**

**Alerts:** fill validation, delete confirm (“Delete Submission” / “Are you sure…” — Cancel / Delete), success/error

---

### 4.13 Contract (`app/influencer/contract.tsx`)

**Loading:** “Loading contract details...”

**Error:** “⚠️”, “Error Loading Contract”, message, **“Back to Campaigns”**

**Header:** **“← Back”**, title **“Contract Agreement”**

**Section: Campaign Contract Details**

- Toggle **“Show HTML”** / **“Show Text”** when HTML exists
- WebView or stripped plain text; placeholders: “Contract content is empty or invalid”, “Loading contract content…”, “Error loading contract content”

**Digital Signature**

- “Please upload your signature to accept the contract terms and conditions.”
- Admin status: green/yellow dot + long status string about PDF
- **“Upload Signature Image”** / “Uploading...”
- “✓ Signature uploaded successfully”

**Actions**

- **“Download PDF”** / “Generating PDF...”
- **“Accept & Complete”** / “Accepting...” (disabled until signature)

**Success alert:** “Contract Accepted” → OK → `/influencer/campaigns`

**Note:** `SignaturePad.tsx` exists in the repo but **is not wired** into this screen; signing is via **image upload** only.

---

### 4.14 Not found (`app/+not-found.tsx`)

- Stack title: “Oops!”
- “This screen does not exist.”
- Link: “Go to home screen!”

---

## 5. Settings sub-components (embedded modules)

### `ProfileSection`

- **Personal Information:** First/Last name*, Email*, Phone (optional) — placeholders as in file
- **Influencer Profile:** Niche* and Country* via horizontal chips from `constants/influencer-profile.ts` (**INFLUENCER_NICHES** same 20 as mock register; **INFLUENCER_COUNTRIES** 10 countries + Other)
- Bio optional 500 chars — “Tell us about yourself...”
- **Social Media Links:** Instagram, YouTube URLs
- Terms checkbox if needed: “I agree to the terms and conditions”
- **“Save Changes”**

### `PasswordSection`

- **Kinde:** Section “Password”, explanation about Google-managed password
- **Else:** Current / New / Confirm passwords, eye toggles, requirements list, **“Update Password”**

### `NotificationSection`

- **Switches:** Campaign Notifications, Approval Notifications (API-backed)
- **Channels (static UI):** Email “Always On”, In-App “Always On”
- **Frequency (visual only):** Real-time (selected dot), Daily Digest, Weekly Summary — **no API hook** in snippet
- Loading overlay: “Updating settings...”

---

## 6. Campaign filters (`components/influencer/CampaignFilters.tsx`)

**Main row**

- Button: `filter` icon + **“Filters”**; red dot when filters active
- **Active filter chips** with `close` per chip + **“Clear All”**

**Bottom sheet modal: “Filter Campaigns”**

- **Age Group** → opens picker **“Select Age Group”** — options include All Ages, 13-17, … 65+
- **Niche** → **“Select Niche”** — All Niches + fashion, beauty, … automotive (lowercase values)
- **Choose the Brand** → **“Choose the Brand”** — “All Brands” + tenant names; icon `business` on row
- **Date Range** → **“Select Date Range”** — helper text cycles start/end; quick options: **Today**, **Tomorrow**, **Next Week**, **Next Month**
- **“Reset Filters”**, **“Apply Filters”**

**Icons:** `filter`, `close`, `chevron-down`, `business`, `calendar`, `checkmark`

---

## 7. Shared UI primitives (`components/ui/`)

| Component | Role |
|-----------|------|
| `Screen` / `ScrollScreen` | Safe area, optional `DotBackground`, horizontal padding |
| `DotBackground` | Subtle grid background |
| `SectionHeader` | Title, optional subtitle, optional overline |
| `PremiumCard` | Bordered card with optional title row |
| `ListRow` | Icon well + title + subtitle + chevron |
| `PrimaryButton` / `SecondaryButton` | Standard CTAs |
| `PremiumFAB` | Floating action (exported; usage depends on screens) |

**Typography:** `fonts` from `typography.ts` (Inter-based).

---

## 8. Auth helpers

### `KindeAuthButtons`

- Premium: “Continue with Google” / “Sign up with Google”, Google icon, gradient
- Paper: contained `Button` same labels

### `AccountKindeLogout`

- “Log out” with `log-out-outline`; Kinde revoke + local logout

---

## 9. Alerts & system strings (cross-cutting)

Common `Alert` titles/messages include: “Error”, “Success”, “Validation”, “Validation Error”, “Registration Successful”, “Registration Failed”, password reset messages, campaign join/contract messages, support ticket errors, etc. Refer to each screen section above for exact copy.

---

## 10. External / config copy

- Login footer Terms & Privacy URLs are placeholders (`your-terms-url.com`, `your-privacy-url.com`).
- Support hub posts to a **hardcoded** `API_URL` in `support-hub.tsx` (must match deployment).
- `app.json` **extra** keys: `apiUrl`, `useMockAuth`, `useMockApi`, `kindeDomain`, `kindeClientId`, `kindeConnectionId`.

---

## 11. Files present but not part of main navigation UI

- `components/SignaturePad.tsx` — drawable signature component; **not imported** by current contract screen (upload-only flow).
- `CONTRACT_FEATURE.md` — documentation for contract feature.
- Starter components (`ParallaxScrollView`, `HelloWave`, `Collapsible`, etc.) — not enumerated here unless surfaced in a route (most influencer routes use custom layouts).

---

*Generated from source under `mobile/` to give a single reference for QA, product, and onboarding. Update this file when adding screens or changing user-visible strings.*
