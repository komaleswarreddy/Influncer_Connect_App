# Influencer Connect — Feature Overview

_Mobile app for creators, built on Expo/React Native, backed by the shared Zopkit affiliate-management API._

---

## 1. Product Summary

Influencer Connect is the mobile home base for creators who work with brands: it's where they discover paid campaigns, sign contracts, prove their content is live, get paid, and run the operational side of being a creator — a storefront, a rate card, Instagram automation, and a content calendar — all in one app. Brands post campaigns and review submissions on a separate web dashboard; this app is the influencer's side of that relationship. It solves the fragmentation creators usually deal with — DMs for briefs, spreadsheets for rates, screenshots for proof of posting, a different app for scheduling — by putting the entire campaign lifecycle (discover → apply → contract → deliver → get paid) and the entire personal-brand toolkit (storefront, pricing, automation, analytics) behind one login. It's built for creators anywhere on the follower spectrum, from someone with a few thousand followers running their first brand deal to an established creator managing several campaigns and a public storefront at once.

---

## 2. All Features & Capabilities

### Onboarding & Account

- **Email/password sign-up with guided profile setup** — niche, country, and social handles are captured at registration so campaign matching has something to work with from day one.
- **One-tap social sign-in** via a shared AWS Cognito identity pool — creators aren't forced to create a new password just for this app.
- **Username claim step** on first login — a short, forced onboarding beat that gives every creator a stable public handle before they touch the rest of the app.
- **Profile management** — bio, niche, avatar, and connected social handles, editable at any time from Settings.
- **Password change flow** for accounts using email/password, separate from the social-login path.
- **Push notification registration** — the app registers a device push token on login so campaign invites, approvals, and payout events can reach a creator even when the app is closed.
- **In-app notification center** — a running feed of everything that needs attention (new invite, submission approved/rejected, payment received), with unread badges surfaced on the tab bar.

### Campaign Discovery & Application

- **Browse campaigns** in two lanes — _Exclusive_ (brand-curated, often invite-first) and _Public_ (open applications) — plus a _Mine_ tab for everything already joined, so a creator never has to hunt for "what did I actually sign up for."
- **Niche and category filtering**, plus an advanced filter sheet (brand, date range) for creators managing a high volume of opportunities.
- **Swipeable campaign feed** with full campaign cards — cover photo, brand, niche, pay, and status — for fast scanning.
- **Full campaign detail view** — description, guidelines, deliverable requirements, pay structure, and target audience, everything a creator needs to decide before committing.
- **Direct brand invites** — brands can invite specific creators straight into a campaign, skipping the public application queue entirely; these show up in the Invites tab with Accept/Decline.
- **Campaign applications** for public campaigns, with status tracking (applied → under review → accepted/declined) visible the whole way through.
- **Eligible-but-not-joined campaign surfacing on the dashboard** ("Fresh Collabs") — a lightweight discovery nudge without having to open the full campaign list.

### Contracts & Legal

- **In-app contract review and e-signature** — full campaign terms rendered natively, with a digital signature step before a creator is officially locked into a campaign; no external PDF tool or email round-trip required.
- **Generated contract PDF** available for a creator's own records after signing.
- **Legal/payment terms attached per campaign** (rate breakdown, usage rights, compensation model — fixed, performance-based, or a hybrid of both) so pay expectations are explicit before content goes out, not negotiated after.

### Campaign Execution & Proof of Work

- **Per-deliverable progress tracking** — every required piece of content (a set number of Reels, Stories, YouTube videos, etc.) has its own completion counter, so "am I done with this campaign" is answered at a glance instead of by memory.
- **Content submission with a built-in post analyzer** — a creator pastes a live post URL and the app automatically detects the platform, validates the link, and pulls back real engagement metrics (reach, likes, comments) to attach as proof — no manual screenshotting.
- **Bulk URL submission** — paste multiple post links at once (e.g. a week's worth of Stories) and have them analyzed together instead of one at a time.
- **Submission history with edit/delete**, so a mistake (wrong link, wrong content type) doesn't require contacting support.
- **Approve/reject visibility on every submission**, with brand feedback surfaced directly in the app when something is sent back.
- **Promo assets per participation** — a personal tracking link and/or promo code issued for a joined campaign, with one-tap copy, so affiliate-style campaigns don't require a creator to separately request a link from the brand.
- **Post-campaign ratings** — creators rate their experience with a brand after a campaign wraps, building a two-sided reputation signal over time.

### UGC & Booking Work (outside full campaigns)

- **UGC briefs** — shorter, self-contained content requests (a single video or photo set, not a full campaign) that a creator can browse, apply to, and deliver against independently.
- **Rate-card bookings** — brands can book a creator directly off their published rate card (see below) for a one-off deliverable, with its own delivery and payment flow separate from the campaign system.

### Storefront / Personal Catalog

- **Build a public storefront** for either physical products or bookable services — a creator picks a business type, uploads a cover photo, and organizes items into categories.
- **Full product/service catalog editor** — add, edit, and delete items with pricing, photos, and (for services) duration and visit type (in-salon, at-home, online, virtual).
- **Live storefront preview** before publishing, so a creator sees exactly what a follower will see.
- **Submit-for-review workflow with real operational governance** — a storefront isn't just flipped live by the creator; it's routed through an approval pipeline (detailed in "How It Connects" below) so every public storefront has actually been checked before it's reachable by the public.
- **Shareable public storefront link**, generated only once a submission is approved, with the correct link preview (image + title) when shared into WhatsApp, iMessage, or social DMs.
- **Reopen-and-edit** for an already-submitted or rejected catalog, with admin feedback shown inline so a creator knows exactly what to fix.

### Payments & Pricing

- **Payments dashboard** — brand payouts and UGC earnings tracked together, with per-payout status and history.
- **Rate card builder** — a creator sets their own public rates per content type (Instagram Reel, Post, Story, YouTube integration/dedicated video, TikTok, UGC video/photo, appearance fee, consultation fee), so brands know what to expect before they even reach out.
- **Rate calculator** — an assistive tool that suggests a fair rate range based on follower count, platform, engagement rate, niche, content type, and usage-rights term, in both USD and INR, so newer creators aren't guessing at their own worth.
- **Suggested-rate assist** on the rate card itself, pre-filling reasonable numbers a creator can accept or override.
- **Affiliate link tracking** — per-product tracking links with click/conversion counts, for creators running ongoing affiliate arrangements rather than one-off campaigns.

### Growth & Automation Tools

- **Instagram account connection** with live connection status and account overview (followers, engagement).
- **DM automation builder** — rules that auto-reply to comments or DMs based on a keyword trigger (e.g. "comment SHOP and I'll DM you the link"), a genuinely operational feature that turns a creator's Instagram engagement into a lead-capture funnel without them manually replying to every comment.
- **Automation detail & management** — view, edit, and monitor the performance of each automation rule individually.
- **Content scheduling** — plan and queue Instagram posts, Stories, and Reels ahead of time from a calendar view, with media, captions, and hashtags attached per scheduled post.
- **AI caption generation** — get multiple caption options for a piece of content instead of staring at a blank text field.
- **Trending content ideas** — a feed of timely content prompts scoped to the creator's niche, aimed at solving "what do I even post today."

### Analytics

- **Cross-platform stats screen** — reach, engagement, and account-level metrics pulled in from a creator's connected social accounts, viewed side by side instead of jumping between three different platform apps.
- **Campaign-level performance** (reach, engagement, conversions, revenue) surfaced back to the creator per campaign, not just to the brand.

### Support & Account Management

- **In-app support ticket submission**, including file/screenshot attachments, so a creator never has to leave the app to report a problem.
- **Account settings hub** — profile, password, payments, storefront, and support all reachable from one menu, with a completion nudge if a creator's profile is still missing key info.
- **Dark mode**, respected consistently across every screen in the app, not just a top-level toggle that half the app ignores.

---

## 3. What Makes It Different

- **Contracts and proof-of-work live inside the app, not in email.** E-signature, per-deliverable progress tracking, and a built-in post analyzer that pulls real engagement numbers from a pasted link mean a creator's entire paper trail for a campaign — agreement, delivery, verification — never leaves the product.
- **Storefronts go through real operational review before they're public.** This isn't a "click publish and you're live" catalog builder — every submitted storefront is routed to an internal operations workflow for approval, and a creator only gets a shareable public link once that's cleared. That's a meaningfully higher bar than most creator-storefront tools, and it's a genuine trust signal to put in front of brands and followers alike.
- **Instagram automation is a real engagement-to-lead funnel, not a novelty.** Keyword-triggered auto-replies on comments/DMs turn a creator's own audience engagement into a distribution channel for their storefront, rate card, or affiliate links — most competing tools treat DM automation and monetization as unrelated features; here they're wired together.
- **Rate-setting is assisted, not left to guesswork.** The rate calculator (follower count × platform × engagement × niche × content type × usage rights, in both USD and INR) and the rate card builder mean a creator — especially one early in their career — has a defensible number to quote instead of copying whatever a friend charges.
- **One login covers the full creator business, not just campaigns.** Campaigns, storefront, rate card, content calendar, DM automation, and payments are one connected app instead of five separate tools stitched together with screenshots and spreadsheets.
- **Contracts, storefront submissions, and payouts all fold into one identity.** A creator's Cognito login is shared across the wider Zopkit platform (see below), so there's a foundation for this identity to travel with them beyond just this one app.

---

## 4. How It Connects

### To other Zopkit products

- **Operations-Management (verified in code).** When a creator submits their storefront for approval, the backend calls out to a separate Operations-Management service (`POST /api/internal/affiliate-catalog/intake`, authenticated with a service token) to hand the catalog off for review. Operations-Management later calls back into this app through a signed webhook (`/api/internal/ops-catalog-webhook`, HMAC-verified, header `x-zopkit-signature`) to approve or reject the submission and, on approval, issue the storefront's public URL. This is a real, live integration — not a planned one — and it's the mechanism behind the "storefronts are actually reviewed" trust feature described above.
- **Shared Zopkit identity (verified in code).** Social sign-in runs against a shared `zopkit-platform` AWS Cognito user pool rather than an app-specific one, meaning a creator's login is provisioned at the platform level, not siloed to this app alone.
- No other direct, code-level integrations with sibling Zopkit products (e.g. Finance-Accounting, B2B-CRM) exist in this codebase today.

### To external tools & services

- **AWS Cognito** — authentication, including social sign-in through Cognito's Hosted UI.
- **Cloudinary** — image hosting for storefront cover photos, product/service photos, and campaign brand assets.
- **Instagram Graph API** — account connection, webhook-driven comment/DM events (the backbone of the DM automation feature), and post/Story publishing for scheduled content.
- **YouTube Data API** and **X (Twitter) API** — creator analytics sync for the cross-platform stats screen.
- **Email delivery (via Nodemailer)** — transactional email for account and campaign-related notifications.
- **Expo push notification service** — device push delivery for campaign and payment events.
- **Server-side PDF generation** — used to produce the downloadable signed-contract PDF.
