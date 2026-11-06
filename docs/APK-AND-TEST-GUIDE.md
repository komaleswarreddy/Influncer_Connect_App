# Influencer Connect (Partner Connect mobile): install and end-to-end UI test guide

App name on the phone: **Influencer Connect**. Version 1.0.12 (Android versionCode 18). This guide is for someone holding only the APK and a phone: every test gives the exact taps and the exact text to expect. Texts in `code font` or quotes appear on screen exactly like that.

---

## 1. Install on a phone

1. Copy the APK to the phone (or open the download link on it).
2. When Android asks, allow **Install unknown apps** for the app you opened the APK from (browser or file manager).
3. Open the APK and tap **Install**, then **Open**.
4. If an older version is already installed, install over it (same package). Note whether you stay signed in after the update.
5. On first launch Android may ask for notification permission. Choose **Allow** for the push tests (section 13) or **Don't allow** to test the denied path.


---

##  Launch, sign-up and login

### TC-A1 Launch with no account
1. Open the app for the first time.
2. Expect a centered spinner for a moment, then the **Login** screen: brand text "Influencer Connect" with a chip `FOR CREATORS`, headline `Welcome back.`, line `Enter your email and we'll send you a sign-in code.`, an `Email` field, a **Send code** button, and the link `Don't have an account? Create one`.
3. Press the Android back button: the app closes (it does not go anywhere else).

### TC-A2 Create an account
1. On Login tap **Create one**. Expect the screen **Join as influencer**: subtitle `Create your creator account with just your email`, fields `Email` and `Referral code (optional)`, a checkbox `I agree to the terms and conditions`, a **Send code** button and the link `Already have an account? Sign in`.
2. Tap **Send code** with everything empty. Expect red text `Enter a valid email address.` (no network call).
3. Type `abc`, tap **Send code**: same red text. Try `a@b.c` (invalid) and `a@b` (invalid). Type a valid new email (try capital letters and a trailing space: it is lowercased and trimmed).
4. With a valid email but the checkbox unticked, tap **Send code**: a toast `You must agree to the terms and conditions`.
5. Tick the checkbox (a green tick appears). In the referral field type `ABC` and tap **Send code**: red text `A referral code is 6 letters or numbers. Clear the field to skip it.` Clear the field.
6. Tap **Send code**. The button changes to `Sending code…` and is disabled, then the **Verify your email** screen opens.
7. Check your inbox (and spam) for a 6-digit code.
8. Referral field: typing lowercase turns uppercase; it stops at 12 characters; spaces and dashes are ignored when checking (`nxt-a4e` is valid as 6 letters/digits).

### TC-A3 Verify your email
1. On **Verify your email** you see `Enter the code sent to <your email or a masked address>`, a field `6-digit code`, a **Confirm** button and the link **Resend code**.
2. Tap **Confirm** with an empty or 5-digit code: red text `Enter the 6-digit code.`.
3. Type letters: they are stripped (only digits remain, max 6).
4. Enter a wrong 6-digit code: red text with the server message, or `Could not confirm sign-up.`. You stay on the screen and are not signed in.
5. Tap **Resend code**: toast `Code resent.` and the link becomes `Resend code (30s)` greyed out and counting down. Use the old code after resending: it must be refused.
6. Enter the correct code and tap **Confirm** (`Confirming…`). Expect to land on **Pick your username** (new account).
7. Kill the app on this screen and reopen: you must come back to the correct step, not be logged out of a half-created account.

### TC-A4 Pick your username
1. The screen shows `ONE LAST STEP`, title `Pick your username`, label `Username *` (red asterisk), an input with an `@` prefix and placeholder `your name`, the hint `This is how brands find you across collabs and your media kit.` and a **Continue** button. There is no back or skip control.
2. **Continue** is greyed out until the name is 3 to 30 characters (letters, digits, underscore, space). Type 2 characters: still disabled. Type emoji, `@` or symbols: they are removed as you type. Type 31 characters: it stops at 30.
3. Type only 3 spaces: check what happens (the value trims to empty; this must not create a blank username).
4. Enter a valid name and tap **Continue** (`Saving…`). Expect Home.
5. Try a username that another account already uses: the hint turns red with the server message, or `Could not save your username. Please try again.`.
6. Kill the app on this screen before saving and relaunch: you must return to this screen.
7. Press Android back on this screen: note whether it leaves the screen or is trapped (report the behaviour).

### TC-A5 Create account with an email that already exists
1. Log out first (TC-D7), then on **Join as influencer** enter the email you already registered, tick the checkbox and tap **Send code**.
2. Expect a clear message that the account already exists / to sign in (toast and/or red text). You must not be signed in and must not receive a session.

### TC-A6 Log in with an email code
1. On Login enter your registered email and tap **Send code** (`Sending code…`). Expect the **Enter code** screen with header `Enter code`, subtitle `Enter the code sent to <email>`, a `6-digit code` field, a **Sign in** button and **Resend code**.
2. Tap **Sign in** with fewer than 6 digits: red text `Enter the 6-digit code.`.
3. Enter a wrong code: red text with the server message, or `Could not sign you in.`. Five wrong codes in a row lock that code: after that the correct old code must also be refused, and you need a new code.
4. Tap **Resend code**: toast `Code resent.` then `Resend code (30s)` countdown. The previous code must stop working.
5. Enter the correct code and tap **Sign in** (`Signing in…`). Expect Home (or Pick your username if the account has none).
6. Use the back circle on **Enter code**: returns to Login.

### TC-A7 Login with an unregistered email
1. On Login enter an email that has no account and tap **Send code**.
2. Expect the text `No account found for this email.` and the **Send code** button replaced by **Create account**. Tap **Create account**: it opens **Join as influencer**. Typing in the email field clears the message and brings **Send code** back.

### TC-A8 Session, relaunch and offline
1. While logged in, kill the app (swipe away) and reopen: you land on Home (not Login).
2. Turn on airplane mode and reopen while logged in: you still land on Home from the saved session.
3. On Login with airplane mode on, tap **Send code**: a readable error appears (inline and as a toast) and the button is usable again. There is no endless spinner.
4. Double-tap **Send code**, **Sign in** and **Confirm** quickly: only one request must run (button disables while loading).

---

## 4. Home tab

Bottom bar, left to right: **Home**, **Collabs**, **Stats**, **Settings** (Settings opens the screen titled "Account").

### TC-B1 Home layout
1. Open Home. The header shows an avatar circle with the first letter of your username, `Hi, <username>`, a theme toggle circle (moon in light mode, sun in dark mode) and a bell circle (the label is "Inbox"; a dot shows when there are unread notifications).
2. First load shows a spinner and `Loading your overview`.
3. Tap the avatar or the greeting: **Profile settings** opens. Tap the bell: the inbox opens. Tap the theme toggle: the whole app switches theme at once and the choice survives a relaunch.

### TC-B2 Profile completion card
1. With a new account you see a card with a percentage ring (about `17%` after only a username), title `Complete your profile`, the next missing step, a **Continue** pill and `N of 6 steps done`.
2. The 6 steps are, in order: `Add your username`, `Add your phone number`, `Write a short bio`, `Pick your category`, `Choose your sub-niches`, `Link a social account`. The card shows the first undone one; percentages go 17, 33, 50, 67, 83, 100.
3. Tap the card: **Profile settings** opens. Complete every step (TC-C1), return to Home: the card must disappear at 100%.

### TC-B3 Earnings, rails and storefront card
1. **EARNINGS OVERVIEW** shows two tiles: `My Earnings` (shows `…` while loading, an INR value and `↑ this month`) which opens **Payments**, and `Potential` (INR value and `eligible →`) which opens the **Collabs** tab.
2. If there are open campaigns you have not joined, a rail of cards appears (pill `<pay> comm.`, brand name, campaign name, date range). Tap a card: the campaign details open.
3. If you are in a collab, **MY COLLABS** shows the first collab with percent progress, the `next up` list (rows `DONE` / `PENDING`) and `View full progress`. If there are more, `Show remaining collabs (N)` toggles to `Show less`.
4. Storefront: with no products/services you see `Set up your storefront` / `Add products or services so brands and followers can shop from your page.` and a **Set up storefront** button (opens My Storefront). Otherwise `My storefront` with `open →`, chips `Products`/`Services`, a ribbon `LIVE`, `IN REVIEW` or `DRAFT`, and a count line such as `3 products`.
5. Switch to another tab and back: the data refreshes. Offline launch: loading text then empty sections, no crash.

---

## 5. Profile settings (onboarding data)

### TC-C1 Fill the profile
Reach it from Settings tab > **Profile settings**, the ★ on the identity card, or the Home avatar.
1. Header `Profile settings` with a back circle. Section `Account`: fields `Your Username` and `Enter your phone number` (phone keypad). Email is not editable here.
2. Section `Influencer profile`: a multiline `Tell us about yourself...` (500 character limit), the label `Category *` with a pill `Select your category`, and `Social links (add at least one) *` with five rows: `instagram.com/` + `yourusername`, `youtube.com/@` + `yourchannel`, `x.com/` + `yourhandle`, `reddit.com/user/` + `yourusername`, `linkedin.com/in/` + `yourname`.
3. **Save Changes** is greyed out while the form is invalid and a hint line shows the first error.
4. Tap the category pill: a bottom sheet `Select your category` opens (close X, tap outside to close). Tap an option: it selects and closes at once. The 12 categories: Fashion, Beauty, Lifestyle, Food, Travel, Fitness & Health, Tech & Gadgets, Gaming, Education, Finance & Business, Entertainment & Comedy, Parenting & Family.
5. After a category is chosen, `Sub-niches (pick up to 3)` appears with 5 chips for that category plus an `Other` chip. Example for Fashion: Streetwear, Luxury, Sustainable, Ethnic wear, Accessories. Tap chips to toggle. A fourth selection shows the toast `You can pick up to 3 sub-niches`.
6. Turn on `Other`: a field `Type your sub-niche` appears (30 characters). Leave it empty: the hint says `Type your sub-niche or turn off Other`.
7. Change to a different category: all sub-niches and the Other text clear. Re-picking the same category changes nothing.
8. Social handles accept pasted URLs or `@name`: paste `https://www.instagram.com/foo/?x=1` and it reduces to `foo`; `youtube.com/@chan` becomes `chan`.
9. Fill username, category and one social handle, tap **Save Changes** (`Saving…`). There is no toast: the screen simply goes back (or to Home). Reopen the screen: all values are saved. Return to Home: the completion card percent has changed and the avatar letter updated.

### TC-C2 Validation on Profile settings
Check each in turn; the hint line and toast show the first failing rule in this order:
1. Username under 3 characters: `Username must be at least 3 characters`. Over 30: `Username must be at most 30 characters`. Disallowed characters are stripped as you type; the message `Username can only contain letters, numbers, spaces, and underscores` covers anything else.
2. No category: `Please select your niche`.
3. No social link: `Add at least one social link`.
4. A handle with a space or `!`, or longer than 60 characters: `Invalid Instagram username` (or YouTube / X (Twitter) / Reddit / LinkedIn, matching the row).
5. Other on but empty: `Type your sub-niche or turn off Other`.
6. Phone has no format check: `abc` is accepted as typed. Bio is optional and cannot exceed 500 characters.
7. Another account's username: the server message appears as a toast (or `Failed to update profile`).
8. Go offline and tap **Save Changes**: a toast with the error. Double-tap **Save Changes**: only one save (button disabled while saving).

---

## 6. Account tab and My stats

### TC-D1 Account map
1. Tap the **Settings** tab. Header `Account`, subtitle `Tools and profile`. An identity card shows a circle with your first letter, your username and a ★ button (opens **Profile settings**).
2. A `Fresh collabs` card (`Open campaigns you can apply to`, `open →`) opens the Home tab.
3. Group **CREATOR TOOLS**: `Klear AI assistant`, `Price Card`, `Rate Calculator`, `My Storefront`, `Meet scheduler`, `Events & tickets`, `Leads`, `Brand Kit`.
4. Group **MONETIZATION**: `PriceCard Bookings`, `Invoices`, `Refer & earn`, `Collab ratings`.
5. Group **ACCOUNT**: `Instagram`, `Payments`, `Support`, `Profile settings`. (No WhatsApp row.)
6. Bottom: an outlined **Log out** button.
7. Tap every row once; each must open its screen and the back button must return to this tab. Double-tap a row quickly: it must open only once.

### TC-D7 Log out
1. Tap **Log out**. There is no confirmation dialog: you land on Login at once.
2. Press back: you stay on Login. Kill and relaunch: Login again.
3. Log in as a different account: no data from the previous account must appear anywhere.
4. Log out in airplane mode: it still works (the session is cleared on the phone).

### TC-D2 My stats
1. Tap the **Stats** tab. Header `My stats`, subtitle `Across connected accounts`.
2. If Instagram is connected: a panel `Total Reach` (value such as `1.2K`, or `—`), `avg engagement` and `collabs`.
3. Card `Analyze post URL` with the hint `Paste a post link to pull its metrics into your stats.`, a quota line `N of M analyses left today`, a field `https://instagram.com/p/...` and an **Analyze** button that is disabled while the field is blank.
4. Paste a valid Instagram post URL and tap **Analyze**: the field locks and a pulse shows. On success the field clears, the quota drops by one and a new card appears first under `ANALYZED POSTS` (thumbnail, `X.X% eng`, `N likes`, `Reel · 1.2K reach`).
5. Analyze the same URL again: it must not use another quota slot.
6. Use up the daily quota: the notice `Daily analysis limit reached` appears (`N of M used today. Your free analysis resets at midnight (UTC)...`).
7. Enter a non-URL: the server rejects it with an error line under the card. A failed history load shows red text with a **Retry** link.
8. Tap an analyzed post card: the post opens in the browser. `No posts analyzed yet.` shows when empty. `Load more` appears at the end of long lists. Pull down to refresh.


---

## 7. Collabs: campaigns, UGC briefs, contracts and the inbox

You need a brand/admin test account that can create an active campaign, invite you, approve your application and open a UGC brief. Ask them to prepare: (1) one active campaign you have not applied to, (2) one campaign that will invite you, (3) one open UGC brief with spots left.

### TC-E1 Collabs tab
1. Tap **Collabs**. Header `Collabs`; segmented control **Exclusive | Public | My Collab** (starts on Exclusive). Subtitles: Exclusive `Exclusive brand collaborations`, Public `UGC briefs and public opportunities`, My Collab `Activity and approved work`.
2. **Exclusive** lists active campaigns you have not applied to, joined or been invited to. Each card: title, `Niche · Mon D – Mon D`, pay label, brand chip, `Active`. Empty state: `No exclusive collabs` / `New brand collaborations show up here. You can also browse Fresh collabs on Home.` / button **Browse fresh collabs** (opens Home).
3. **Public** lists open UGC briefs (card: title, `Niche · Content type` or `Open brief`, pay, green `Open` chip). Briefs you already applied to are hidden. Empty state: `No public briefs` / `Open UGC opportunities from brands will appear here when available.`
4. **My Collab** sections: `collab activity` (pending applications, status `Submitted`, relative time like `5m`/`3h`/`2d`), `ugc briefs` (one card per UGC application with a status chip), `approved` (chips `Completed`, `Active` or `Open contract`, then `That's all for now`) and a dashed card `Looking for more work?` / **Browse fresh collabs**. If all are empty: `No collabs yet` / `Submitted applications and approved collabs land here. Apply from Fresh collabs on Home.`
5. Pull down on each segment to refresh. Offline: old data stays and a red error line shows.

### TC-E2 Apply to a campaign
1. Collabs > Exclusive > tap a campaign (or Home > Fresh collabs card). The details screen opens with a back arrow, brand, `<Niche> campaign`, status chip and tabs **Earnings | Details | Deliverables**.
2. Earnings: `How you earn`, pay values and `Revenue to date`. Details: `Collab timeline` and `Brief` (`Read more` / `Show less` past 180 characters). Deliverables: `Content requirements` (rows like `×3 instagram reel (schedule)`) or `No content requirements listed yet.`
3. Bottom button **Apply** with the note `<pay label> · contract required before content goes live`. Tap it: toast `Application submitted` and the screen closes.
4. Collabs > Exclusive: the campaign has gone. Collabs > My Collab > `collab activity`: a row with status `Submitted`.
5. Ask the brand to **reject** your application. Pull to refresh: the activity row disappears and the campaign reappears in Exclusive, where the details screen shows `The brand did not approve this application. You can submit again.` with **Apply** enabled.
6. Applied and waiting: the details screen shows `Application submitted — waiting for brand approval.` and no button. Applying again to an already-applied campaign must be refused with a server message (record the text). Double-tap **Apply**: only one application is created.
7. A suspended or rejected creator account must not be able to apply (ask the admin to suspend a test account).

### TC-E3 Approved application and contract
1. Ask the brand to **approve** your application. Open the campaign: button **Review & sign contract** with `You are approved. Sign the contract to activate this collab.` (if you see **Refresh status** with `Your application was approved. Pull to refresh if this persists.`, pull to refresh).
2. Tap it: screen **Contract agreement** with a hero `contract review`, card `Overview` (Brand, Pay, Runs, Type), `Description` and `Terms`.
3. Label `Digital signature`: tap the dashed **Upload signature**. If you deny photo access: toast `Please grant permission to access your photo library`. Allow it, pick an image (cropped 3:1). The button shows `Uploading...` then `Signature uploaded · Replace`, with a preview. The main button is `Signature required` (disabled) until a signature exists, then **Accept contract**.
4. Tap **Accept contract** (`Accepting...`): toast `Contract signed` and you land on Collabs; the campaign is `Active` under `approved`.
5. Reopen the contract: `Contract signed` / `This agreement is complete.` with no buttons.
6. Open the contract of an application the brand has not approved: `Error Loading Contract`, text `The brand still needs to approve your application before you can view or sign this contract.` and **Back to My collabs**.
7. Replace the signature before accepting; cancel the picker; double-tap **Accept contract** (only one acceptance); go offline and try (toast `Failed to accept contract. Please try again.` or the server text).

### TC-E4 Track progress and submit content
1. Collabs > My Collab > approved campaign > **View progress**, or Home > `MY COLLABS` > a collab card. Screen **Collab progress**, subtitle `<Campaign> · <Brand>`.
2. Summary card: `submitted`, `N / M`, `X of Y deliverables done`, percent pill, bar and milestones `Contract signed`, `Content live`, `Payout`.
3. `requirements` section: each row shows the content type, `N of M · schedule`, a `Done`/`Pending` chip, a bar and **Submit content** (hidden once the requirement is complete). Submissions list rows with a date, chip (`Pending Review`, `Approved`, `Rejected`), the URL, **Edit**, **Delete** and `Feedback: …`.
4. Tap **Submit content**: modal `Submit Content`. Fields: read-only `Content Type`, `Content URL(s) *` (first placeholder `Paste post URL (or multiple URLs)`, then `URL 2`, `URL 3`…), `+ Add URL (n/10)`, a `×` per extra field, quota line `X of Y analyses left today`, **Analyze Post** (or **Analyze all (N)** with several URLs), **Cancel**.
5. Validation (red text under the field): empty -> `Empty URL`; a link that is not YouTube (`youtube.com/watch`, `youtu.be/`, `youtube.com/shorts`), Instagram (`instagram.com/p/` or `/reel/`), TikTok (`tiktok.com/@…/video/`, `vm.tiktok.com`) or Twitter/X (`twitter.com`, `x.com/…/status/`) -> `Unsupported platform. Use YouTube, Instagram, TikTok, or Twitter/X`. A platform badge appears for valid links. Toasts: `Paste a post URL to analyze`, `Please analyze the post URL before submitting.`, `Please enter a content URL`.
6. Paste several URLs separated by spaces, commas or newlines: they split into fields, duplicates drop, the cap is 10 (`Maximum 10 URLs` at 10; try 11).
7. Analyze a real public post: a metrics card appears with **Submit as Campaign Proof**. Tap it: toast `Content submitted successfully!`, the modal closes and a submission row with `Pending Review` appears.
8. Bulk: **Analyze all (N)** shows `Results: a/b successful`, a **Submit this proof** per result (toast `URL submitted as campaign proof.`) and `N URL(s) failed. Fix and retry those URLs.`
9. Daily limit: after the quota is used the notice `Daily analysis limit reached` / `Your free analysis resets at midnight (UTC). You can still submit the URL as campaign proof without a new analysis.` appears with **Submit URL**.
10. Security check: try `javascript:alert(1)` as a link: it must be rejected (unsupported platform).
11. **Edit** a `Pending Review` submission: a box `Enter new content URL` with **Save** / **Cancel**; Save gives `Submission updated successfully!`. Only one Edit can be open at a time. **Delete**: confirm dialog `Delete submission?` / `Are you sure you want to delete this submission?`, success toast `Submission deleted successfully!`.
12. Ask the brand to approve a submission: **Edit** and **Delete** on an approved one must be refused by the server (record the message). Submitting before the contract is signed must also be refused.
13. `Promo assets`: `Tracking link` with **Copy** (toast `Link copied`) and `Promo code` with an `Active` chip. Before the contract is signed: `No tracking link or promo code yet. The brand issues these once the contract is signed.`
14. Requirement-less campaign: `No requirements configured yet` / `You can still submit your campaign URL as proof using Post Analyzer.`

### TC-E5 Inbox: invites and notifications
1. Home > bell icon. Header `Inbox`, subtitle `Invites and collab notifications`. Segmented control **Invites | Notifications** (`Notifications (N)` when there are unread).
2. Ask a brand to invite you to a campaign. **Invites** shows a card with a `New invite` badge, the campaign name, `Brand · pay`, `Expires: <date>`, **Decline** and **Accept**. Empty: `No pending invites.`
3. **Accept**: toast `Booking accepted` (the wording is shared with bookings) and the **Contract agreement** screen opens (see TC-E3). **Decline**: toast `Invite declined` and the card disappears (no confirm dialog). Double-tap either button: only one action. An invite the brand cancelled or that expired must not be acceptable.
4. **Notifications** shows unread first, then newest. Each row: icon, title (`New invite`, `Invite approved`, `Invite accepted`, `Invite rejected`, `Invite expired`, `Campaign active`, `Payment received`, `Booking request`, `Deliverable submitted`, `Booking update`, `UGC update`, `Campaign update`), an unread dot, two lines of text, time (`now`, `5m ago`…) and **Open**. Empty: `No notifications yet.`
5. **Open** goes to: New invite -> Invites tab with that invite highlighted; Approved with a participation -> Contract; campaign, invite and UGC updates -> Collabs; booking notifications -> PriceCard Bookings (no card is highlighted); Payment received -> Payments. Failure toast `Could not open notification`.
6. Reopen a read notification: it stays, in muted style. The unread count in the tab label must match the dot on the Home bell.

### TC-E6 Public UGC briefs
1. Collabs > **Public** > tap a brief. Screen **UGC brief**: hero image, pill `UGC brief · Open`, title and product, tiles `rate` (`/ piece`) and `deadline` (`5 Nov` style, plus `N spot(s) left` or `N pieces`), label `What to deliver` with chips (`1 vertical video`, `Product stills`, `1 reel`, `Stories`, `UGC bundle`, `N piece(s)`, `Raw files`).
2. Tap **View & Apply** (`Submitting…`): the cover note `I'd like to create this content` is sent automatically (there is no input). Toast `Your application was submitted.` and you go back to Collabs. The brief leaves Public and appears under My Collab > `ugc briefs` with chip `Pending brand review`.
3. Apply again (reopen from My Collab): `You have already submitted an application for this brief.` Full or closed briefs: server messages `All spots are filled`, `Brief is not open for applications`. Double-tap **View & Apply**: only one application.
4. Statuses to see as the brand moves your application (chip / full label): `Pending brand review`; `Accepted` / `Accepted — tap to deliver content`; `In progress`; `Submitted` / `Submitted — awaiting brand review`; `Revision requested` / `Revision requested — resubmit content`; `Approved` / `Approved — payment released`; `Approved by brand`; `Deliverable rejected`; `Declined by brand`.
5. When accepted the screen shows `You are accepted. Send your content when it is ready.` with **Deliver content**; after a revision request `The brand asked for changes. Update your content and send it again.` with **Resubmit content**.

### TC-E7 Deliver content (UGC brief and PriceCard booking)
Both screens work the same. UGC: UGC brief > **Deliver content** (subtitle is the brief title). Booking: Settings > PriceCard Bookings > **Deliver content** (subtitle is the content type).
1. Screen **Deliver content**: label `Uploads` with a dashed `+ Upload` tile, label `Note to brand` (`Anything the brand should know`), label `Content link` (`https://...`), button **Submit delivery**.
2. **Submit delivery** with nothing: toast `Upload a file or paste a share link before submitting.`
3. Tap `+ Upload`: deny photo access -> toast `Allow photo library access to upload.`; allow and pick a photo or video: a thumbnail with a `Photo` or `Video` badge appears.
4. Submit with a file (`Submitting…`): toast `Delivery submitted for review` and the screen closes. The booking pill becomes `In review`; the UGC chip becomes `Submitted`.
5. Submit with only a link: `abc` is saved as `https://abc`; `javascript:alert(1)` must be refused by the server (`Validation failed` or `Invalid driveLink URL`).
6. Server rules to try: a file over 100 MB -> `File must be 100MB or smaller`; unsupported type (for example a .zip renamed .jpg) -> `Accepted types: JPEG, PNG, WebP, GIF, MP4, MOV, WebM, PDF` or `File content does not match its declared type`; delivering again while a review is pending -> `Your submission is already awaiting brand review`; delivering before the brand accepts -> `Application must be accepted by the brand before you can deliver content`. If file upload is not configured on the server the app shows `File upload is not set up on the server. Use a Google Drive or video URL instead.`
7. **Known issue to confirm:** the `Note to brand` text is never sent (it is discarded). Type a note, deliver, and ask the brand whether they received it. If not, record it as a bug.
8. Double-tap **Submit delivery**: one delivery only. After delivering, reopen the UGC brief from the list to see fresh state (the old screen may still show **Deliver content**).

### TC-E8 PriceCard bookings
1. Settings > monetization > **PriceCard Bookings**. Header `Price card bookings`, subtitle `Direct requests from your price card`. Empty: `No booking requests yet.` and a footer **Open Price Card**.
2. Ask a brand to book you. A card shows the brand (or `Brand`), content type (for example `Instagram Reel`), the rupee total and a pill: `Pending`, `Accepted`, `In progress`, `In review`, `Revision`, `Completed` or `Declined`.
3. `Pending`: **Decline** and **Accept**. **Accept**: toast `Booking accepted`, pill `Accepted`, **Deliver content** appears. **Decline**: toast `Invite declined` (shared wording), pill `Declined`.
4. Double-tap Accept/Decline: the buttons have no disabled state, so the server answers `Booking already responded` in a red box (record it). The error box has **Retry**. Pull to refresh.
5. `Revision`, or `In progress` with a revision request, shows **Deliver content** again (TC-E7).

### TC-E9 Price card and rate calculator
1. Settings > creator tools > **Price Card**. Header `Price card`, subtitle `Set public prices so brands can request direct bookings`. With an incomplete profile a banner `Profile settings required` / `Complete your profile settings (niche, country, and save your profile) before requesting AI suggestions.` with **Go to profile settings**.
2. Ten rows with `₹` and placeholder `0`: Instagram Reel, Instagram Post, Instagram Story, YouTube Integration, YouTube Dedicated, TikTok Video, UGC Video, UGC Photo, Appearance fee, Consultation fee. Only digits and a dot are accepted.
3. **Get AI suggestions** (`…` while loading; with an incomplete profile it opens the dialog `Profile required` with **Open profile settings**). Each row then shows `Suggested ₹X / Use` and an explanation. Tap a `Use` box to fill one row. **Apply suggested** is disabled until suggestions exist; it fills all rows with the toast `Suggested amounts filled in` but does not save.
4. Switches **Public price card** and **Open for direct bookings** (both on by default). Tap **Save**: toast `Saved`. Reopen: values persist. Failure toasts `Save failed` / `Failed to load price card`.
5. With **Open for direct bookings** off, a brand booking attempt must fail (`Creator is not open for bookings`); with a rate of 0 it fails with `Rate not set for this content type`. Typing `1.2.3` should be rejected (`Validation failed`).
6. Settings > **Rate Calculator**: header `Rate calculator`, subtitle `Estimate what a collaboration is worth`. Fields `Followers / subscribers` (digits, default 50000), `Engagement rate` (default 3.5), chips for Niche (Fashion, Fitness, Tech, Food, Lifestyle), Content type (Instagram Reel, Instagram Post, Instagram Story, YouTube Integration) and Usage rights (Organic only, Paid ads 30d, Whitelisting). There is no button; `Your estimated rate` updates instantly.
7. With the defaults (50000, 3.5, Lifestyle, Instagram Reel, Organic only) the result should be **₹59,670**. Try: 0 followers -> ₹0; Tech raises it (×1.6 vs Lifestyle 1.0); Story ×0.8; Paid ads 30d ×1.3; Whitelisting ×2.0; engagement above 5 ×1.5. Followers under 1000 use the lowest tier.

### TC-E10 Collab ratings
1. Settings > monetization > **Collab ratings**. Header `Collab ratings`, subtitle `Rate partnerships and view brand feedback`. Dark card `Your average` with `N / 5` (or `— / 5`).
2. Each participation card: brand initials, title, date, chip `X ★` or `Unrated`, **Rate campaign** (only when unrated) and **View brand ratings**. Empty: `No campaign participations found.`
3. **Rate campaign**: modal with five stars, `Write a review (optional)` (500 characters), **Submit rating**, **Cancel**. Submit with no star: toast `Please select a rating`. Submit: toast `Rating submitted successfully!`, the chip updates and **Rate campaign** disappears.
4. **View brand ratings**: modal `Brand ratings` with `X ★` chips, `Pending review` for unapproved ones, or `No brand ratings yet.`, button **Close**.
5. Try rating a campaign that is not completed and note whether the server allows it. You must see only approved public ratings or your own, never another creator's.

### TC-E11 Payments and earnings
1. Settings > account > **Payments** (or Home > `My earnings` tile). Header `Payments`, subtitle `Brand payouts, UGC and referral earnings`. Dark card `Total received` with `Recorded by brands for your work`. Tile `₹X potential` / `Across N eligible collab(s)` / `N active`.
2. `brand payouts` rows: campaign name, `Mon D, YYYY · status`, `+₹amount`; empty: `No brand payouts yet. When a brand records a payment, it will show here.` Ask the brand to record a payment: it appears and Home's `My Earnings` updates.
3. `ugc earnings` card with **View UGC earnings →**, and `referral rewards`. On **UGC earnings** (header `UGC earnings`, subtitle `Paid and pending UGC work`): `Total earned`, **Browse briefs**, rows `+₹amount`.
4. **Probable bug to confirm:** the UGC totals appear to always show ₹0 with no rows because the screen reads different field names than the server returns (`totalReleased`, `totalEscrowed`, `totalPending`, `payments`). After a UGC payment is released (TC-E6 step 4, `Approved — payment released`) check the UGC earnings screen. If it shows ₹0, record it as a bug.
5. Offline: red error line `Failed to load payments` (or the server message). Pull to refresh works.

---

## 8. Events, meets, invoices, leads, storefront, brand kit, referrals

All rows below are under the **Settings** tab (the screen titled "Account"). Pull down to refresh lists. Load failures show a card `Couldn’t …` with a **Try again** button. For paid passes and paid meets the server must have online payments (Razorpay) enabled; if it does not, you will see the notices quoted below.

### TC-F1 Create an event
1. Settings > creator tools > **Events & tickets**. Header `Events`, subtitle `Host events and sell tickets`. Empty state: `NO EVENTS YET` / `Create your first event and start selling.` with tiles `Sell tickets`, `Collect payments`, `Invite & manage`, `Hassle-free check-ins` and **Create event**.
2. Tap **Create event**. Screen **Create event**; the top-right link is `Save Draft`.
3. `Event banner` (hint `16:9 · PNG, JPG or WEBP · max 5MB`): tap `Upload event banner`. Deny photos -> toast `Allow photo access to add a banner`. Pick an image (16:9 crop); a spinner shows; **Remove banner** appears. A wrong type or over 5 MB: `The banner must be a PNG, JPG or WEBP image` / `The banner must be 5MB or smaller`.
4. `Event name *` (counter `n / 80`, placeholder `e.g. Creator Growth Masterclass`), `Description` (5000 characters; start a line with `- ` for a bullet).
5. `Date & schedule`: pills `Starts` and `Ends` (default tomorrow 6:00 PM to 8:00 PM). Tap one: sheet `Pick date & time` with month arrows, day grid (past days greyed out), wheels Hour / Min (5-minute steps) / AM/PM, **Cancel**, **Confirm**. Changing the start moves the end so the event keeps its length (at least 30 minutes).
6. `Venue & location`: segmented `In person` / `Online`. In person: `Venue name, e.g. WeWork BKC`, `Building, street, city`. Online: `Join link (Zoom, Meet…)` with the hint `The join link is only shown to people who have a ticket.`
7. `Event capacity *` (default `100`, digits only, 6 digits max). Switch `Show remaining tickets publicly` (on) with the hint `Shows an “Only N passes left” pill when seats run low.`
8. Validation (toast and red text under the field, first error only): empty name `Give your event a name`; end before start `The event must end after it starts`; capacity 0, negative or decimal `Enter a whole number of attendees (1 or more)`; online link not starting with http:// or https:// `The join link must start with http:// or https://`. Server: over 14 days `An event can last at most 14 days`; capacity over 100000 is rejected.
9. Tap **Save Draft**: toast `Draft saved` and **Event** (detail) opens. Or tap **Continue to Pass Setup**: the event is created as a draft and **Passes** opens. Double-tap it: only one draft must appear in the list.

### TC-F2 Passes and publish
1. On **Passes** (subtitle is the event title): empty state `No passes yet` / `Add the ticket types people can book, like General or VIP.` with **Add a pass**.
2. If a pass is paid and the server has no payment keys: red banner `Online payments are not enabled on this server yet, so paid passes can not be sold. Make the passes free, or ask your admin to enable payments.`
3. Form `New pass`: `Pass name, e.g. General` (60), `What is included (optional)` (300), `Price (₹, 0 = free)` (0), `Tickets available *` (50), `Max tickets per order *` (5). Buttons **Cancel**, **Add pass**.
4. Validation toasts in this order: `Give the pass a name`; `Offer at least 1 ticket`; `Tickets per order must be between 1 and 10`; price between 0 and 1 `A paid pass must cost at least ₹1, or be free`. A blank or negative price becomes free; decimals in quantity are rounded down. Server: `An event can have at most 8 passes` (add a ninth); on a published event with payments off `Online payments are not enabled on this server, so paid passes can not be added`.
5. **Add pass**: toast `Pass added`. Each pass card shows name, price (`Free` or ₹), `N sold · N left of N · max N per order`, **Edit**, **Delete**. Edit: toast `Pass updated`. Delete: dialog `Delete this pass?` / `“<name>” will be removed.` (no success toast, the pass disappears). After a sale: price edit `This pass already has orders, so its price can not change. Add a new pass instead.`; quantity below sold `N of this pass are already sold or held`; delete `This pass already has orders and can not be deleted`; deleting the last pass of a live event `A live event needs at least one pass`.
6. Draft events show **Publish event** and **Save and finish later**; others show **Done**. Try **Publish event** with problems: no passes `Add at least one pass`; no venue `Add a venue or address`; online without link `Add the link people will use to join the online event`; end in the past `The event has already ended`. With everything valid: toast `Your event is live` and **Event** (detail) opens.

### TC-F3 Event detail, sharing and the public page
1. **Event** screen: banner, title, status chip (Draft, Upcoming, Live now, Ended, Cancelled), date range, place. Tiles `Tickets sold` (`of CAP · N left`), `Checked in`, `Revenue` (`₹X after fees`), `Free orders` (`N awaiting payment` or `RSVPs`).
2. Published only: label `share` with the link and **Copy** (toast `Link copied`), **Share** (Android share sheet), **Open** (browser) and a QR captioned `Scan to open the event page`.
3. `manage` buttons: **Scan tickets** (published only), **Attendees (N)**, **Passes**, **Edit details**, **Publish event** (draft), **Unpublish** (published), **Cancel event** (published), **Delete draft** (draft).
4. **Unpublish**: dialog `Take this event offline?` / `It goes back to draft and its link stops working until you publish again.` After tickets are sold it is refused: `Tickets have already been sold, so you can not take the event back to draft. Cancel it instead.` **Cancel event**: dialog `Cancel this event?` with **Cancel event** / **Keep it**; toast `Event cancelled` (or `Cancelled. N order(s) to refund.`); a red notice `N order(s) (₹X) need a refund. Refund them from your payment dashboard.` appears for paid orders. **Delete draft**: dialog `Delete this draft?` / `It will be removed permanently.`; refused when orders exist.
5. Open the public link in a browser (`<base>/e/<event-slug>`; a draft or unpublished event shows a not-found page). You see pills (`Cancelled`, `Ended`, `Sold out`, `Only N passes left`, `Happening now`), title, `Hosted by …`, `When and where`, `About this event`, and **Get tickets**: a quantity dropdown per pass, `Your name`, `Email (your tickets are sent here)`, `Phone (optional)`, **Continue**.
6. Public form errors: `Please enter your name`; `Please enter a valid email address`; `Please enter a valid phone number or leave it blank`; `Choose at least one ticket`; `You can buy at most N "<pass>" tickets per order`; `Only N "<pass>" ticket(s) left`; `"<pass>" is sold out`; `This event has ended`; after three unfinished checkouts `You already have unfinished checkouts for this event. Finish one or wait a few minutes.`
7. Free order: the private tickets page opens with `You're in! Show a QR code below at the entrance.`, a QR, code, pass and name per ticket and `Add to calendar`. Paid order: redirect to the Razorpay page (held for 30 minutes), then the tickets page; while waiting `Waiting for your payment to be confirmed. This page refreshes on its own. If you already paid, it will update within a minute.`
8. An event that was cancelled shows `This event has been cancelled. If you bought a ticket, the host will arrange a refund.`

### TC-F4 Attendees and ticket scanner
1. Event > **Attendees (N)**. Header `Attendees`, subtitle `X of Y checked in`, button **Scan tickets**, search `Search name, email, pass or code`, chips `All`, `Not yet`, `Checked in`. Rows show name, `<pass> · <CODE>`, email and **Check in** / **Undo** / a grey `Cancelled` chip. Empty: `No attendees yet` / `People who book a ticket appear here, ready to check in.`
2. **Check in** has no toast; it flips to **Undo** and the counter changes. **Undo** reverses. Server toasts: `This event is not live`, `Already checked in`, `This ticket was cancelled`, `This ticket is not checked in`. Double-tap: busy-locked. Search by partial code and combine with a filter.
3. **Scan tickets**: header `Scan tickets`, subtitle `N checked in this session`. Without camera permission: `Camera access needed` / `Allow the camera to scan the QR codes on tickets. You can also type a ticket code below.` and **Allow camera** (after a permanent denial the button is **Open settings**).
4. Scan the QR from a public tickets page: banner `Checked in` (green) with the attendee and pass, a short vibration. Scan again after 3 seconds: `Already checked in` (amber). A second read within 3 seconds is ignored silently. Other banners: `Ticket cancelled`, `Not for this event`, `Ticket not found` (all red, double vibration).
5. Manual entry: label `Or type the ticket code`, placeholder `e.g. K7M2QX9TBW`, **Check in**, **Done**. Codes are 10 characters from A–Z and 2–9 (no 0, O, 1, I, L); spaces and dashes are ignored; a pasted ticket URL works. The field clears after every attempt. Server toasts: `Publish the event before checking people in`, `This event was cancelled`.
6. Offline: a toast with the error. Leave and reopen: the session counter resets.

### TC-F5 Meet scheduler
1. Settings > **Meet scheduler**. Header `Meet scheduler`, subtitle `Paid or free 1:1 sessions`. Empty state: `Create sessions, connect and grow` / `Schedule meets and connect with your audience in just a few taps.`, tiles `Accept bookings`, `Manage availability`, `Get paid`, and **Get started**.
2. Google card states: not configured on the server `Google Meet is not set up yet` / `Google sign-in is not configured on the server. Bookings still work, but you will need to share the joining link yourself.`; not connected `Connect Google Calendar` / `Get a Google Meet link on every booking and hide times you are already busy.` with **Connect Google**; needs reconnect **Reconnect**; connected `Google Calendar connected` / `Meet links are created on <email>.` with **Disconnect** (dialog `Disconnect Google Calendar?` / `New bookings will no longer get a Meet link or calendar event. Existing ones are not changed.`).
3. With meets: tiles `Upcoming`, `Sessions`, `Earned`; buttons **New meet** and **Bookings**; cards with title, `Live`/`Draft` chip, price (a discount shows the struck-through original and `NN% off`), `· N min`, a schedule summary like `Mon–Fri · 09:00 AM – 05:00 PM`, `N upcoming · N total`, and **Copy** / **Share** / **View** (live) or **Finish & publish** (draft). Copy: toast `Link copied`.

### TC-F6 Create a meet (four steps)
Header changes per step: `Meet details`, `Meet availability`, `Meet pricing`, `Preview and share`. Header back moves one step back.
1. **Details** (`Create your meet service`): `Meet title *` (60), `Description *` (500), optional `Insights` (max 10, **Add insight**, placeholder `e.g. Portfolio review`) and `Testimonials` (max 5, fields `Name`, `What they said`). **Continue**. Toasts: `Give your meet a clear title`; `Add a description so people know what the meet is about`; `Fill in or remove the empty insight`; `Fill in or remove the incomplete testimonial`.
2. **Availability** (`Set your availability`, `Times are in <timezone>…`): seven day cards with switches (Monday–Friday on, 09:00 AM – 05:00 PM). Tap a time pill: sheet `Start time` / `End time` (wheels, **Cancel**, **Confirm**). `+` adds a range (max 4 per day), `−` removes. `Duration` chips `15 min`, `30 min`, `60 min`, `Custom` (field `Minutes (15 to 240, multiple of 5)`). Toasts in order: `Duration must be 15 to 240 minutes`; `Duration must be a multiple of 5 minutes`; `Switch on at least one day`; `<Day>: the end time must be after the start time`; `<Day>: time ranges cannot overlap`; `Make at least one time range as long as the session`; `No room left in this day for another range`; `At most 4 ranges per day`; `Start earlier than 11:55 PM`; `The end time must be after the start time`. A start moved past its end makes the end jump one hour later; an end of 12:00 AM means end of day.
3. **Pricing** (`Set the price for this slot`): switch `This session is free`; otherwise `Original price *` and `Selling price *` (placeholder `₹ 000`). Text `After the N% platform fee you receive ₹X per session.` A preview box shows the discount. Toasts: `Enter the original price, or choose Free`; `Enter a selling price, or choose Free`; `Prices cannot be negative`; `A paid meet must cost at least Rs.1`; `The selling price cannot be higher than the original price`; payments off `Online payments are not enabled on this server yet. Choose Free for now.` Button **Save and preview** (saves a draft).
4. **Preview and share** (`Booking page preview`): card `1:1 Meet` with **Edit**, bullets `What we will cover`, `About this session`. Tap **Get link**: toast `Your meet is live`, then `Your booking link` with **Copy**, **Share**, **Open** and the button becomes **Done**. Paid meet with payments off: `Online payments are not enabled on this server, so a paid meet cannot be published yet`.
5. Leave after step 3: a `Draft` meet remains in the list. Reopen a live meet and edit it: saving keeps it live. Double-tap **Save and preview** and **Get link**: no duplicates.

### TC-F7 Public meet page and bookings
1. Open the public link (`<base>/m/<meet-slug>`). You see `1:1 Meet · N min`, title, `with <host>`, price (struck-through original when discounted, `Free` when free), `About this session`, `What we will cover`, `What others say`, **Pick a time** (time-zone dropdown with **Update**, day picker, slots), and the policy `Full refund if you cancel at least 24 hours before the session, or if the host cancels. Later cancellations are not refunded.`
2. Slots appear only in the next 30 days, inside your weekly availability, starting at least 60 minutes from now and not overlapping existing bookings or Google busy times.
3. Pick a slot: form `Almost there` with `Full name`, `Email`, `Phone (optional)` and **Confirm booking** (free) or **Pay ₹X and book** (paid). Errors: `Enter your name`; `Enter a valid email address`; `That time is no longer available. Please pick another.`; `You already have unfinished checkouts. Finish one or wait a few minutes.`; `This meet is not open for booking`; `Online payments are not enabled for this meet right now`.
4. Free booking: the booker's private page shows the time, the Meet link (if Google is connected), `Add to calendar` and `Need to change plans?` with cancel and reschedule. Paid booking: Razorpay, with the slot held 15 minutes and the booking `Awaiting payment`.
5. Booker rules: cancel and reschedule are allowed only until 24 hours before the session (after that `Rescheduling closes 24 hours before the session. Please contact the host.`), a full refund on a cancel at least 24 hours ahead, a maximum of 2 reschedules. The cancel page button is `Yes, cancel my booking`; the reschedule page is `Pick a new time`.
6. In the app: Meet scheduler > **Bookings**. Header `Bookings`, subtitle `Sessions people have booked with you`, segments **Upcoming** / **Past**. Cards: buyer, status chip (`Awaiting payment`, `Confirmed`, `Completed`, `Cancelled`, `Failed`, `Refund due`), meet title, time, `Free` or ₹. Empty: `No upcoming sessions` / `Share your booking link and sessions will show up here.` and `No past sessions yet` / `Completed and cancelled sessions appear here.` with **Open Meet scheduler**.
7. Tap a booking: **Booking** screen with `Booked by`, `Email`, `Phone`, `Amount`, `Platform fee`, `Rescheduled`, `Cancelled by`, `Refund`. Confirmed bookings show `Joining link` with **Join**, **Copy** (toast `Meet link copied`), **Share**, or `No Meet link yet. Connect Google Calendar in Meet scheduler so every booking gets one, or message <name> your own joining link.` **Cancel session** (future confirmed bookings only): dialog `Cancel this session?` with **Cancel session** / **Keep it** and the refund text (`<name> will get a full refund of ₹X and be told by email.` or `<name> will be told by email.`); toast `Session cancelled`.

### TC-F8 Invoices
1. Settings > monetization > **Invoices**. Header `Invoices`, subtitle `Track all your invoices and payments`. Segments **Create** (default) | **History**.
2. **Create** form (line `New invoice · <next number>`): `Bill to`: `Brand name *` (`e.g. Nike India`), `Contact person`, `Email address` (`client@email.com`), `Billing address`, `Brand GSTIN (optional)` (`e.g. 29ABCDE1234F1Z5`, uppercased); `Due date` pill plus chips `Net 7`, `Net 15`, `Net 30` (default), `Net 45`. `Deliverables`: description (`e.g. Instagram Reel`), `Qty` (1), `Rate`, auto `Amount`, **Remove** (with more than one row), **Add deliverable** (up to 50). `Discount & tax`: `None` / `% off` / `Flat off`, `Discount (%)` or `Discount amount`, `Tax name` (`GST`), `Tax (%)` with chips `No tax`, `5%`, `12%`, `18%`, `28%`. `Payment & notes`: `Payment details` (`UPI ID or bank account details`), `Notes`. A collapsible `Your details` (pre-filled). A dark totals panel updates live. Button **Save draft**.
3. Validation (toast and red text, first error): `Brand name is required`; `Enter a valid email`; `Due date cannot be before the issue date`; `Add at least one deliverable`; `Every deliverable needs a description`; `Quantity must be more than 0`; `Every deliverable needs a rate`; `A percent discount cannot be more than 100`; `Tax cannot be more than 100%`. A flat discount above the subtotal is capped at it. Rows with no description and no rate are ignored.
4. **Save draft**: toast `Draft saved` and the invoice opens. Save two drafts quickly: the numbers must differ.
5. **History**: tiles `Outstanding` (`nothing overdue` or `N overdue · ₹X`) and `Paid`; chips `All`, `Drafts`, `Sent`, `Overdue`, `Paid`, `Cancelled`; cards show brand, `INV-number · due 12 Nov 2026`, status chip and total. Empty: `No invoices yet` / `Create your first invoice and send it to a brand in a minute.` with **Create invoice**, or `Nothing here` / `No invoices match this filter.` with **Show all**.
6. Invoice detail by status: Draft: **Send to brand**, **Edit draft**, **Mark as paid**, **Download PDF**, **Cancel invoice**, **Delete**. Sent: **Resend by email**, **Mark as paid**, **Download PDF**, **Cancel invoice**. Paid: **Download PDF** only. Cancelled: **Download PDF**, **Delete**.
7. **Send to brand**: card `Email invoice` (`The PDF is attached. The brand can reply straight to you.`) with `brand@company.com`, `Add a short message (optional)` and **Send now**. Toast `Sent to <email>`. Errors: `Enter the brand’s email address`; `Add the brand email before sending`; `We could not send the email. Check the address and try again.` Check the email arrives with the PDF attached and no raw HTML.
8. **Mark as paid**: dialog `Mark as paid?` / `Record INV-… (₹X) as paid. This can’t be undone.`, toast `Marked as paid`. **Cancel invoice**: toast `Invoice cancelled`. **Delete**: dialog `Delete this invoice?`, toast `Invoice deleted`. **Download PDF** opens the PDF (`No app on this device can open the PDF`, or `This link has expired. Open the invoice again to get a new one.`). A non-draft invoice cannot be edited: toast `Only draft invoices can be edited`.

### TC-F9 Leads
1. Settings > **Leads**. Header `Leads`, subtitle `Brand enquiries and collaborations`. Tiles `New` (`N unread` or `all caught up`) and `Won` (₹). Button **Add a lead**, search `Search name, company, email or message`, chips `All · N`, `New · N`, `Contacted · N`, `Won · N`, `Lost · N`. Empty: `No leads yet` / `Publish your Brand Kit and brands can send you enquiries straight from your link. You can also add leads yourself.` with **Open Brand Kit**, or `No leads match this filter or search.`
2. **Add a lead**: fields `Name *` (`Contact person`), `Company`, `Email` (`name@company.com`), `Phone` (`+91 98765 43210`), `Budget` (`e.g. ₹50,000`), `What they need`. Validation: `Enter who this lead is`; `Enter a valid email`. **Add lead**: toast `Lead added` and the lead opens.
3. Lead detail: hero with the stage chip, deal value, `Came in through your media kit` or `Added by you`; `Contact` card with **Email**, **WhatsApp**, **Call** (disabled without a valid email/phone; a bare 10-digit number is treated as +91); `Stage` chips `New`, `Contacted`, `Won`, `Lost` (toast `Moved to <Stage>`); **Won** opens `What is the deal worth? (optional)` with `₹ amount`, **Cancel**, **Mark won** (toast `Marked as won`); `Your notes` (`Call notes, quotes, next steps`) with **Save notes** (toast `Notes saved`); **Create invoice** (opens Invoices with the brand pre-filled); **Edit details** (manual leads only: toast `Lead updated`; kit leads: `Enquiries from your kit can’t be edited. Add a note instead.`); **Delete lead** (dialog `Delete this lead?`, toast `Lead deleted`).
4. A lead sent through the public brand-kit form (TC-F11) appears with `· from your kit` and an unread dot; opening it removes the dot.

### TC-F10 My storefront
1. Settings > creator tools > **My Storefront** (or Home > storefront card). Header `My storefront`, subtitle `Products and services you sell to followers`. Chips `Products` and `Services` (separate catalogs). A card with the count, status pill (`Live`, `Review`, `Rejected`, `Draft`), a rejection reason in red when rejected, or `Ops is reviewing this catalog. You can keep editing after reopening.` when in review.
2. Empty: `Set up your storefront` / `Products and services you sell to followers.`, then after setup `No products yet` / `Add products followers can buy.`
3. **Storefront setup** (`Set up what you share with followers`): `Storefront name *`, `Cover photo *` (`Tap to add cover photo` / `Required`, dialog `Cover photo` / `Choose a source` with **Take photo**, **Choose from gallery**, **Cancel**), products only `Product type` chips (Food, Clothing, Beauty, Restaurant, Shoes, Digital, Other), `Description (optional)` (`n/200`). **Continue →** stays disabled until a name and a cover photo exist. Permission denied: `Allow access to add a cover photo.` Server: `Image must be 5MB or smaller`; `Accepted types: JPEG, PNG, WebP`.
4. **Build your catalog**: `Category *` dropdown (suggestions per type, for example Food: Meals, Snacks, Beverages, Combos, Specials; Services: Consultations, Packages, Add-ons, Home Visits, Online Sessions; every list ends with `Other` which shows `Enter category name`) and **Add** (toast `Category added`). Toasts: `Select a category.`; `Enter a category name.`; `That category is already in this catalog.`
5. `+ Add product` / `+ Add service` opens the item sheet: photo (`Tap to add photo` / `Required`), `Product name *` (`e.g. Butter Chicken`), `Price (₹) *`, services also `Duration (minutes) *` (60), `Where` chips (Home, Center, Online, Virtual), `Price label (optional)` chips (`Per session`, `Per hour`), `Description (optional)` (200). Toasts: `Enter a product name.`; `Enter a valid price.` (above 0); `Add a product photo before saving.`; `Enter duration in minutes (at least 5).` Delete a category: dialog `Delete category?` / `Remove "<name>" and all its products?`; delete an item: `Delete product?`.
6. **Preview storefront** (disabled with 0 items) shows the store name, `@<username> · N products` and a grid. **Submit for review**: dialog `Submit for review?` / `Your product catalog will be sent to our team for approval.`; success returns to My storefront with the pill `Review`. Server rejections: `Add at least one category before submitting`; `Category "<name>" must have at least one product`; `Product "<name>" must have an image before submit`; `Complete catalog setup before submitting`; `Catalog is already live`.
7. Editing in review: `Catalog is under review and cannot be edited`; editing a live catalog: `Live catalog cannot be edited until a future update flow is available`. **Share link** before approval: toast `Live link will appear once Ops finishes publishing.`

### TC-F11 Brand kit
1. Settings > **Brand Kit**. Phase 1: `PORTFOLIO CREATOR`, `Your brand kit, built in seconds.`, a profile card, `Everything in your portfolio` (`Creator score`, `Smart price range`, `One-link media kit`, `QR code`), **Select template and build**.
2. Phase 2: `Pick a look` / `You can switch templates any time.` Templates Classic, Bold, Minimal, Dark. **Build my kit**: toast `Your brand kit is ready. Review it, then publish.`
3. Phase 3 (manage): card `Your kit is live` / `Your kit is not published` with a Publish switch. Publish on: toast `Published. Your link is live.` Off: dialog `Unpublish your kit?` / `Anyone opening your link or QR code will see "not available" until you publish again.`, toast `Unpublished`. **Copy**, **Share**, **Open** (disabled until published) and a QR (`Scan to open your media kit`).
4. `creator score` (or `Not enough real data for a score yet. We never invent numbers.`), `price range`, `template`, `about you` (`Display name`, `Headline` (`e.g. Fitness creator from Anantapur`), `Bio`, **Write with AI** with the dialog `Replace your headline and bio?` when text exists), `featured work` (up to 5 links: `Title, e.g. Best reel`, `https://`; at five `You can feature up to 5 links.`), `what brands see` (switches `Audience stats`, `Creator score`, `Rates and price range`, `Show contact email`, `Accept enquiries (form on your page)`, `Contact email`), `link name` (`Your link ends with`, a live `This link name is available`).
5. **Save changes** (`Brand kit saved`; disabled and labelled `Saved` when unchanged). Validation: `Enter a valid contact email`; `Add a contact email or switch "Show contact" off`; `Give every link a title`; `Every link needs an address`; a link not starting with http:// or https:// is refused; link name: `Use at least 3 characters`, `Use at most 30 characters`, `Use only lowercase letters, numbers and single dashes`, `That link name is reserved, please pick another`, `That link name is already taken`.
6. Public page `<base>/k/<slug>` works only when published. With **Accept enquiries** on, **Send an enquiry** asks `Your name`, `Work email`, `Company (optional)`, `Budget (optional)`, `Phone (optional)`, `What do you have in mind?` (at least 10 characters); success `Your enquiry has been sent to the creator. They will reply by email.` Failures: `This creator is not taking enquiries through their media kit right now.` and `This creator has reached the daily enquiry limit. Please try again tomorrow.` The enquiry then appears in Leads.

### TC-F12 Refer & earn
1. Settings > monetization > **Refer & earn**. Header `Referral Program`, subtitle `Invite friends and earn rewards`. Hero `START EARNING WITH REFERRALS`, a dashed code box `YOUR REFERRAL CODE` (6 characters) with copy and share icons, `how it works` (`01 SHARE CODE`, `02 FRIEND SIGNS UP & PURCHASES`, `03 YOU EARN ₹200`), **INVITE NOW**, `your referrals` (tiles `Earned`, `Friends`, friend rows with chips `Joined`, `Reward earned`, `Paid out`; empty `No one has joined with your code yet. Share it to get started.`).
2. Copy icon: toast `Referral code copied`. Share icon and **INVITE NOW** open the share sheet.
3. Apply a code (a second test account): card `Have a friend’s code?` with `Referral code` (uppercased, 12 max) and **Apply code**. Not 6 letters/digits: `Enter the 6-character referral code`. Success: toast `Referral code applied`. Server messages: `That referral code is not valid`; `That referral code does not exist`; `You cannot use your own referral code`; `You have already used a referral code`; `That creator already joined through you`. After applying the card reads `You joined with code XXXXXX.`
4. Referral code at sign-up: on Join as influencer the referral field is remembered and applied after the new account signs in (TC-A2).

---

## 9. Instagram, content scheduling, DM automation, Klear AI

### TC-G1 Instagram hub and connect
Needs an Instagram **Business or Creator** account, added as a tester if the Meta app is not live. The backend must have `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` and `INSTAGRAM_PUBLIC_BASE_URL` (public HTTPS) set, and the Meta redirect URI must match; otherwise the connect toast shows `INSTAGRAM_PUBLIC_BASE_URL is not set. Meta OAuth requires a public HTTPS tunnel URL.` (record it as a server configuration problem, not an app bug).
1. Settings > account > **Instagram**. Not connected: header `Instagram` / `Not connected`, card `Connect your Instagram` / `One connection powers DM automations and scheduled reels, posts, and stories.`, button **Connect Instagram**, dimmed cards `Schedule Content` and `DM Automation`, and a working row `Trending ideas`.
2. Tap **Connect Instagram** (`Connecting…`). A browser tab opens on Instagram's authorization page for the account you are signed into. Approve. A dark page shows `Instagram connected` / `Your Instagram account is linked. Tap below to return to the app.` with **Return to app**, and the app opens by itself (`affiliateplatform://instagram-connected?success=1`).
3. Connected state: subtitle `@username`, a dark bar `@username` / `<accountType> · connected` with a `Live` chip, and rows `Schedule Content` (`N post(s) scheduled`), `DM Automation` (`N automation(s) active`), `Trending ideas` (`AI briefs for your niche`), and **Disconnect Instagram**.
4. If publishing permission is missing a banner `Reconnect to schedule posts` / `Publishing permission is missing. Reconnect Instagram to enable the content scheduler.` with **Reconnect Instagram**.
5. Failure cases: close the browser half way (nothing happens, still not connected); wait more than 20 seconds (toast `Instagram connection timed out.`); a failed login returns `Connection failed` on the web page and an error toast in the app.
6. **Disconnect Instagram**: dialog `Disconnect Instagram?` / `DM automations will pause. Scheduled posts stay in your queue but will not publish until you reconnect.` with **Cancel** / **Disconnect**. Double-tap Connect: the button is disabled while busy.

### TC-G2 Schedule a post
1. Instagram > **Schedule Content** (connected only). Header `Schedule content` / `Publish on your timeline`. Tiles **New post** (`Reels, posts, and stories`) and **Calendar** (`N scheduled`), card `AI captions` (`Pick a caption to use`), label `Upload your reel` with up to two thumbnails and `+ Upload`.
2. Tap **New post**: form `Schedule content` / `Reels, posts, and stories`. Chips `Reel`, `Post`, `Story`. `Media *` with `+ Choose media`: Reel opens a video file picker, Post the photo library (images), Story images or videos. The upload starts at once and a thumbnail with a green tick appears. Errors (toast): `Only image or video uploads are supported`; `Video must be 500MB or smaller`; `Image must be 8MB or smaller`; `Empty file uploaded`; `File upload is not configured on the server. Submit a content link (Google Drive, YouTube, etc.) instead.`
3. `Caption` (placeholder `Write a caption`, 2200 characters) with **Ask the AI**; `Hashtags` (`#creator #brand`, 1000). `publish at` shows the default (tomorrow 3:00 pm) with **Change**: sheet `Pick date & time` (month arrows, past days greyed out, wheels Hour / Min / AM/PM, **Cancel**, **Confirm**).
4. `DM Automation (optional)` with a `+` / `−` toggle opens the DM form (see TC-G4 field list).
5. Tap **Schedule** with no media: toast `Upload a reel, image, or story first.` With a time less than 10 minutes ahead: `Pick a time at least 10 minutes from now.` With the DM form open and name, keywords (unless Match is Any) or reply empty: `Fill in the DM automation name, keywords, and reply.` Text + link without a link: `Add a link URL for text + link replies.`
6. Valid post: button `Scheduling…`, then a modal `Scheduled` / `Your content is queued and will publish at the selected time.` with **View calendar** and **Done**. Instagram disconnected: `Connect Instagram before scheduling content`.
7. Double-tap **Schedule**: one post only. Back before scheduling: the draft is lost.

### TC-G3 Calendar
1. Schedule content > **Calendar**. Header `Calendar` / `Scheduled content`. A month card with `‹` `›` and the title (`November 2026`), days with posts highlighted green, and below a list of the month's posts with thumbnail, date and time, caption (or content type), an `Auto DM` chip and, on failure, `DM link failed · Retry` in red. Empty: `No scheduled posts this month.`
2. **Cancel** (only on `scheduled` posts): dialog `Cancel scheduled post?` / `This will remove the post from your queue.` with **Keep** / **Cancel post**. After confirming the list refreshes. Only your own uploaded media is deleted from storage.
3. `DM link failed · Retry`: dialog `Retry DM link?` / `This will try to connect your automation to the published post again.`; success toast `Your automation is now active on the published post.`
4. Navigate between months and check a published or failed post has no Cancel pill. There is no edit action in this version.

### TC-G4 DM automation
1. Instagram > **DM Automation** (connected only). Header `DM automation` / `Manage Instagram auto-replies`; tiles `Delivered` and `Automations`; label `automations` with **Create**. Empty: `No automations yet` / `Auto-reply to comments, story replies, and DM keywords.` Cards show name, `<Comment keyword | Story reply | DM keyword> · <exact match | contains | any>`, `Active`/`Paused` chip and up to 6 keyword chips. Not connected: `Connect via Instagram hub` / **Go to Instagram hub**.
2. **Create**: three steps `Content`, `Trigger`, `Reply` (tap only earlier dots to go back).
   - Step 1 `Pick a reel, post, or story`: chips `Reels`, `Posts`, `Stories` and up to 6 thumbnails (tick = selected). **Next** without a pick: `Pick a reel, post, or story to automate.`
   - Step 2 `When should we reply?`: `Automation name *` (`e.g. Comment LINK reply`, auto-filled), `Trigger type` (`Comment keyword` for reels/posts, `Story reply` for stories), `Match` (`Contains`, `Exact`, `Any`), `Keywords *` (`LINK, INFO, PRICE`, hidden for Any; comma or new line), `Public comment reply` (`Check your DMs!`, comment trigger only). Toasts: `Give this automation a name.`; `Add at least one keyword.`
   - Step 3 `What should we send?`: `Reply type` (`Custom`, `Text + link`, `AI replies`); `Reply message *` (`Thanks for reaching out!`) or, for AI, `AI context *` (`Describe your brand, offer, and tone...`); link URL (`https://...`) and link label (`Shop now`). Toast `Add a reply message.`
3. **Create automation** (`Saving…`): you return to the list and the card appears. If the content already has an active automation: dialog `Automation exists` / `This content already has an active automation for this trigger. Replace it?` with **Cancel** / **Replace** (the old one is deactivated).
4. A server rejection shows `Validation failed` (name over 200 characters, link label over 80, public reply over 1000, AI context over 4000, Text + link without a valid link).
5. Tap a card: **Automation details** (name, `Automation details`): rows `Trigger`, `Match`, `Reply`, `Status`; `Keywords` chips; `Reply preview` bubbles; **Pause automation** / **Resume automation** (the Status row flips), **Edit** (edit screen: `Edit automation`, same steps, **Save**), **Delete** (dialog `Delete automation?` / `This cannot be undone.`), and a recent activity list. A missing automation: toast `Automation could not be loaded.`
6. End to end (needs Meta webhooks): comment the keyword on the connected reel from another Instagram account and check the DM arrives and `Delivered` increases.

### TC-G5 Trending ideas and AI captions
1. Instagram > **Trending ideas** (works without Instagram connected). Header `Trending ideas` / `AI briefs for your niche`. Field `Optional keyword or topic` and **Refresh** (`Refreshing…`). Status line `Cached brief (refreshes every few hours)` or `Fresh brief from your profile`. Idea cards: title, hook, `best time` chip, **Use for schedule**. Enter submits the keyword. Pull to refresh. **Use for schedule** opens the form with the caption and hashtags filled in.
2. **AI captions** (from Schedule content or **Ask the AI**): header `AI captions` / `Describe the post, then pick a caption`. Field placeholder `e.g. Butter chicken reel for Sunday lunch`, **Suggest captions** (`Suggesting…`, disabled when empty). Section `examples from your profile` or `suggestions` with numbered cards (tone tags Playful, Direct, Story-led), **Copy** (toast `Caption copied`) and **Use this caption**, which returns the caption and hashtags to the form. With no profile data: `Save your niche and bio in Profile settings to get tailored examples.` Failure: `Caption generation failed`.

### TC-G6 Klear AI assistant
1. Settings > creator tools > **Klear AI assistant**. Header `Klear AI` / `Your creator AI assistant` with a `New chat` pencil and a `Chat history` clock. Empty state `Hi, I’m Klear AI.` / `Ask me about content ideas, growing your audience, pricing and pitching brands. I use your own stats, and I’ll tell you when I don’t have the data.`, starters `How can I grow my engagement?`, `Give me 5 reel ideas for my niche`, `How should I price a brand collab?`, `Write a pitch message to a brand`, `What should my bio say?`, the disclaimer `Klear AI can make mistakes and can’t take actions for you…` and the usage line `N of M messages left today`.
2. Tap a starter or type in `Ask Klear AI anything` and tap the up-arrow: your bubble, `Klear AI is thinking…`, then the reply; the counter drops by one. The field stops at 1000 characters (`Keep messages under 1000 characters`).
3. At zero left: `You have used all of today’s Klear AI messages. They reset tomorrow.`, the line `Daily limit reached. Resets tomorrow.` and a disabled field `Come back tomorrow`. The server also limits to 20 messages a minute.
4. Failure (go offline): your bubble is removed, the text returns to the box and a toast shows (`Klear AI could not answer. Please try again.`).
5. **New chat** clears the chat. **Chat history**: header `Chat history` / `Your conversations with Klear AI`, **New chat**, cards with title, time and a red trash icon. Tap a card to reopen (`Could not open this chat` on failure). Trash: dialog `Delete this chat?` / `“<title>” and its messages will be removed permanently.`; failure `Could not delete this chat`. Empty: `No chats yet` / `Ask Klear AI for content ideas, pricing help or a brand pitch and your conversations will appear here.` with **Start a chat**. Error: `Couldn’t load your chats` with **Try again**.

---

## 10. Support and account settings

### TC-H1 Support
1. Settings > account > **Support**. Header `Support` / `FAQs and direct help`. `Common questions`: eight accordion rows (`+` / `−`, one open at a time). Card `Contact Support`: `Enter subject`, `Describe your issue`, **Pick Image** (becomes `Image picked` with a 100×100 preview), **Submit Ticket** (`Submitting…`). Footer `Powered by Zopkit / Hyderabad, IT-HUB`.
2. Submit with an empty subject or description: the request is sent and the server answers `Missing required fields` in red (the app does not block it).
3. Submit a valid ticket: the form is replaced by `Ticket #<number> received. We’ll get back to you within 24 hours.` Confirm the admin sees the ticket attributed to **your** account. If the session is stale: `User or tenant information missing. Please log out and log in again.`
4. Photo-library permission prompt, double-tap Submit (disabled while submitting), offline: red `Failed to submit ticket`.

### TC-H2 Settings availability
- Profile settings is covered in TC-C1 and TC-C2. The Password tab appears only when the build has no Cognito configuration; in a normal build you only see the Profile form (and, if a Password tab shows, `You sign in with Cognito Single Sign-On. Change your password from the Cognito Hosted UI (Forgot password), not from this screen.`).
- There is no delete-account option, no About/version screen and no notification settings screen in this version. Push notifications are not enabled in this build (no permission prompt). The in-app bell on Home opens the Inbox (TC-E5). The version is under Android Settings > Apps > Influencer Connect.

---

## 11. Robustness and security spot checks

- [ ] Rotate the screen, background and resume the app for a minute, switch to dark mode: no layout break, no logout.
- [ ] Weak network (throttle or weak signal): loading states show; no duplicate records when you tap twice. Tap every primary create button twice quickly (invoice, event, meet, booking accept, UGC apply): only one record each.
- [ ] Airplane mode on every list screen: the old data stays and a readable error appears; no infinite spinner.
- [ ] Open a shared link such as `affiliateplatform://` from another app: the app opens normally and does not sign you in or out.
- [ ] Links from other users (campaign content links, deliverable links, profile links) open only if they begin with http:// or https://; others show an error toast.
- [ ] HTTPS only: with a proxy CA installed on the phone the app's requests must fail (user CAs are not trusted in release builds).
- [ ] Android Settings > Apps > Influencer Connect > Permissions: only Camera and Photos/Storage; no microphone, no "display over other apps".
- [ ] App data is not included in cloud backups.
- [ ] After **Log out** and logging in as another user, no data from the first user appears.
- [ ] Sign in on a second phone with the same account; log out on one: the other keeps working until its own logout.

## 12. How to report a bug
Include: the test ID (for example TC-E4 step 7), what you did, what you expected, what happened, a screenshot or screen recording, the time with time zone, the email used, device model, Android version, and the app version (1.0.12, code 18). For a login problem also say whether the server had been idle for several minutes.

## 13. Known items to confirm while testing
These were found by reading the app's code and need a real device to settle:
1. UGC earnings and the UGC part of Payments may always show ₹0 (the screen reads different field names than the server returns) (TC-E11).
2. `Note to brand` on both Deliver content screens is never sent to the server (TC-E7).
3. `Accept` on a campaign invite shows the toast `Booking accepted` and `Decline` on a booking shows `Invite declined` (shared wording) (TC-E5, TC-E8).
4. On Pick your username a value of only spaces passes the pattern check (TC-A4).
5. Android back on Pick your username may or may not leave the screen (TC-A4).
6. Editing a rejected campaign submission does not reset it to pending (TC-E4).
7. Unreachable screens (do not report): phone login and phone sign-up, Hosted-UI sign-in, WhatsApp, Affiliate links, Edit schedule.

## 14. After the backend is deployed
Repeat sections 3, 7, 8 and 10 once the latest backend is on Render and note the differences. These should now behave differently: sign-up needs a real code (an empty or already-registered code is refused); submitting content before signing the contract is refused; repeated accepts and approvals return a conflict instead of duplicating; creators see only their own and approved public ratings; partner portal bank and KYC changes need an admin or manager; more than three order or booking emails per recipient per hour are skipped; rapid repeated requests to public pages may return `too many requests`.
