// Registry of the OTT experiences MTStreams can emulate.
//
// Each service lists the TMDB watch-provider IDs and provider-name patterns
// that identify it. Membership is decided from a title's *global* flatrate
// providers (every country TMDB returns), never from a single region.
//
// `seedRegions` are only used to find *candidates* quickly through TMDB
// Discover. Every candidate is still verified against its global provider list.

export const SERVICES = {
      netflix: {
            key: "netflix",
            name: "Notflix",
            brand: "Netflix-inspired",
            providerIds: [8, 1796, 175],
            namePattern: /^netflix/i,
            seedRegions: ["US", "GB", "IN", "JP", "KR", "BR", "CA", "DE", "FR", "ES", "MX", "AU"],
            accent: "#e50914",
            background: "#141414",
            fonts: [],
      },
      prime: {
            key: "prime",
            name: "prima video",
            brand: "Prime Video-inspired",
            providerIds: [9, 119, 2100],
            namePattern: /^(amazon )?prime video/i,
            seedRegions: ["US", "GB", "IN", "DE", "JP", "CA", "FR", "BR", "ES", "IT"],
            accent: "#1a98ff",
            background: "#00050d",
            fonts: ["Inter:wght@400;500;600;700;800"],
      },
      max: {
            key: "max",
            name: "HBX max",
            brand: "HBO Max-inspired",
            providerIds: [1899, 384, 1825],
            namePattern: /^(hbo\s*)?max\b/i,
            seedRegions: ["US", "MX", "BR", "ES", "NL", "PL", "SE", "FR", "AU", "GB"],
            accent: "#0047ff",
            background: "#000000",
            fonts: ["Montserrat:wght@400;500;600;700;800"],
      },
      disney: {
            key: "disney",
            name: "Dizney+",
            brand: "Disney+-inspired",
            providerIds: [337],
            namePattern: /^disney\s*(\+|plus)(?!.*hotstar)/i,
            seedRegions: ["US", "GB", "CA", "AU", "DE", "FR", "JP", "BR", "ES", "MX"],
            accent: "#0063e5",
            background: "#1a1d29",
            fonts: ["Nunito+Sans:wght@400;600;700;800"],
      },
      hulu: {
            key: "hulu",
            name: "hulo",
            brand: "Hulu-inspired",
            providerIds: [15],
            namePattern: /^hulu/i,
            seedRegions: ["US", "JP"],
            accent: "#1ce783",
            background: "#0b0c0f",
            fonts: ["Inter:wght@400;500;600;700;800"],
      },
      paramount: {
            key: "paramount",
            name: "Paramont+",
            brand: "Paramount+-inspired",
            providerIds: [531, 582, 633, 1853, 2303, 2616],
            namePattern: /^paramount\s*(\+|plus)/i,
            seedRegions: ["US", "GB", "CA", "AU", "DE", "FR", "IT", "BR", "MX", "KR"],
            accent: "#0064ff",
            background: "#0a0f1e",
            fonts: ["Montserrat:wght@400;500;600;700;800"],
      },
      apple: {
            key: "apple",
            name: "Pear TV+",
            brand: "Apple TV+-inspired",
            providerIds: [350, 2243],
            namePattern: /^apple tv\b/i,
            seedRegions: ["US", "GB", "CA", "DE", "FR", "JP", "AU", "BR", "IN", "IT"],
            accent: "#ffffff",
            background: "#000000",
            fonts: ["Inter:wght@400;500;600;700"],
      },
      mgm: {
            key: "mgm",
            name: "MGN+",
            brand: "MGM+-inspired",
            providerIds: [34, 583, 636],
            namePattern: /^mgm\s*(\+|plus)/i,
            seedRegions: ["US", "CA", "GB", "DE"],
            accent: "#c8a45d",
            background: "#000000",
            fonts: ["Playfair+Display:wght@500;600;700", "Inter:wght@400;500;600;700"],
      },
      peacock: {
            key: "peacock",
            name: "peacoq",
            brand: "Peacock-inspired",
            providerIds: [386, 387],
            namePattern: /^peacock/i,
            seedRegions: ["US"],
            accent: "#ffffff",
            background: "#000000",
            fonts: ["DM+Sans:wght@400;500;700;800"],
      },
      crunchyroll: {
            key: "crunchyroll",
            name: "crunchyreel",
            brand: "Crunchyroll-inspired",
            providerIds: [283, 1968],
            namePattern: /^crunchyroll/i,
            seedRegions: ["US", "GB", "BR", "FR", "DE", "MX", "CA", "AU", "IN", "ES"],
            accent: "#f47521",
            background: "#000000",
            fonts: ["Lato:wght@400;700;900"],
            // Anime-first: unseeded candidates come from Japanese animation.
            candidateFilter: { with_genres: "16", with_original_language: "ja" },
      },
      hotstar: {
            key: "hotstar",
            name: "JioHotster",
            brand: "JioHotstar-inspired",
            // 2336 = JioHotstar (India), 122 = Hotstar (Disney+ Hotstar markets).
            providerIds: [2336, 122],
            namePattern: /hotstar/i,
            seedRegions: ["IN", "ID"],
            // Much of the catalogue (especially Hindi TV) is listed on TMDB
            // under the free-with-ads tier rather than as subscription.
            monetization: ["flatrate", "ads"],
            accent: "#1f80e0",
            background: "#0f1014",
            fonts: ["Inter:wght@400;500;600;700;800"],
      },
};

export const SERVICE_ORDER = [
      "netflix",
      "prime",
      "max",
      "disney",
      "hulu",
      "paramount",
      "apple",
      "mgm",
      "peacock",
      "crunchyroll",
      "hotstar",
];

export const getService = (key) => (key && SERVICES[key]) || null;

/** TMDB availability types that count as "on the service" (default: subscription only). */
export const monetizationOf = (service) => service?.monetization || ["flatrate"];

/**
 * Changes whenever the registry's matching rules change, so cached title
 * classifications made under older rules are discarded.
 */
export const REGISTRY_SIGNATURE = SERVICE_ORDER.map((key) => `${key}:${monetizationOf(SERVICES[key]).join("|")}`).join(",");

/**
 * Returns the service keys whose provider appears in ANY country's
 * availability lists of a TMDB `/watch/providers` response. Each service
 * only considers its own monetization types (subscription unless the
 * service says otherwise).
 */
const MONETIZATION_TYPES = [...new Set(SERVICE_ORDER.flatMap((key) => monetizationOf(SERVICES[key])))];
const SERVICES_BY_TYPE = Object.fromEntries(
      MONETIZATION_TYPES.map((type) => [type, SERVICE_ORDER.filter((key) => monetizationOf(SERVICES[key]).includes(type))]),
);

export function servicesFromProviderResults(results) {
      const matched = new Set();
      if (!results || typeof results !== "object") return [];

      for (const country of Object.values(results)) {
            for (const type of MONETIZATION_TYPES) {
                  const providers = Array.isArray(country?.[type]) ? country[type] : [];
                  for (const provider of providers) {
                        for (const key of SERVICES_BY_TYPE[type]) {
                              if (matched.has(key)) continue;
                              const service = SERVICES[key];
                              if (
                                    service.providerIds.includes(provider.provider_id) ||
                                    (provider.provider_name && service.namePattern.test(provider.provider_name.trim()))
                              ) {
                                    matched.add(key);
                              }
                        }
                  }
            }
      }

      return SERVICE_ORDER.filter((key) => matched.has(key));
}

export const MOVIE_GENRES = {
      28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary",
      18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
      9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

export const TV_GENRES = {
      10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary",
      18: "Drama", 10751: "Family", 10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality",
      10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics", 37: "Western",
};

export const genreName = (id, mediaType) =>
      (mediaType === "tv" ? TV_GENRES[id] : MOVIE_GENRES[id]) || MOVIE_GENRES[id] || TV_GENRES[id] || "";

export const genreNames = (item, max = 3) => {
      const ids = item?.genre_ids || (item?.genres || []).map((genre) => genre.id);
      const type = item?.media_type || (item?.first_air_date !== undefined ? "tv" : "movie");
      return ids.map((id) => genreName(id, type)).filter(Boolean).slice(0, max);
};
