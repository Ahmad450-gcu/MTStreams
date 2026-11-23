# MTStreams — Microsoft Store listing optimization report
Prepared 13 November 2026. Product: MTStreams (9MTX2B3S2DJL), PWA/MSIX app, Entertainment.

---

## A. Research findings

### A1. How Microsoft Store search works — what is confirmed vs. inferred

| Factor | Status | Evidence |
|---|---|---|
| App name is indexed and matched | **Confirmed** (Microsoft) + **observed** | 2016 Windows Developer Blog: indexing improved "when searching by app name and related keywords". Observed: "mt streams" → MTStreams #1, "streams" → not found; "MTStreams" is indexed as one token. |
| Keywords (search terms) are used | **Confirmed** (Microsoft), weight unknown | Partner Center field text: "Keywords help improve your product's discoverability in the Store". Learn: "Use keywords naturally to improve discoverability in Store search results." 2015 blog lists keywords as a ranking input. |
| Downloads, ratings, reviews, click-through | **Confirmed as inputs** (2015–2016, not restated since) | 2015 blog: click-through rates, ratings and reviews, keywords, total downloads. 2016 blog: more weight on "number of downloads and ratings". |
| Irrelevant/abusive keywords are penalised | **Confirmed** | 2015 blog: irrelevant keywords can hurt ranking; 2016 blog: limited visibility for keyword abuse/spam. |
| Description / short description / features drive matching | **Not confirmed; evidence says weak or none** | Exact phrases from MTStreams' own description and feature list ("available playback sources", "trailer viewing", "entertainment discovery") return nothing; the same is true for MoviesFlix's own description phrases. |
| Category | **Policy requirement**, ranking effect unconfirmed | Policy 10.1.1: list in "the most appropriate category". MTStreams' secondary category was **Medical** (now fixed). |
| Screenshots / visuals | Conversion factor, not a confirmed ranking signal | Microsoft guidance focuses on conversion; the old ranking signal "click-through" would be indirectly affected by visuals. |
| Recent updates | **Not confirmed** | No current Microsoft statement. |
| Market / region | **Observed: large effect** | MoviesFlix: #5–9 in Pakistan/India, #22–88 in the US for the same queries. Ratings are also shown per market (MoviesFlix 7 ratings in US, 0 in PK). |
| Personalisation | **Unknown** | No Microsoft statement. Observations here used the anonymous catalogue service, so they show the non-personalised baseline. |
| Exact vs. broad intent | **Observed: intent clustering** | All movie-type queries in PK return the same cluster (MOVIEBOX, Netflix, HiTV:Movie, Movies & TV, Prime Video …). Generic-named, zero-rating apps (Movies Guide, Movier, Movieg, Movie, MovieSom, Movies Search) sit inside the top 25 — evidence that a **name match** gets an app into the cluster even without popularity. |

There is no current, official Microsoft document that explains Store search ranking; the newest official ranking statements are from 2015–2016. Every claim above that is labelled "observed" comes from the tests in A3, not from Microsoft.

### A2. Why MoviesFlix appears and MTStreams does not

Observed:
1. **Name.** "MoviesFlix" contains the head term "Movies" (and "Flix", which plausibly matches "netflix"/"flix" — MoviesFlix is #24 for "flix"). "MTStreams" contains no generic word the Store can match.
2. **Age and history.** MoviesFlix: live since 8 Jan 2026 (10 months). MTStreams: live since 3 Nov 2026 (10 days).
3. **Ratings.** MoviesFlix: 7 ratings (3.3★) in the US, 0 in Pakistan. MTStreams: 0 public ratings at audit time (Partner Center shows 1 new 5★ rating).
4. **Not the description.** MoviesFlix's description is a single sentence, and its feature phrases don't retrieve it — so the description isn't what is carrying it.
5. **Its keywords are private** and can't be observed.

Inferred (likely, not proven): the name match is the main reason; usage history and its 7 ratings help in the US.

Things to avoid copying from MoviesFlix: its screenshot caption "Watch Stranger Things Season Free" names a third-party title and uses "Free" — both risky under policy 10.1 / 11.2.

### A3. Search observations (13 Nov 2026, 13:03–13:58 UTC)
Environment: the public Microsoft Store catalogue search service used by the Store app (storeedgefd), device family Windows.Desktop, locale en-US, anonymous (not personalised), top 100 results (the service's maximum). Full log: `monitoring/baseline.txt`.

| Query | US: MoviesFlix | PK | IN | GB | MTStreams (all markets) |
|---|---|---|---|---|---|
| movies | 88 | 9 | 5 | 30 | not in top 100 |
| free movies | 39 | 7 | 5 | 9 | not in top 100 |
| stream movies | 49 | 8 | 5 | 6 | not in top 100 |
| movie streaming | 25 | 9 | 7 | 5 | not in top 100 |
| netflix | 22 | 9 | 9 | – | not in top 100 |
| tv shows | 49 | – | – | – | not in top 100 |
| watch movies (US) | 65 | | | | not in top 100 |
| movie discovery (US) | 99 | | | | not in top 100 |
| mtstreams / mt streams | | | | | **#1** |

### A4. Competitor landscape (Pakistan, "movies", top 25)
Big brands (Movies & TV, Netflix, Prime Video, iTunes, VLC) plus **name-matched small apps with zero ratings**: MOVIEBOX, HiTV:Movie, Movies Guide, Movier, MoviesFlix, Movieg, Movie, MovieSom, Movies Search, MEGOGO TV & Movies, Movies Countdown. Popular unrelated apps (WhatsApp, Facebook, ChatGPT) fill remaining slots — consistent with a popularity component. Descriptive titles are common across the category: "Tubi - Free Movies and TV", "MEGOGO TV & Movies", "Fandango: Movies & Series", "StreamFinder — Where to Watch Movies & Streaming Guide".

### A5. Keyword research
Method: Store autosuggest (the same service the Store app calls) for US and PK prefixes; result-set analysis per query; relevance to real MTStreams features (verified in the app's source); policy screening.

Autosuggest demand signals: "free movies", "movies", "watch movies", "tv shows", "free tv shows", "movies and tv", "web series" (PK top for "series"), "trailer/trailers", "hd movies", "movies anywhere" (brand).

| # | Keyword | Intent | Why it fits MTStreams | Advantage / competition | Policy notes | vs. old list |
|---|---|---|---|---|---|---|
| 1 | Movies | Broad "movie app" | Core catalogue | Highest-volume head term; very competitive | OK | Kept |
| 2 | TV shows | Find series to watch | Full TV section, seasons, episodes | High demand (autosuggest) | OK | Kept |
| 3 | Movie Streaming | Streaming intent | Playback sources | MoviesFlix ranks 5–9 in PK/IN — reachable cluster | Must keep 3rd-party disclosure (done) | Kept |
| 4 | watch movies | Action intent | Watch/trailer/playback | Autosuggest US + PK | OK | Replaces "Movie Discovery" (no demand signal) |
| 5 | tv series | Series intent | TV pages, season library | Common phrasing; also matches "series" | OK | New |
| 6 | web series | South-Asian phrasing for series | Same | PK autosuggest #1 for "series"; key market for MTStreams | OK | Replaces "Entertainment" (category word, no observed lift) |
| 7 | movie trailers | Trailer intent | Official trailer player | Autosuggest "trailer(s)" | OK | Replaces "Trailers" (more specific) |

Excluded on purpose: **"free"/"free movies"** (pricing term — policy 10.1.3), **"netflix"** and other services' names (other product titles — 10.1.3), **"movies and tv"** (= Microsoft's app title "Movies & TV"), **"hd movies"** (quality can't be guaranteed — 10.1 accuracy). Partner Center's own AI suggestions ("MTStreams", "MTStreams app", "trending movies app", "season library app") were not used: brand terms already match through the name, and the others have no demand signal.

Limits verified in Partner Center and Microsoft Learn: 7 keywords, 40 characters each, 21 words total. Final list: 7 keywords, 13 words, longest 15 characters.

---

## B. Final listing metadata (saved in the draft)
- **Product name:** MTStreams: Movies & TV Shows (reserved 13 Nov 2026)
- **Short description (232 chars):** see `listing-en-US.md`
- **Description (1,845 chars):** see `listing-en-US.md`
- **Keywords:** Movies · TV shows · Movie Streaming · watch movies · tv series · web series · movie trailers
- **Features (10):** see `listing-en-US.md`
- **Primary category:** Entertainment (unchanged) · **Secondary:** Photo + video (was Medical)

## C. Screenshot package
Folder: `store-listing/screenshots/` — 8 × PNG, 3840 × 2160, captured from the live app (https://mtstreams.vercel.app) on 13 Nov 2026 in headless Microsoft Edge, no browser UI. Uploaded in this order with captions:
1. 01-home-spotlight — "Discover what to watch with a featured spotlight and trending titles"
2. 02-trending-and-coming-soon — "Browse trending movies and series and see what's coming soon"
3. 03-search-results — "Search films, series and people in one place"
4. 04-movie-details — "Every movie at a glance: runtime, genres, rating and trailer"
5. 05-cast-and-crew — "Explore the storyline, cast and crew behind each title"
6. 06-tv-series-details — "Detailed pages for every TV series"
7. 07-season-library — "Browse every season in the season library"
8. 08-episode-guide — "Pick an episode from the season-by-season episode guide"

Deliberately excluded: the playback screen (it shows a third party's film footage — IP risk under policy 11.2), the trailer frame (mostly studio promotional art), and the Movies grid (large empty area at desktop width). YouTube was blocked during capture so movie pages show their own backdrop instead of a black loading trailer frame — the state users see before a preview starts.

## D. Implementation summary (Submission 2 — saved as draft, NOT submitted)

| Field | Previous | New |
|---|---|---|
| Product name | MTStreams | MTStreams: Movies & TV Shows |
| Short description | "Discover movies and TV shows, explore title details and trailers, and access available playback sources with MTStreams." | 232-char version (see listing file) |
| Description | 7-bullet version with "**Features**" (Markdown asterisks don't render in the Store) | Sectioned plain-text version with TMDB credit and hosting disclaimer |
| Product features | 5 short items | 10 specific items |
| Keywords | Movies, TV shows, Movie Discovery, Entertainment, Movie Streaming, Trailers | Movies, TV shows, Movie Streaming, watch movies, tv series, web series, movie trailers |
| Screenshots | 3 × 1440×900, no captions | 8 × 3840×2160, captioned |
| Secondary category | Medical | Photo + video |
| Reserved names | MTStreams | + MTStreams: Movies & TV Shows |

Left unchanged on purpose: pricing, markets (240) and availability; packages; age rating (ESRB Everyone — see risks); short title "MTStreams" (Xbox field); "What's new" (no new version); privacy policy URL, website and support contact; copyright; product declarations; system requirements.

Outstanding before going live: you must press **Submit for certification**. Certification typically takes up to 3 business days.

**Risks to weigh before submitting**
1. **Name (policy 10.1.1).** "Must not contain marketing or descriptive text, including extraneous use of keywords." Many approved apps use this pattern, but a reviewer could reject it. Fallback: choose "MTStreams" in the dropdown and resubmit. The installed app keeps showing "MTStreams" (name comes from the package).
2. **Age rating.** Listing says ESRB Everyone, but the app gives open access to mature films/series and trailers. A reviewer could treat that as inaccurate. Redoing the rating questionnaire is recommended; it may limit visibility on family-filtered devices.
3. **Third-party playback.** The new text states plainly that MTStreams doesn't host content. That is accurate, but certification may still look at playback sources under policy 11.2. This exists today and is not introduced by this update.

## E. Monitoring plan

**Baseline (Partner Center, last 30 days, 13 Nov 2026):** page views 17 (Microsoft Store on Windows 16, external web URL 1, Store web 0, Bing 0, campaigns 0); installs 6; conversion 35.29%; install success 100%; first-time launches ≈3; sessions 1; average engagement 3 min; ratings 1 (5★). Search positions: `monitoring/baseline.txt`.

**What Partner Center can and can't tell you**
- Available: page views and installs by source type (Microsoft Store on Windows, Microsoft Store web, external web URL, Bing web search, custom campaign, Xbox app), conversion, install success, market and device filters, usage (opt-in), health, ratings and reviews.
- Not available: keyword-level impressions or search positions. "Microsoft Store on Windows" mixes Store search with browsing and direct deep links, so search traffic can't be isolated exactly.
- Workaround: weekly position checks with `monitoring/rank.py` (PK, IN, US, GB; the query list in its README), plus the "Microsoft Store on Windows" page-view trend.

**Schedule**
- Day 1–3 after it goes live: confirm the live listing shows the new name/text/screenshots; run `rank.py`.
- Weekly for 8 weeks (same weekday): Acquisitions (page views by source, installs, conversion) per market — PK, IN, US, GB; ratings; `rank.py` output appended to a history file.
- Week 4 and week 8: decide.

**Success criteria (relative, not promised positions)**
- Primary: MTStreams appears in the top 100 for at least 3 generic queries in PK or IN, then trends upward.
- Primary: "Microsoft Store on Windows" page views rise clearly above the baseline of ~16 per 30 days without a matching rise in external traffic.
- Secondary: conversion stays at or above ~30%; ratings grow (ask satisfied users for ratings in-app or on the website — ratings were a confirmed signal in 2016).
- If nothing moves by week 8: revisit the keyword set using what `rank.py` shows, and consider a "Product page experiment" (Partner Center) on screenshots.

## Sources
- Microsoft Store Policies v7.20 (10.1, 10.1.1, 10.1.3, 10.2.4, 10.7, 11.2): https://learn.microsoft.com/en-us/windows/apps/publish/store-policies
- Store listing fields and limits (PWA): https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/pwa/add-and-edit-store-listing-info
- Store listing fields (MSIX; Product name dropdown behaviour): https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/add-and-edit-store-listing-info
- Screenshots, images and trailers: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/screenshots-and-images
- Keyword limits: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/add-additional-information
- App name reservations / renaming: https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/msix/manage-app-name-reservations
- Insights for apps and games: https://learn.microsoft.com/en-us/partner-center/insights/apps-and-games-overview
- Promote your app (campaign tracking): https://learn.microsoft.com/en-us/windows/apps/publish/attract-customers-and-promote-your-apps
- Changes to Store listings and search algorithms (2015): https://blogs.windows.com/windowsdeveloper/2015/07/24/changes-to-store-listings-and-search-algorithms/
- Improvements to Store visibility (2016): https://blogs.windows.com/windowsdeveloper/2016/02/22/improvements-to-windows-store-apps-and-games-visibility/
- Community reports of new apps missing from search (not Microsoft staff): https://learn.microsoft.com/en-us/answers/questions/4046293/ and https://learn.microsoft.com/en-us/answers/questions/975455/
