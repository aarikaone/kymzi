# Kymzi world catalogue

This snapshot adds **1,000 destinations** to the original 26 and supplies **20 places per destination: 20,520 place records across 126 countries and six continents**. The machine-readable coverage and source hashes are in `report.json`; the portable data is `catalogue.json`.

## Sources and attribution

- City names, GeoNames IDs, country/region names, population and IANA time zones: [GeoNames](https://www.geonames.org/), [cities15000 and country/region dumps](https://download.geonames.org/export/dump/). City metadata contains GeoNames data licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Preserve this attribution when redistributing the city data.
- Named places, English descriptions, categories, coordinates and Wikimedia sitelink counts: [Wikidata](https://www.wikidata.org/), retrieved through the public [QLever endpoint](https://qlever.dev/wikidata/). Wikidata structured data is [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Every imported place has its own Wikidata source URL.
- The original 104 authored attraction entries remain first in their city guides with their original source URLs. All exported records include Maps links. The original 104 curated places use named-place search and explicitly null attraction coordinates; their city centres retain the existing public-domain [Natural Earth](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/) coordinates to preserve existing check-in behaviour.
- The UI uses original, labelled guide illustrations. This import does not include site photographs or licenses for Wikimedia Commons images.

## What a city guide means

Destinations use GeoNames populated-city centres. Each sourced place belongs to its nearest eligible centre **in the same source country**, within **35 km**. These are city-area guides: some places are outside municipal boundaries. Distances are straight-line distances from the guide centre, not walking distances. Administrative city status and boundaries are not independently verified.

The importer deduplicates provider IDs and normalized names. A source place is assigned to one guide, and each new guide contains at least three kinds of place. Stations and memorials cannot dominate a guide. Separate attractions can share a complex or address.

The published set keeps its 1,000 additional GeoNames IDs in `selection.json`. A rebuild fails if a pinned city no longer meets the quality threshold instead of silently dropping it from stored profiles.

## Quality and limitations

Records with dissolution dates, descriptions indicating demolition/closure, industrial/business parks, and adult-oriented venue descriptions are excluded. Specific descriptions correct broad source classifications, such as distinguishing a bridge from a restaurant or a zoo from a museum. A known closed site, [Dubai/Jumeirah Zoo](https://www.wam.ae/en/article/hszr62u9-jumeirah-zoo-closes-doors), is explicitly excluded.

`kind` is the display classification. `categoryId` selects an existing Kymzi visual category; libraries, for example, use a book-related visual category while retaining `kind: Library`.

This is a sourced snapshot, not a manually inspected or live operating-status database. It does not invent opening hours, prices, safety ratings, accessibility or current public access. The source and Maps links let users inspect a place before visiting. Wikimedia sitelinks guide curation; they are not user ratings.

## Rebuild and validate

From the repository root:

```sh
npm run catalog:validate
npm run catalog:build -- --fetch
npm run catalog:build -- --refresh
```

The build command uses Python 3 and the project's supported Node runtime. Public source snapshots are cached under `artifacts/world-catalogue-cache/` and are excluded from Git and app bundles. `--fetch` downloads missing snapshots; `--refresh` replaces them. Use `--cache /path/to/cache` to reuse another snapshot directory and `--output /path/to/output` to generate a reviewable export outside the app. Review the data diff and rerun validation before shipping a refreshed catalogue.

City metadata is available immediately. Place data is split into six continent modules and loaded on demand; native release bundles include the modules for offline browsing. Onboarding and World search render bounded or virtualized city grids. Existing matches remain in the original simulated social pool; adding a guide does not invent connected Roamies.


## Smaller-destination expansion (v2)

`expansion-v2.json` adds **1,500 more destinations with four attractions each**. Together with the frozen v1 snapshot, Kymzi now has **2,526 destinations and 26,520 attractions across 170 GeoNames countries and territories**. Existing city IDs, original attractions and the running image-generation manifest are preserved.

The added set spans six continents and 145 countries and territories. It favours places below 500,000 residents with a verified English Wikivoyage guide, including Munnar, Madikeri (Coorg), Banff, Ubud, Queenstown and Nuwara Eliya. Source metadata comes from the GeoNames `cities500.zip` snapshot (CC BY 4.0), Wikidata structured records (CC0), and Wikivoyage guide presence. Munnar and Coorg also have attributed Wikipedia introductions (CC BY-SA 4.0). Canonical source links, per-record identities and retrieval/source hashes accompany the data.

Popularity is a reproducible **travel-interest/coverage proxy**, calculated from Wikidata language/site coverage for the destination and its four strongest attractions, plus verified travel-guide presence. It is not a visitor-count ranking, live trend or user rating. The selection retains worldwide coverage, limits a single country to 100 additions, and caps Europe at 750 additions. The app offers Popular, A–Z and continental filters.

Before publication, validation rejects repeated GeoNames IDs, repeated Wikidata destination and attraction IDs, nearby destination aliases, and same-country attraction names within 750 metres. For the two attractions without published point coordinates, duplicate checking uses the destination area and records the missing coordinates explicitly. Similar names in geographically distinct places are kept. No attraction from v1 is reused to pad a new guide.

`expansion-v2-selection.json` pins all 1,500 destination IDs. `expansion-v2-report.json` records the final counts, exclusions, geographic coverage, ranking method and snapshot SHA-256. The create-only Firestore publisher writes attractions before exposing parent cities; repeated runs cannot replace existing cities or richer image/detail fields. Only popularity is merged into original city documents. New destination imagery is a separate asset set; the current generation run remains pinned to v1.

Run `npm run catalog:expand:validate`, `npm run test:destinations` and `npm run catalog:expand:verify` to audit the data and cloud counts. Source/build caches live on ExtremeSSD through `artifacts/destination-expansion-v2` and are excluded from app bundles.
