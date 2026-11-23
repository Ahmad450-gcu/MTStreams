const cinemaosProvider = {
    id: "cinemaos",
    name: "CinemaOS",

    supports: (category) => ["movie", "tv"].includes(category),

    getPlaybackUrl: ({ category, id, season, episode }) => {
        if (category === "tv") {
            return `https://cinemaos.tech/watch/tv/${id}?season=${season}&episode=${episode}`;
        }

        return `https://cinemaos.tech/player/${id}`;
    },
};

export default cinemaosProvider;
