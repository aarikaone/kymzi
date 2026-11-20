# Kymzi — explore through someone new

Kymzi is a local web and React Native prototype: **bring five friends → unlock pal finding → answer three questions → match all three → connect with an unknown pal → discover their city through places and photos → meet anonymously when visiting**.

On iPhone, the bottom navigation is **Home / Explore / Task / Favs**. The app bar pairs your anonymous character and personal photo on the left, the original K logo in the center and notifications on the right. Tap the paired avatars to open Profile. Notifications sit at the top right of every eligible root tab. There are no Demo chips. About, illustration labels and the chat/meeting explanations identify the local preview without adding a global badge.

## Five-friend unlock

Pal finding opens after **five distinct friends complete and return the owner’s challenge**. Sending or copying an invitation does not count. Repeated replies from the same anonymous friend count once; received challenges owned by someone else do not count. The 0/5 progress is visible on Home and the dedicated unlock page. The fifth returned postcard permanently activates global play on this device and opens Find my pal. The simulated five-friend animation also activates this local global mode without adding fake referral credits.

Preparing the three-question invite is free and kept separately from daily global play. It resumes after leaving or reopening, and remains available while global plays are waiting for the saved daily opening time. Home now checks that opening time as well as plays remaining, so it does not offer an unusable Find my pal action. Personal-photo, chat and meetup gates are unchanged.

Five completion credits survive postcard/invitation history retention and reloads; existing owned completed postcards migrate into progress. These remain local challenge-completion records, not authenticated registrations or automatic cross-device referral tracking. Public matchmaking and push still need the service described below. Guides, the home passport and the camera task remain available without inviting anyone. Ages 10–12 retain private exploration and are not asked to recruit friends.

On iPhone, use **Profile → Global play preview** to play the five-friend unlock animation. Activation is saved in `launch.globalPlay` with its time/source and survives reloads, navigation and app restarts. **Explore** leaves the animation without revoking activation. Replaying the animation does not reset quotas, drafts, photos, pals or city progress. Existing temporary unlock previews migrate into the durable mode while retaining the current daily game. The real distinct-friend count stays separate. Replay, skip, cancel and reduced-motion behavior remain available on web and native.

## Day-one launch flow

New profiles receive a home passport immediately. Explore, Cities, Task and Profile use a minimal black/lime/lavender layout. City guides and home-camera photos work with zero pals. The existing monthly goal counts fresh home photos; deleting a photo does not undo its earned credit. Real profile photos never appear in friend links.

New global plays open the six illustrated topics first. Selecting a topic creates three questions from that topic and saves its category and hidden destination. Opening topics, selecting one and leaving an untouched first question are free; the first submitted answer consumes one play. Returning from Home resumes an answered/paid draft, including its original topic and pal. Untouched starts can choose a different topic. The daily five-play limit and saved opening time still apply. Friend invitations retain their separate shared three-question preparation. The first submitted answer consumes a play; untouched starts stay free and drafts resume. After global activation, finishing any three valid answers saves the answer ticket and records an explicitly simulated same-cohort world connection, pal and city discovery. The result opens that pal, their city attractions and illustrated photo feed. Explore switches to connected-pals and city moments; Cities lists uncovered destinations and pal/photo counts. Targeted plays keep the same pal and still require three matches for the fictional photo and five for chat. The daily five-play allowance and saved daily time remain in force.

A friend challenge contains the question IDs, anonymous character/number and salted SHA-256 answer commitments. It contains no answer text, real photo or home location. A recipient opens the web link, answers in their browser without signing up or installing, sees an honest 0–3 score, and shares the postcard link back. Both participants can save the postcard. Rewards are separate from global match proofs: friend challenges cannot unlock personal photos, chat or meetups. A sender opening their own invitation sees the invitation/share view. Invitations expire after seven days; completed postcards remain viewable. Guest drafts and finished responses survive reloads.

The result return is manual through a shared link; there is no background delivery or automatic referral verification. The web host must be reachable for cross-device invitations. Native senders set `EXPO_PUBLIC_WEB_URL` to that web app, and can import a returned result with **Have a postcard link?** in Postcards. See `apps/mobile/.env.example`. Native guests use the browser challenge.

This remains a local prototype without a database: actual global matchmaking, automatic push, authenticated identities and cloud photo delivery require a service. Answer commitments prevent ordinary UI spoilers; a client-only link is not an authentication or anti-cheating boundary. No contacts are uploaded. Global pals, city photos, replies and arrival/activity previews are fictional local fixtures, identified by simulation records and preview descriptions.

Existing local saves and their photos/progress are retained. All web profiles adopt the launch experience without erasing progress. The named LegacyPreview export is only a historical UI regression harness; the shipped default entry always adopts launch mode and restores durable global activation. The native app adopts it when restoring a profile. Activated profiles use the pal reveal, city galleries, photo feed and repeat-play screens as their local global experience. The remaining older pages continue to have regression coverage.

## Explore

The welcome page uses one large, static purple character cropped at the right edge, showing one eye and its glasses. It fills 80% of the background height and fades into black behind the headline, one explanation and Get started. Both clients share the copy. There is no welcome animation. Small screens and larger text retain scrolling to keep the action reachable.

Setup places the anonymous character beside the optional real photo. A random six-digit display nickname and one of the 44 characters are assigned automatically; the nickname stays fixed after saving and the character can be changed. Older custom names remain in stored profiles until an edited profile is saved with its assigned number. City and Country replace the age input and are retained when reopening the profile. Existing age cohorts and their access rules are preserved internally. The photo note explains three full matches with the same pal, matching all three answers in each game. Ages 10–12 keep both images private. Photo preparation, per-pal reveal gates and monthly camera-task accounting remain separate.

Before the first connection, Explore explains three actions: answer three and match all three; see the city through a pal’s photos; share a public meeting spot when visiting. After the first connection, it becomes a photo feed with an Instagram-style row of connected anonymous pals. Each circle opens that pal, their city, their shared moments and their game progression. Photo-author and **View pal & city** actions open the same pal detail. **Play** starts another random-city encounter.

Pal aliases are city-specific, such as **Pal 01**, and never expose a name, contact detail, hotel or exact live location. The alias is stable within the current city/cohort. A repeat match adds progress to the existing connection rather than making a duplicate. Every pal has a character image from the first match, in the pal row, photo byline, city list and pal page. The chosen character stays public; an optional personal profile photo has its own reveal gate.

- **1–2 matches:** the pal’s chosen character, plus city moments. The personal photo remains private.
- **3 matches:** reveal the optional personal photo to that same-cohort pal; the local incoming portrait is clearly labeled as fictional.
- **5 matches:** chat opens and that pal’s games are complete. At most five successful games are recorded per pal; random play can connect another eligible pal.

**Play together** offers topics for another three typed answers with that same pal. A typed or charged draft always resumes its original questions, partner and destination. Photo/chat gates use saved match proofs and cannot be bypassed by opening a chat URL. Blocking or changing cohorts removes access.

In this local prototype, any three valid answers create a simulated full match. Matching fixtures are not mutated. Chat replies are generated locally from city facts and are labeled as simulated on the conversation screen. No real user or chat service is connected.

## Cities

Cities shows only uncovered destinations in a photo-led grid. Each city has its pal count, city-photo entry, new-photo count and saved-place progress. The guide contains four illustrated attractions, a connected-pals view and city moments. Each attraction has a short fact, official source and **Save this place**. Saving a place does not claim physical travel.

There are **26 cities in 26 countries**, **104 illustrated attractions** and **2,000 draft question prompts**. One city represents each country. Images labeled **Illustrated preview** are artwork, not documentary photographs from real community members.

## Task and camera

The third tab asks for **3 fresh camera photos each calendar month** to keep the local profile active. It shows the current month’s photos, progress and due date. The first month is a grace period. Completing a month maintains activity into the next; a missed month pauses local status until three current-month photos are taken. Browsing, play and camera access remain available.

Choose the city manually, open the live camera, shoot, review and acknowledge that there are no faces or personal details before saving. There is no gallery picker, file upload input, microphone or GPS permission. Images are re-encoded and EXIF/IPTC/comment metadata stripped. Failed permissions, cancellation, retakes and failed persistence do not grant credit. The camera stops after capture, on leaving and on backgrounding.

The latest 12 compact camera photos remain on the device. Monthly capture credits survive deletion and the storage cap. The monthly goal resets at device-local calendar-month boundaries. Own photos remain separate under **Profile → My city photos**. No production upload/storage/moderation backend is connected.

Connected profiles open the pals/photo feed on Explore and pal avatars with city images on Cities. A valid existing same-cohort connection restores a missing global activation flag on older saves, so the first-use **Your passport** screen cannot take over after a connection. The `/launch` entry and Back to Explore actions return to the connected feed; daily plays and saved connection progress stay intact.

## Three global pals and a visit to your city

The shipped global experience starts with up to **three distinct fictional pals** in different countries, visible in the Explore avatar row and **Profile → Your pals**. Existing connections are preserved; the showcase tops up to three once per age cohort, without spending a play, submitting user answers, adding referral credits or granting photo/chat unlocks. Each starter pal has one explicitly simulated match. Reloads do not duplicate them, and blocking a pal does not recreate that pal.

One pal has a saved planned visit to the profile’s **City and Country**. The avatar receives a lavender ring, plane badge and **Coming to you** label, and the upcoming visitor is shown first. Home shows a compact visit card; Profile and the pal page show its date, time, stored timezone and Travel preview label. Notifications open that same pal and schedule. The first fixture arrival is the next day at 16:30 in the device timezone at creation; its ISO time/timezone are stored and never slide forward on reload. A changed home location, blocking, cohort mismatch or elapsed arrival removes the coming badge. A planned trip does not check anyone in, announce live presence or reveal a personal photo.

## Meet a pal visiting your city

The arrival invitation has a prominent city, date and time, anonymous character artwork and a lime **Meet him** button on Explore, Profile and the pal detail. A short entrance and three travel-motion cycles draw attention; reduced-motion preferences disable them. The saved timezone is displayed as a friendly short zone instead of the raw IANA identifier.

**Meet him → Check in here → Pal checks in → Open chat.** The new route starts in the profile’s saved home city, rather than the pal’s home city. Choose your current city, country and a public café, park, museum or square, optionally name the public place, then explicitly check in. The chosen spot stays visible. Two character portraits show each person’s check-in separately. **Preview pal check-in** is an explicit local simulation of the fictional pal consenting and checking in; their planned trip or arrival time never grants presence or chat.

This temporary meetup chat requires both consented check-ins to be active in the **same normalized city and country**. Each lasts at most **60 minutes**. Different cities, expiry, checkout, blocking, an owner/cohort mismatch or a changed home destination withdraw access. Both must still be checked in when opening or sending a message. The local conversation and check-in expiry survive reload; fictional replies are labeled as simulated. No device location is read and physical presence is not verified. The existing three-match personal-photo and five-match regular-chat progression remains separate.

Ages 13–17 see this only as an explicitly labeled **fictional adult walkthrough**, without changing their age or announcing public presence. Ages 10–12 cannot enter it. This flow has no real messaging, GPS, cloud presence or push delivery backend.

## City check-in and meetup flow

Open **Cities → Check in to a city**, or **I’m in [city]** in a guide. Choose a city and the public attraction you are at, then explicitly check in. Two fictional anonymous requests appear in the local preview. Pick one, select a public pin on the illustrated place map, choose a time in 10, 20 or 30 minutes, and share the meeting pin. The plan stays **Pin shared → Coming → Arrived**; separate **Preview them coming** and **Preview arrival** controls simulate the other person’s reply and updates. No arrival is inferred from the clock or a device location.

The current check-in appears on Explore and Cities. The notification bell gains a dot for new request/arrival updates; its inbox reopens the same meetup. State resumes after reload. Passing on a request, cancelling a plan, checking out and the 60-minute expiry withdraw the relevant controls. A new check-in requires an explicit action. A public meeting pin can differ from the original check-in spot but must be in the same city.

Incoming people are fixed fictional characters, never real profiles or personal photos. The map is an illustration of available places, not a geolocated street map. No GPS, contacts, push delivery, real invitations or cloud presence is connected. Ages 13–17 can view a clearly marked fictional adult walkthrough without changing their profile age; ages 10–12 keep private city exploration. Existing adult visit/meeting rules remain unchanged in the older flow.

## Anonymous visits and meetings

Adults can plan an anonymous city visit from a pal or city guide. Posting dates does not check anyone in. Existing city boards show voluntarily shared anonymous dates and visitors at public attractions.

**Meet in [city]** on a pal opens four public attractions. The visitor chooses a spot and explicitly presses **I’m here** only on arrival. Only then can they share that public spot and a future meeting time with the pal. No continuous position, street address, hotel or device location is read. The request remains pending until a separate **Preview acceptance** simulates the pal agreeing. Cancellation withdraws the plan. Check-in expiry, checkout, a changed spot, a past meeting time, blocking or a cohort change removes live meeting access. Requests and confirmation updates appear in notifications.

Check-ins last at most **60 minutes** or departure-day midnight. Meeting times must be at least five minutes ahead and within that active check-in. The existing public-visitor flow additionally requires both visitors to be checked in at the same spot before a mutual meetup can be proposed.

No real invitation, announcement, push, booking or meeting delivery is sent. The app does not verify physical presence or the other person’s location.

## Age boundaries

- **10–12:** private virtual cities and own camera collection. The same five tabs remain, with no pal fixtures, public dates, chat, presence or meetup controls.
- **13–15 / 16–17:** anonymous same-cohort pals; public characters, optional personal photo after three matches and chat after five. No public presence or meeting locations.
- **18–20 / 21–24 / 25–30:** the same pal progression plus explicit public-spot visits and mutual meeting previews.

Profile age selection is prototype routing, not production age verification. Existing age/cohort and blocked-peer checks remain in shared code and route guards.

## Chat design and ages through 30

Regular pal chat and temporary same-city chat share a black-and-lavender conversation UI on web and native: anonymous character portraits, larger message bubbles, actual message times, an editable multiline composer and reply ideas. Suggestions fill the draft and never send automatically. Web Enter sends; Shift+Enter inserts a line break. The meetup view pins the chosen public check-in spot, opens its existing status screen and shows the remaining shared check-in time. Checkout and expiry retain the same chat gate.

The supported age bands now include **25–30** as a separate adult cohort. Existing 21–24 identities and connections retain their IDs and progress. New pals, photos, visit metadata and saved conversations accept 25–30; matching stays within the exact cohort. The established fictional adult portrait row is reused for adult fixtures. The three-match photo, five-match regular-chat and both-check-ins meetup-chat requirements remain in force.

## Play limits and persistence

Five plays are available each day. Opening topics, an untouched restart and an unsubmitted first draft are free. The first submitted answer charges exactly once; a charged fifth play can still be resumed. Targeted replays use this same daily allowance. Completion cannot charge or connect twice from a stale browser tab. After the allowance is used, Explore shows the next-game countdown.

Daily opening time is optional and defaults to 19:00 local time after the first completion. **Profile → Daily play time** changes it. Suggestions remain three per week, resetting Monday at 00:00 UTC; they never fill the answer automatically. Weekly leaderboard and illustration-refresh schedules remain separate from monthly camera tasks.

Web saves use `rymzi.preview.v1` and `rymzi.ideas.v1`; legacy `kymzi` keys migrate only if the newer keys are absent. Native restores old `kymzi.native` values in the same storage container. Existing discoveries, proofs, photos, credits, drafts and used plays are preserved. There is no database, login or cross-device synchronization. All limits and activity status are local prototype state.

## Design and implementation

The interface uses black ground, soft neutral text and the original Kymzi lime for actions and highlights. DM Sans provides the main type and Caveat a few display accents. Web loads one ordered CSS entry ending in `kymzi-green.css`. The four-item tab bar has no floating orb, notch or center lens.

The original Kymzi two-pal K logo is restored from `packages/assets/brand/kymzi-symbol.svg`: lime `#D5F88F`, lavender `#C8BEFF`, and midnight eyes. Its lime is the primary page accent on black surfaces. The wordmark uses custom rounded vector lettering, a curved y tail, open m arches and a lavender i dot; the same geometry renders on web and native without an extra font load. Main actions use lime with dark text; selected controls, photo progress, city tabs and navigation share the palette. The original native app icon is retained, while transparent SVG/PNG/ICO favicons and adaptive foregrounds use the restored symbol. `kymzi-restored-v5/theme.json` records the palette and UI color migration. Existing Rymzi package IDs and storage keys are retained to preserve progress and photo uploads.

The catalog and state logic are shared by `@rymzi/core`; clients are `@rymzi/web` (React/Vite) and `@rymzi/mobile` (Expo/React Native/NativeWind). The checkout remains `/Users/aarika/Documents/workspace/kymzi`.

Inline native Pressables with callback styles opt out of NativeWind interop (`cssInterop={false}`), which preserves their layout, backgrounds and pressed feedback. This includes the illustrated topic grid and onboarding buttons. The top app bar pairs two personal identities on the left with a centered K logo and a notification bell on black, without a divider. Home omits upcoming travel cards and visit badges; these remain available in Profile. The Home feed begins with a circular Unlock action in the pal-avatar row, followed by connected pals. It replaces the separate Explore heading and Play button, keeps daily waiting limits, and resumes saved answers. Photo overlays use a light lower fade with compact location labels.

## Profile characters

Edit Profile includes **44 character avatars**: the original Cloud, Orbit, Sunny and Sprout plus 40 original plush-style characters. **Change character** opens a searchable collection with Fuzzy, Critters, Cosmic and Oddballs filters, a large live preview and **Use [name]**. Returning without applying discards the picker preview. Applying returns to the edit form; **Save changes** commits the avatar and returns to Profile without resetting plays, photos, discoveries or connections.

The web picker uses optimized transparent WebP images and native uses transparent PNGs with a shared static asset map. All four original IDs and existing pal fixture avatars remain unchanged. Each new character has its own original generation, a full-resolution source, and app-sized exports. The exact prompt set is in `packages/assets/avatars/characters-v2-prompts.json`; generation and export metadata is in `packages/assets/avatars/characters-v2/assets.json`. The artwork was generated with the built-in imagegen tool, not the CLI. Export steps only resize/encode files and preserve alpha.

## Run and verify

Use Node 24 LTS or Node 22.18+ LTS.

```sh
npm ci
npm run dev
npm run check
npm run mobile
npm run ios
npm run android
npm exec --workspace @rymzi/mobile -- expo export --platform all --output-dir ../../qa/native-export
```

`Start-Rymzi.command` starts the existing local preview at **http://localhost:4178/**. Desktop uses a mobile frame; phones use their viewport. Small screens and larger text can scroll to keep controls reachable.

Preserve the existing Expo dependency overrides and `patches/metro+0.83.3.patch`; `patch-package` applies the image-parser compatibility fix. The Expo-compatible `expo-system-ui` module configures the native dark surfaces.

Shared tests cover progression, five-game limits, drafts, age boundaries, meeting privacy/expiry and existing play/photo behavior. UI tests cover the five tabs, first-use introduction, connected feed, city photos, avatar/chat gates, camera tasks, notification navigation and both anonymous meeting flows. Browser visual review remains unavailable because Computer Use blocked this local URL; no browser-control workaround was used. Physical-device runtime and broader accessibility review remain pending.

### Optional personal profile photo
Edit Profile → Add photo selects a library image, crops to a square and re-encodes a compact JPEG without EXIF/IPTC/comments. Preview, replace or remove it before Save changes. Profile save reports storage failures and preserves game progress and monthly city-photo credits. Changing age groups clears the old photo consent; add it again for the new group.

Characters are public from match one. Personal photo eligibility is per same-age-group pal after **three matches**; blocked connections and profiles aged 10–12 never share photos. Five matches unlock the local chat preview. The pal detail shows a separately gated fictional portrait, never the user's uploaded photo standing in for a pal. Character images remain in public feeds.

This guest prototype stores the user's image only on their device. There is no backend photo delivery or real receiving pal; incoming portraits are fictional previews. The monthly city-photo task remains camera only and separate from profile uploads.

## Home scrolling

Explore uses one continuous vertical scroll for its title, Play action, pal avatars, arrival invitation, city filters and photo cards. The top app bar and bottom navigation stay fixed. On native, these home controls are the photo FlatList header, with no nested vertical list or photo paging. Home grid mode scrolls with the same header; dedicated city photo viewers retain their immersive swipe feed. Visible home photos are marked seen only after entering the viewport.

## Favorite city photos and task badge

Web retains Explore, Cities, Task, Favs and Profile. On iPhone, Profile opens from the app-bar avatars, leaving four bottom tabs: Home, Explore, Task and Favs. Task always shows the actual current-month photo count, capped at **3/3**, including home camera credits; it resets at the local calendar-month boundary.

Heart actions on feed photos, gallery thumbnails and own city moments toggle the same persistent local favorites. Existing saved photos appear in Favs automatically. The Favs tab has a photo grid and a larger photo viewer, with removal in either view. Own home moments keep their saved city/country label. Hidden photos, blocked or ineligible connections, deleted source photos and other age cohorts are excluded. Favorites do not count toward the camera task, create matches or spend plays.

### Live iPhone edits

Run `npm run ios:dev` once to install the Debug development client on the connected iPhone. Later, use `npm run mobile`, open Kymzi on the phone, and save a UI file to see Fast Refresh. Keep the Mac and phone on the same network. Native dependency and permission changes need another native build. The installed Release app must be replaced by the development client for live edits.

Native meetup screens use one main action per step: **city → public place → pal → pin**. The visiting-pal flow shows a single check-in form, a visual waiting state and same-city chat. City stories and longer privacy explanations are expandable. Shorter labels cover onboarding, play, cities, monthly tasks, profiles and updates; check-in expiry, public-location consent and simulated-presence notices remain visible.

## Native release builds

Kymzi’s iOS bundle identifier and Android package are **com.kymzi.app**. Local build helpers follow the neighboring Medinest workflow, with matching platform build numbers, per-step logs and collected artifacts. They do not upload or publish.

iOS uses Medinest's Apple Developer team **5Y3QHYUW35**, configured in `apps/mobile/app.json`. Native helpers automatically select an installed compatible Node runtime if the shell uses Node 23/25; `.nvmrc` selects Node 24 for other project commands. Check iOS setup with `npm run build:ios -- --preflight-only`.

```sh
npm run build:doctor
npm run release:stores -- --dry-run
npm run release:stores             # Android AAB + iOS IPA
npm run build:all                  # web + Android + iOS
npm run build:android:debug        # debug APK
npm run build:ios:simulator        # unsigned Release simulator app
```

See [the mobile build guide](docs/MOBILE_BUILDS.md) and `.env.build.example` for local Xcode, SDK and signing setup. Copy the template to `.env.build.local`; credentials and generated native projects/artifacts are ignored by Git.
