// Static discovery data: genres, moods and presets. Nothing here makes a
// network request; TMDB genre ids are stable, so they are kept locally.

export const GENRES = {
      movie: [
            [28, "Action"], [12, "Adventure"], [16, "Animation"], [35, "Comedy"], [80, "Crime"], [99, "Documentary"],
            [18, "Drama"], [10751, "Family"], [14, "Fantasy"], [36, "History"], [27, "Horror"], [10402, "Music"],
            [9648, "Mystery"], [10749, "Romance"], [878, "Science Fiction"], [53, "Thriller"], [10752, "War"], [37, "Western"],
      ],
      tv: [
            [10759, "Action & Adventure"], [16, "Animation"], [35, "Comedy"], [80, "Crime"], [99, "Documentary"], [18, "Drama"],
            [10751, "Family"], [10762, "Kids"], [9648, "Mystery"], [10764, "Reality"], [10765, "Sci-Fi & Fantasy"],
            [10766, "Soap"], [10768, "War & Politics"], [37, "Western"],
      ],
};

export const LANGUAGES = [
      ["", "Any language"], ["en", "English"], ["hi", "Hindi"], ["ur", "Urdu"], ["ko", "Korean"], ["ja", "Japanese"],
      ["es", "Spanish"], ["fr", "French"], ["de", "German"], ["it", "Italian"], ["tr", "Turkish"], ["zh", "Chinese"],
      ["ta", "Tamil"], ["te", "Telugu"], ["pt", "Portuguese"], ["ar", "Arabic"],
];

export const SORTS = {
      movie: [["popularity.desc", "Most popular"], ["vote_average.desc", "Highest rated"], ["primary_release_date.desc", "Newest"], ["revenue.desc", "Box office"]],
      tv: [["popularity.desc", "Most popular"], ["vote_average.desc", "Highest rated"], ["first_air_date.desc", "Newest"]],
};

/**
 * Moods map to TMDB genres (any-of), genres to avoid, and a quality floor.
 * TV has no Horror or Romance genre on TMDB, so those moods use the closest
 * TV genres and say so in `tvNote`.
 */
export const MOODS = [
      { key: "happy", label: "Happy", emoji: "😊", movie: { with: [35, 10751, 16, 10402], without: [27, 53] }, tv: { with: [35, 10751, 16], without: [80] } },
      { key: "relaxing", label: "Relaxing", emoji: "🌿", movie: { with: [99, 10751, 16, 35], without: [27, 53, 28, 10752] }, tv: { with: [99, 35, 10764], without: [80, 10759] } },
      { key: "emotional", label: "Emotional", emoji: "💧", movie: { with: [18, 10749], without: [35] }, tv: { with: [18, 10766], without: [35] } },
      { key: "exciting", label: "Exciting", emoji: "⚡", movie: { with: [28, 12], without: [] }, tv: { with: [10759], without: [] } },
      { key: "suspenseful", label: "Suspenseful", emoji: "🕵️", movie: { with: [53, 9648, 80], without: [35, 10751] }, tv: { with: [9648, 80], without: [35, 10751] } },
      { key: "scary", label: "Scary", emoji: "👻", movie: { with: [27], without: [35] }, tv: { with: [9648, 10765], without: [35, 10751] }, tvNote: "TMDB has no horror genre for series, so this uses mystery and sci-fi & fantasy." },
      { key: "inspirational", label: "Inspirational", emoji: "🌅", movie: { with: [36, 99], without: [27] }, tv: { with: [99], without: [] } },
      { key: "romantic", label: "Romantic", emoji: "💞", movie: { with: [10749], without: [27] }, tv: { with: [18, 10766], without: [80] }, tvNote: "TMDB has no romance genre for series, so this uses drama and soap." },
      { key: "funny", label: "Funny", emoji: "😂", movie: { with: [35], without: [27] }, tv: { with: [35], without: [] } },
      { key: "thoughtful", label: "Thought-provoking", emoji: "🧠", movie: { with: [878, 9648, 99], without: [10751] }, tv: { with: [10765, 99], without: [10751] }, minRating: 7 },
];

/** Hidden gems: well rated, but with a modest (not tiny) number of votes. */
export const HIDDEN_GEMS = { minRating: 7.2, minVotes: 150, maxVotes: 1500, sort: "vote_average.desc" };

export const DEFAULT_FILTERS = {
      type: "movie",
      genres: [],
      match: "any",
      without: [],
      from: "",
      to: "",
      rating: "",
      votes: "",
      maxVotes: "",
      lang: "",
      runMin: "",
      runMax: "",
      cast: "",
      castName: "",
      crew: "",
      crewName: "",
      sort: "popularity.desc",
      mood: "",
      hideSeen: "1",
};

/** Turn the filter state into validated TMDB Discover parameters. */
export function toDiscoverParams(filters, page = 1) {
      const movie = filters.type !== "tv";
      const params = { page, include_adult: "false", sort_by: filters.sort || "popularity.desc" };
      if (filters.genres.length) params.with_genres = filters.genres.join(filters.match === "all" ? "," : "|");
      if (filters.without.length) params.without_genres = filters.without.join(",");
      const dateKey = movie ? "primary_release_date" : "first_air_date";
      const year = (value) => (/^\d{4}$/.test(value) ? Number(value) : null);
      if (year(filters.from)) params[`${dateKey}.gte`] = `${filters.from}-01-01`;
      if (year(filters.to)) params[`${dateKey}.lte`] = `${filters.to}-12-31`;
      if (Number(filters.rating) > 0) params["vote_average.gte"] = String(Math.min(10, Number(filters.rating)));
      // Sorting by rating without a vote floor surfaces titles with one vote.
      const minVotes = Number(filters.votes) || (params.sort_by.startsWith("vote_average") ? 200 : Number(filters.rating) > 0 ? 50 : 0);
      if (minVotes > 0) params["vote_count.gte"] = String(minVotes);
      if (Number(filters.maxVotes) > 0) params["vote_count.lte"] = String(Number(filters.maxVotes));
      if (filters.lang) params.with_original_language = filters.lang;
      if (Number(filters.runMin) > 0) params["with_runtime.gte"] = String(Number(filters.runMin));
      if (Number(filters.runMax) > 0) params["with_runtime.lte"] = String(Number(filters.runMax));
      // TMDB supports cast/crew filters for movies only.
      if (movie && /^\d+$/.test(filters.cast)) params.with_cast = filters.cast;
      if (movie && /^\d+$/.test(filters.crew)) params.with_crew = filters.crew;
      return params;
}
