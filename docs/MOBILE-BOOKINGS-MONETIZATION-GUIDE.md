# Mobile: Bookings, Monetization & Campaign Types — Beginner Guide

This document explains **why** the influencer app has a separate **Bookings** area, how it differs from **notifications**, and how **Partnership campaigns**, **Public (UGC) campaigns**, **Rate Cards**, and **Rate Card bookings** fit together — with simple examples and industry context.

**Who this is for:** Product, QA, interns, and anyone new to creator/affiliate platforms.

**Where these live in the mobile app today:**

| Feature | Path in app |
|--------|-------------|
| Partnership & Mine campaigns | **Campaigns** tab → Partnership / Mine |
| Public UGC briefs | **Campaigns** tab → Public |
| Rate Card (your prices) | **Settings** → Rate Card |
| Bookings (direct brand requests) | **Settings** → Monetization → **Bookings** |
| UGC earnings summary | **Settings** → Monetization → **UGC earnings** |
| Campaign invites & alerts | **Inbox** (hidden from tab bar; push/deep links → Invites or Bookings) |

---

## 1. The big picture: four ways creators earn money here

Think of the platform as a **mall with different shops**, not one single “campaign” button.

| Money path | Who starts it | How you get paid | Real-world analogy |
|------------|---------------|------------------|--------------------|
| **Partnership campaign** | Brand runs a program | **Commission %** on sales you drive | Brand ambassador / affiliate deal |
| **Public UGC brief** | Brand posts a job on a board | **Fixed fee per video/photo** | Freelance gig on a job board |
| **Rate card booking** | Brand books *you* from your menu | **Your listed price** per deliverable | Ordering from a creator’s menu on Fiverr/Upwork |
| **Affiliate links** (web-focused) | You share tracked links | Commission on clicks/conversions | Amazon Associates-style links |

This app supports **all of these** because real brands and creators don’t use only one model. Industry platforms (Aspire, CreatorIQ, Grin, Collabstr, Fiverr, etc.) separate **campaigns**, **UGC marketplaces**, and **direct bookings** for good reason.

---

## 2. Partnership campaigns vs Public campaigns — clear examples

### Partnership campaigns (Campaigns → **Partnership** & **Mine**)

**What they are:** Longer **brand partnerships** tied to your tenant’s affiliate/influencer program. You apply, may sign a **contract**, post content with tracking, and earn **commission** (e.g. 7.5% or 10%) on results.

**Example — “Acme skincare summer launch”**

1. Brand creates campaign: 10% commission, May–July, niche = Beauty, audience 18–34.
2. You see it under **Partnership**, tap **View & Apply**.
3. Brand approves → you **sign contract** → status becomes active.
4. You post Reels with your link/code → sales tracked → you earn **% of revenue**, not a flat “₹5,000 per video.”
5. You track deliverables under **Campaign progress** (submissions, approvals).

**Mine tab:** Same card layout, but only campaigns **you already applied to or joined** (Applied, Ready to sign, Active).

**Why brands use this:** Performance marketing — they pay when your content drives measurable outcomes.

**Why influencers use this:** Bigger upside if the product sells; ongoing relationship with the brand.

---

### Public campaigns = UGC marketplace (Campaigns → **Public**)

**What they are:** **One-off creative jobs**. Brands post a **brief** (“we need a 30s UGC video showing our protein powder”). You apply; if selected, you **deliver a file**; you get a **fixed payout per piece** (e.g. ₹3,000/video). This is **not** commission on sales.

**Example — “Acme protein UGC brief”**

1. Brand posts brief: ₹4,000 per UGC video, need 20 creators, deadline June 15.
2. You browse **Public → Browse**, apply to the brief.
3. Brand accepts → you film at home → **Deliver** uploads video.
4. Brand approves → you see payment under **UGC earnings** (Settings → Monetization).

**Browse vs My applications (inside Public):**

- **Browse** — Open briefs you can still apply to.
- **My applications** — Briefs you already applied to; deliver when accepted.

**Why brands use this:** They need **ad-ready content** for Meta/TikTok ads, not necessarily your personal audience reach.

**Why influencers use this:** Fast, productized work without negotiating every time; good for side income and portfolio.

---

### Side-by-side comparison

| | Partnership campaign | Public (UGC) brief |
|--|---------------------|-------------------|
| **Tab** | Partnership / Mine | Public |
| **Payment** | Commission % | Fixed ₹ per deliverable |
| **Contract** | Often yes | Usually simpler application |
| **Your audience** | Matters (reach + engagement) | Often **does not** matter (face not always shown) |
| **Brand goal** | Sales & attribution | Creative assets for ads |
| **Typical duration** | Weeks–months | Days–weeks per brief |
| **Example line on card** | “10% commission” | “₹4,000 / piece” |

**Beginner mistake to avoid:** Calling both “campaigns” in conversation is fine in code, but **Partnership** and **Public** solve **different business problems**. Merging them into one list would confuse creators (“why is this one % and that one ₹?”).

---

## 3. Rate Card — what it is and why it exists

### What is a Rate Card?

Your **public price menu** — like a restaurant menu for your creator services.

**Example menu (Settings → Rate Card):**

| Deliverable | Your price |
|-------------|------------|
| Instagram Reel | ₹25,000 |
| Instagram Story | ₹8,000 |
| YouTube Integration | ₹40,000 |
| UGC Video | ₹12,000 |

You toggle:

- **Public rate card** — brands can discover you.
- **Open for direct bookings** — brands can **request** a slot at those prices.

**Rate Calculator** (separate tool) helps you *decide* prices; **Rate Card** is what you *publish*.

### Industry why

- Removes endless DMs: “How much for a Reel?”
- Brands compare creators fairly.
- Platforms like **Collabstr, Fiverr Pro, CreatorIQ bookable rates** use the same pattern.

**Without a rate card:** Every deal is custom email → slow, opaque, easy to undercharge.

**With a rate card:** Brand sees ₹25,000 for a Reel **before** contacting you.

---

## 4. Rate Card Bookings — what they are

### What is a booking?

When a brand **orders** one line item from your rate card — a **direct booking request**, not a full partnership campaign and not a public UGC board job.

**Example — “Direct Reel booking”**

1. You publish Rate Card: Instagram Reel = ₹25,000, open for bookings.
2. Brand **Acme** finds you (web: Book a Creator) and requests: 1× Instagram Reel, brief notes, proposed date.
3. You get a **notification**: “New booking request.”
4. You open **Settings → Monetization → Bookings**, see the request.
5. You **Accept** or **Decline**.
6. If accepted → you create content → **Deliver** → brand reviews → payment (escrow-style flow in product design).

**Bookings screen subtitle in app:** *“Direct requests from brands at your rate card prices.”*

That is accurate: it is the **operational inbox for rate-card deals**, not for partnership campaigns or UGC brief applications.

### Booking vs Partnership campaign vs UGC brief

| | Rate card booking | Partnership campaign | UGC brief (Public) |
|--|-------------------|----------------------|---------------------|
| **Who sets price** | You (rate card) | Brand (commission %) | Brand (budget per piece) |
| **Discovery** | Your public menu | Brand’s campaign list | Public brief board |
| **Competition** | Brand chose **you** | Many influencers apply | Many creators apply to same brief |
| **Typical use** | “Book Priya for 1 Reel” | “Run summer affiliate program” | “We need 50 UGC videos” |

---

## 5. Why Bookings has its own screen (and used to touch notifications)

### What notifications do

Notifications (and push) are **alerts**:

- “New booking request”
- “Campaign invite”
- “UGC application accepted”
- “Payment received”

They answer: **“Something happened — look here.”**

They are **bad** at answering:

- What bookings are **pending** vs **accepted** vs **in progress**?
- What do I need to **deliver today**?
- What is the **full history** of direct bookings?

### What the Bookings screen does

Bookings is a **workspace**:

- List all rate-card bookings
- Accept / decline
- Open deliver flow
- See status (pending, in progress, completed, etc.)

Same pattern everywhere:

| Alert (notification) | Workspace (dedicated screen) |
|------------------------|------------------------------|
| “You have mail” | Gmail inbox |
| “Calendar invite” | Google Calendar |
| “New booking request” | **Bookings** screen |

### How this app connects them

- **Inbox / notifications** still exist; tapping a `rate_card_booking_*` notification **deep-links to Bookings** (`/account-screens/bookings`).
- **Push notifications** use the same routing.
- **Bookings is not duplicated inside notifications** — notifications **point to** Bookings, like a doorbell pointing to your front door.

Previously, teams often stuff bookings into a generic notification list. That works for **5 users** and breaks at **50 bookings** (no filters, no status, no deliver button, mixed with “campaign updated” noise).

---

## 6. Should we remove the separate Bookings screen?

### Short answer: **No — we strongly recommend keeping it.**

### If you removed Bookings and only used notifications

| Problem | What happens |
|---------|----------------|
| No single source of truth | Creator scrolls old alerts to find an active job |
| No clear actions | Accept/decline/deliver buried or missing |
| Mixed mental models | UGC alerts + campaign invites + bookings in one feed |
| Support burden | “Where is my booking?” — no dedicated place |
| Industry expectation | Creators expect a **Bookings** or **Orders** section |

### What you *can* simplify (optional product choices)

| Option | Tradeoff |
|--------|----------|
| Keep Bookings under **Settings → Monetization** only (current) | Fewer tabs; slightly harder to discover |
| Add Bookings badge on Settings when pending requests | Better discoverability without new tab |
| Remove Bookings screen entirely | **Not recommended** — hurts core monetization flow |

### Recommendation for this product

1. **Keep** `Settings → Monetization → Bookings`.
2. **Keep** notification → Bookings deep links (already implemented).
3. **Do not** move booking *management* back into notifications only.
4. Optionally add a **Home dashboard card**: “2 pending bookings” → Bookings (future UX polish).

---

## 7. Monetization section — why it exists

Under **Settings → Monetization** you have:

| Link | Purpose |
|------|---------|
| **Bookings** | Active pipeline for **rate-card** direct deals |
| **UGC earnings** | Summary of **paid/pending UGC** work (Public briefs) |

**Why group these?**

Both are **“money I earn outside traditional partnership commission.”** Creators think in buckets:

- **Campaigns tab** — partnership programs & UGC board (finding work)
- **Monetization** — cash pipeline for direct bookings & UGC payouts (getting paid)

**Payments** (wallet/payout history) lives separately under Account tools because it spans *all* income types.

---

## 8. Other related pieces (quick clarity)

### Campaign invites (not the same as bookings)

- Brand **invites you personally** to a **partnership campaign**.
- Lives in **Invites** flow (`/influencer/invites`), not Bookings.
- Example: “We want you on our Diwali campaign” — relationship invite, not “1 Reel for ₹25k.”

### Catalog & affiliate links

- **Catalog** — your shoppable storefront of products you promote.
- **Affiliate links** — tracked URLs for commission (more web/affiliate persona).
- Different from rate card bookings; overlaps with **Partnership** commission model.

### Rate Calculator vs Rate Card vs Bookings

| Tool | Role |
|------|------|
| Rate Calculator | “What *should* I charge?” (estimate) |
| Rate Card | “Here is what I *do* charge.” (publish) |
| Bookings | “Someone *ordered* at that price.” (fulfill) |

---

## 9. End-to-end story: one creator, one month

**Priya** — beauty influencer, 80K Instagram followers.

1. **Partnership:** Joins Acme’s 10% commission summer campaign (Campaigns → Partnership). Posts 3 Reels with link. Earns ₹18,000 commission in July.
2. **UGC:** Applies to a **Public** brief for a faceless product demo. Delivers 1 video. Earns ₹4,000 flat (UGC earnings).
3. **Rate card:** Sets Reel = ₹22,000. GlowCo books her directly. She manages it in **Bookings** — accept, deliver, get paid ₹22,000.
4. **Notifications:** She only *hears* about new events via push; she *works* in Campaigns, Bookings, and Deliver screens.

That is why the product has **multiple modules** — real creators run **all three** income types.

---

## 10. FAQ

**Q: Is “Public campaign” the same as “UGC”?**  
A: In this app, **yes** — the Public tab is the **UGC brief marketplace** (browse briefs, apply, deliver).

**Q: Can a brand use both a partnership campaign and book me on my rate card?**  
A: Yes. Different products for different needs. Same creator, different deals.

**Q: Why isn’t Bookings on the bottom tab bar?**  
A: To avoid tab clutter. It’s under Monetization; notifications still route there. Product can add a badge or Home card if discovery is low.

**Q: Did bookings used to live only in notifications?**  
A: Notifications always **alerted** about bookings. The **dedicated Bookings screen** is the place to **manage** them — that split is intentional and industry-standard.

**Q: What should QA test?**  
A: Create rate card → brand books (web/API) → push/in-app notification → open Bookings → accept → deliver → status updates. Separately test Partnership apply/sign and Public UGC apply/deliver.

---

## 11. Summary recommendation (strong)

| Feature | Keep? | Why |
|---------|-------|-----|
| Partnership campaigns | **Yes** | Core affiliate/influencer commission model |
| Public / UGC tab | **Yes** | Huge market for ad-content creators; different pricing |
| Rate Card | **Yes** | Standard creator economy primitive |
| Bookings screen | **Yes** | Operational home for direct deals; don’t fold into notifications |
| Monetization section | **Yes** | Groups non-commission money paths clearly |
| Notifications → deep link | **Yes** | Alerts + workspace = best UX |

**Do not remove Bookings** to “simplify” the app — you would simplify the **UI** but complicate the **creator’s life**. Keep notifications as the **doorbell**, Bookings as the **office**.

---

*Last updated to match mobile routes: Campaigns (Partnership / Mine / Public), Settings → Monetization (Bookings, UGC earnings), Settings → Rate Card, hidden Inbox with booking deep links.*
