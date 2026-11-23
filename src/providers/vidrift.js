const vidriftProvider = {
    id: "vidrift",
    name: "VidRift",
    supports(category) {
        return category === "movie" || category === "tv";
    },
    getPlaybackUrl({ category, id, season, episode }) {
        if (!id) return "";
        if (category === "movie") {
            return "https://" + "embed.vidrift.in/embed/movie/" + id;
        }
        if (category === "tv") {
            const s = season ?? 1;
            const e = episode ?? 1;
            return "https://" + "embed.vidrift.in/embed/tv/" + id + "/" + s + "/" + e;
        }
        return "";
    }
};
export default vidriftProvider;
