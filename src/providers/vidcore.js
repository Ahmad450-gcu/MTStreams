const vidcoreProvider = {
    id: "vidcore",
    name: "VidCore",

    supports: (category) => ["movie", "tv"].includes(category),

    getPlaybackUrl: ({ category, id, season, episode }) => {
        if (category === "tv") {
            return `https://vidcore.io/tv/${id}/${season}/${episode}?autoPlay=true`;
        }

        return `https://vidcore.io/movie/${id}?autoPlay=true`;
    },
};

export default vidcoreProvider;
