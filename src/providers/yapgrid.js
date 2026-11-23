const yapgridProvider = {
    id: "yapgrid",
    name: "YapGrid (Ad-Free)",
    supports(category) {
        return category === "movie" || category === "tv";
    },
    getPlaybackUrl({ category, id, season, episode }) {
        if (!id) return "";
        if (category === "movie") {
            return "https://" + "yapgrid.com/embed/movie/" + id;
        }
        if (category === "tv") {
            const s = season ?? 1;
            const e = episode ?? 1;
            return "https://" + "yapgrid.com/embed/tv/" + id + "/" + s + "/" + e;
        }
        return "";
    }
};
export default yapgridProvider;
