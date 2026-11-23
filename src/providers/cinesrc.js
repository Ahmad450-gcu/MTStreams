const cinesrcProvider = {
    id: "cinesrc",
    name: "CineSrc",
    supports(category) {
        return category === "movie" || category === "tv";
    },
    getPlaybackUrl({ category, id, season, episode }) {
        if (!id) return "";
        if (category === "movie") {
            return "https://" + "cinesrc.st/embed/movie/" + id;
        }
        if (category === "tv") {
            const s = season ?? 1;
            const e = episode ?? 1;
            return "https://" + "cinesrc.st/embed/tv/" + id + "/" + s + "/" + e;
        }
        return "";
    }
};
export default cinesrcProvider;
