# Places shared from Maps

Task is an **open-ended collection of hidden gems**. A user can share a public place they love, especially local favourites in their city. The task does not request GPS, require a visit, accept photo uploads or change meetup presence.

## Flow

1. Google Maps or Apple Maps → Share → **Share to Kymzi**. Task also has a paste-link fallback.
2. Review the place name, city, country and one of the twenty categories. Missing metadata stays blank; the user's home city is never substituted for a remote place.
3. Preview the illustration and publish explicitly. Opening, editing or abandoning a preview uses no task credit and no game.
4. The place appears on Home and can be saved to Favs. My gems keeps every unique share. My impact shows active saves, distinct Roamies who saved a gem, and a city breakdown. There is no quota, expiry or profile pause.

The image service creates a place-specific illustration when configured. Otherwise the existing generated travel artwork is labelled **Artwork preview**. It must not be presented as a verified photograph of that exact location.

## Uniqueness and activity

Canonical provider place IDs, tracking-free links and normalized name + city + country prevent duplicate credit. URL aliases and Apple/Google copies with the same reviewed place details are rejected. The first publication owns the gem; reposting does not create another entry. Legacy GPS check-ins remain in the journal and Favs but do not create another shared gem.

Progress resets monthly. The current first month is active; completing fifteen places sustains activity into the following month. A missed month pauses activity. Sharing a place never checks the person into its city or reveals their current location.

## Favourites and ranking (leaderboard hidden)

The contribution leaderboard ranks by **favourites received on shared places**. One connected pal can have one active favourite per place; removing it removes the point. Your own bookmark never scores your own contribution. Blocked and other-cohort pals cannot contribute to your score. Younger children's collections remain private, without a leaderboard.

This remains a local prototype. No live leaderboard or remote favourite service is connected. “Preview a pal’s fav” explicitly simulates an incoming favourite. Production must authenticate each actor and enforce canonical place IDs and favourite uniqueness on the server. Unresolved short links require manually reviewed metadata; a real Places integration is needed for authoritative identity and address resolution.

## Daily leaderboard (hidden for now)

Leaderboard strips, profile links and app routes are disabled by `SHOW_LEADERBOARD` in `packages/core/src/app-features.ts`. Saved places, monthly task progress and existing favourite history are retained. The implementation below is preserved for later.

Task’s gaming rank strip opens **Today**, **Yesterday**, or a date selected from the calendar. The strip displays today's rank, favourites earned and time until the next device-local midnight. The board uses anonymous avatars, a top-three podium, shared ranks for tied scores, movement compared with the previous day and a personal-rank card. Changing days never spends plays or adds activity.

Dated favourite actions reconstruct each day’s result at its closing time. A person/place pair can earn its first daily point only once; repeatedly saving and unsaving cannot create extra points or move that first credit to a later day. Removing a favourite updates today's eligible credit and the current total, while previous closed-day results retain their historical state. Blocking a pal or switching age cohorts still removes access to their contributions.

Known legacy received-favourite dates are retained. Old bookmarks with no recorded date are excluded from daily scores rather than assigned an invented date. The preview action only adds an incoming favourite to Today. Empty past days show an empty result, and future dates cannot be selected. All daily standings remain local; a production global board needs authenticated server timestamps and a single agreed reset timezone.

## Development

- `npm run dev:place-art` starts the helper on `127.0.0.1:8788`.
- Web proxies `POST /api/maps-place` and `POST /api/place-art` to the helper.
- Native: configure `EXPO_PUBLIC_MAPS_PLACE_URL` and optionally `EXPO_PUBLIC_PLACE_ART_URL` to a reachable backend. For a local phone preview only, start with `PLACE_ART_HOST=0.0.0.0` and use the Mac's LAN address. Restart Metro after changing public environment values.
- The Maps resolver follows at most five redirects and only fetches allowed HTTPS Maps hosts. It reads bounded HTML metadata without running scripts. No API key is needed for Maps URL resolution.
- Keep `OPENAI_API_KEY` on the helper only. With no key, publishing still works with the labelled existing artwork preview.
- iOS receives shares through the SDK-54-compatible `expo-share-intent` extension (`com.kymzi.app.share-extension`) and `group.com.kymzi.app`. Rebuild after changing its plugin configuration. Android registers text share intents. Opening a received share never auto-publishes.
- Existing city/spot check-in routes still handle explicit meetup presence independently.

Checks: core contribution tests, safe-resolver tests, Maps import/publish/cancel/storage UI tests, task rollover, leaderboard receipt and self-save isolation.
