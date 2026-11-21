# World artwork

Every one of the 1,026 city covers and 20,520 place illustrations has a slot in `manifest.json`. Existing atlas artwork is retained for 26 original city covers and 104 original places. Missing bitmap jobs are never marked complete merely because the UI can show a vector fallback.

`coverage.json` reports existing, generated and missing slots. `approved.json` records reviewed outputs, their actual prompts and file hashes. The source catalogue hash pins this inventory to a particular data snapshot.

Run `npm run art:prepare` to regenerate the full inventory and `artifacts/world-art/pending-prompts.jsonl`. This is an offline planning/publishing command: it never makes an API request or spends credits. Each pending record has a stable ID, its own destination-specific prompt, provenance and intended output path. The file accounts for every pending city and place; no top-city sampling is used.

Run `npm run art:validate` to verify coverage, approved source image bytes, dimensions and the generated inventory index. Missing entries are reported honestly; they are not a validation failure while generation is still pending.

Source JPEGs are archived under `packages/assets/world/v1`; original character and brand artwork is retained for the CDN publishing tools. Neither app imports these content bitmaps. Web builds copy only `apps/web/public-shell` (fonts, favicon and installation icons); Expo has no content artwork in its public folder or image `require()` calls. `art:prepare` never repopulates app public directories or a native starter pack.

Both apps initialize the public Firebase configuration in `packages/cloud/src/firebase-config.ts`. The shared Firebase JS SDK / Firestore Lite client reads `appConfig/public` for character, category and brand URLs, then fetches city documents in pages of 300. It builds the search index in memory after those reads; no city rows or attraction shards are imported into production. Attraction subcollections load on demand and concurrent reads for one city are deduplicated. The app waits for this bootstrap before restoring local profile state, so saved city IDs are validated against the database. Failed connections show Retry; artwork retries its CDN URL without a bundled bitmap fallback. Web images use a shared loader that recognizes already-complete cached images, starts lazy image requests only when their frames approach the viewport, and stops stalled downloads after 15 seconds. Firestore image-metadata reads also have a 15-second deadline; late timed-out results are ignored, and retry can start a fresh request. Image load state is keyed to the URL and retry attempt, so cached load events and old requests cannot reset a successful image to loading. Missing/unreviewed artwork uses a labelled procedural guide placeholder.

The Firebase API key in this client configuration is a public app identifier, not an administrator secret. Firestore rules enforce public catalogue-only reads and deny all client writes. OpenAI keys and Google administrator tokens must never enter the app.

The illustrations are generated guide artwork, not documentary photos or evidence of a real visit. Catalogue source links describe the places; they are not licenses or sources for these newly generated images.

## 100-image API pilot

The first paid pilot is `kymzi-world-art-pilot-100-v1`: 20 city covers and 80 distinct attractions across six continents. The exact 100 prompts, custom IDs, input hash, submission receipt and latest status are saved under `artifacts/world-art/pilot-100-v1/`. The existing Batch ID is in `manifest.json`; use it to resume rather than submitting the pilot again.

To check status and download any terminal results:

```sh
node --env-file=.env.imagegen.local scripts/collect-world-art-batch.mjs
```

Add `--watch` to check every minute for up to 26 hours. This collector uses only GET requests: it cannot generate another image or create another batch. It validates the original input hash, every custom ID, unique output paths, JPEG format and exact dimensions. Originals go to `output/imagegen/pilot-100-v1/{cities,places}/`; `results.json` records their hashes, prompts, usage and any failed or missing requests. Reported-token costs are estimates, not billing statements.

Downloaded images begin unreviewed. Inspect every output before adding it to `approved.json`, copying optimized versions into `packages/assets/world/v1/`, and running `npm run art:prepare` followed by `npm run art:validate`. The API key stays in the ignored local environment file and is never included in an app bundle.

## Google-hosted CDN and Firestore

Project: `kymzi-f1e9d`. The existing Firebase project is also the Google Cloud project; no duplicate project was created. The web app remains at `https://kymzi-f1e9d.web.app`. Primary images are in `gs://kymzi-f1e9d-images` (Standard, ASIA multi-region) and are served through a separate Cloud CDN-enabled global external Application Load Balancer at `https://images.endpoints.kymzi-f1e9d.cloud.goog`. The Google-provided hostname uses project-scoped Endpoints DNS, with a Google-managed HTTPS certificate. No purchased domain is required. `content/cloud-images/config.json` records the infrastructure resources. `firebase.json` is the web Hosting configuration; `firebase.assets.json` is an equivalent compatibility configuration.

The image library currently contains 292 image files (about 39 MB), including all 100 newly generated city/place illustrations, the existing public artwork, and 104 separately extracted legacy attraction frames. The 26 original city covers reuse their first attraction image. Each image filename includes its content hash. Images receive `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable` and cross-origin access. Storage uploads use generation preconditions to prevent overwriting immutable objects, with both SHA-256 source validation and server-validated MD5 checksums. Corrections get a new filename and URL. The small `catalogue-images.json` metadata file uses a five-minute cache. A future custom domain can point to the CDN load balancer. Clients load the administrator-configured CDN origin from Firestore, so a future domain change does not require an app rebuild.

All generated files are hosted, including the pilot outputs awaiting landmark corrections. Their review status is preserved in Firestore and the cloud manifest. App components continue to select reviewed generated illustrations and existing guide artwork. Uncreated images have `image: null`, `imageUrl: null`, and `imageStatus: "not-generated"`; fallbacks are not counted as new bitmaps.

Firestore Standard / Native is in `asia-south1` (Mumbai), with database deletion protection enabled. It contains 1,026 city documents, 20,520 nested attraction documents and one public artwork settings document:

```text
cities/{stableCityId}
cities/{stableCityId}/attractions/{attractionId}
appConfig/public
```

City documents include country, region, coordinates, timezone, aliases, source link, catalogue order, stable attraction IDs, attraction count and available image metadata. Attraction documents include their city ID, source details, coordinates, Maps link and available image metadata. New clients prefer `cdnImageUrl`; `imageUrl` retains the legacy Hosting URL for installed old clients. `image.url` is the new primary CDN URL. Existing IDs are retained. Firestore is the runtime source for city search, attraction guides and image URLs. `appConfig/public.publicCdnImages` maps stable public asset names to the new immutable CDN URLs. Its `publicImages` map retains old Hosting URLs for installed clients. The settings include `cdnOrigin` and `storageBucket`. Test fixtures retain offline catalogue data exclusively for automated tests. User profile and social prototype state are not migrated by this import.

Rules allow public reads of these city/attraction paths and a single-document get for `appConfig/public`; other configuration reads and all client writes are denied. The administrative importer uses the existing `gcloud` user session; it never stores or logs access tokens. Every command pins `kymzi-f1e9d`, independently of the shell's default Google project. No service-account keys were created.

Commands (Node 24):

- `npm run cloud:prepare` prepares CDN files, a test/admin image metadata snapshot, coverage, and the Firestore import JSON. This is offline and requires the saved local pilot results/originals. It does not generate images or spend OpenAI credits.
- `npm run test:cloud` checks import isolation, encoding, cache configuration and rules configuration.
- `npm run hosting:deploy` builds and deploys the web app plus frozen legacy image copies, without changing Firestore rules or data. New images are not copied into Hosting.
- `npm run hosting:prepare` builds the app and stages its Hosting release without deploying. The frozen compatibility inventory is `content/cloud-images/legacy-hosting-files.json`; old URLs stay valid while the full growing library is published to Storage/CDN independently.
- `npm run test:hosting` checks that web releases preserve immutable image paths and reject damaged image data.
- `npm run cloud:deploy` builds and deploys the combined app/CDN site, Firestore rules and field index exemptions using `firebase.json`.
- `npm run cloud:import` validates and previews the import without writing anything.
- `npm run cloud:import -- --apply` imports changed documents. It saves a per-document content-hash journal, so repeating the completed import skips unchanged documents. `--max-writes=N` bounds a run; without billing it limits each run to 19,500 writes.
- `npm run cloud:verify` checks the live city and attraction counts.
- `npm run images:publish` validates sources and previews Storage uploads. Add `-- --apply` to upload only missing objects; existing objects are checksum-verified and never overwritten.
- `npm run images:verify` downloads every image through HTTPS Cloud CDN and checks its SHA-256, cache headers and CORS. It also verifies a genuine cache hit and a missing-image 404.
- `npm run images:deploy` prepares image metadata, uploads images, verifies the CDN, then publishes Firestore URLs in that order. It does not require a web deployment.
- `npm run test:storage` checks manifest isolation and source checksum validation.
- `npm run cloud:verify-bundles` compares original content image hashes against the web and iOS exports and fails if any content bitmap was packaged. Run `npm run build` and `npm exec --workspace @rymzi/mobile -- expo export --platform ios --output-dir ../../artifacts/cloud-native-export` first.

Large prepared files and verification receipts are under ignored `artifacts/cloud-cdn/`, `artifacts/cloud-storage/` and `artifacts/firebase-hosting/`. App HTML revalidates on each visit; hashed JavaScript/CSS and content images use year-long immutable caching. The app uses hash-based navigation, so Hosting intentionally returns 404 for absent static assets instead of serving app HTML as a missing image. `content/world-art/cloud-coverage.json` and `cloud-deployment.json` retain compact deployment coverage. Hosting does not publish credentials, raw generation job files, or the import journal.

References: [Firebase Hosting caching](https://firebase.google.com/docs/hosting/manage-cache), [Firestore quotas](https://firebase.google.com/docs/firestore/quotas), [Expo Firebase setup](https://docs.expo.dev/guides/using-firebase/), [Firestore Lite](https://firebase.google.com/docs/firestore/solutions/firestore-lite).


## Remaining catalogue batch run

The user-authorized `kymzi-remaining-world-art-v1` run excludes all already generated pilot/approved files. It prepares 21,315 new requests (979 city covers and 20,336 attractions) in 43 shards, plus a separately recorded previously moderation-blocked attraction that is never automatically retried. This is the existing server-side OpenAI REST Batch API workflow, not concurrent full-price individual image requests. Model/quality/size remain `gpt-image-2.5-flare`, low, 1536×1024, one JPEG per destination.

`artifacts/world-art/remaining-v1` and `output/imagegen/remaining-v1` point to `/Volumes/ExtremeSSD/Kymzi-world-art/remaining-v1/`. CDN originals/optimized staging also live on ExtremeSSD. A missing volume stops submission rather than recreating the directory on the nearly-full internal disk. No API key is copied to that volume; the worker reads the existing ignored `.env.imagegen.local` on the Mac.

Use a supported Node 24/22 runtime:

```sh
npm run art:bulk:status
npm run art:bulk:run
```

`run.json` saves each exact prompt, stable image/custom ID, input hash, input-file ID, submission intent, Batch ID, API status, returned usage and publishing status. The 43 `shards/*/requests.jsonl` files are the final prompt set. A process lock prevents concurrent workers. Ambiguous submissions are reconciled by the saved input ID and API metadata; the worker refuses to repeat a possible charge. Only a server-confirmed quota validation failure with zero completed work can be deferred. Moderation failures and other per-image failures remain explicit in each result report; there is no automatic paid regeneration.

At the checked 2026-11-21 Batch rates, the prompt/output estimate is about $73.76, with $94.93 reserved and a $110 scheduling guard. These are estimates, not a live account balance or an OpenAI-enforced hard billing cap. The worker uses returned token usage as it becomes available and refuses further submissions if spent-plus-outstanding reservations exceed the guard. Keep other API usage in mind when checking the account balance.

For every terminal shard, the worker validates request mapping, JPEG dimensions and SHA-256, archives originals, produces 768-pixel optimized delivery JPEGs, uploads immutable content-addressed objects to `gs://kymzi-f1e9d-images`, verifies actual Cloud CDN bytes/cache/CORS, and only then updates catalogue fields in Firestore. Publishing is resumable and does not replace unrelated document fields or copy new images to Firebase Hosting. New clients receive `cdnImageUrl`; legacy `imageUrl` is retained only for the frozen images that actually exist on Hosting.

New bulk images are marked `generated-guide-illustration` with `landmarkVerified:false`. Technical validation does not imply manual verification of every building. Known inaccurate/unapproved pilot images retain their existing review status and app visibility. These are illustrative travel guide assets, not documentary photos. `cloud-coverage.json` records current CDN coverage; `run.json`/`art:bulk:status` records actual generated, published and failed counts. The older `coverage.json` remains the manually-approved artwork inventory.

OpenAI generation runs remotely after submission. The Mac must stay awake and ExtremeSSD connected for downloading and Storage/Firestore publishing. `caffeinate -i` is used while the background worker runs; closing the laptop, rebooting or disconnecting the drive may require rerunning the resume command. Completed remote jobs are not resubmitted on resume. Logs are under `artifacts/world-art/remaining-v1/worker.log`.
