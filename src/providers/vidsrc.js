const vidsrcProvider = {
    id: "vidsrc",
    name: "VidSrc",

    supports(category) {
        return category === "movie" || category === "tv";
    },

    getPlaybackUrl({ category, id, season, episode }) {
        if (!id) return "";

        if (category === "movie") {
            return `https://vidsrc.mov/embed/movie/${id}`;
        }

        if (category === "tv") {
            const s = season ?? 1;
            const e = episode ?? 1;
            return `https://vidsrc.mov/embed/tv/${id}/${s}/${e}`;
        }

        return "";
    }
};

export default vidsrcProvider;
