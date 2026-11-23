const vidlinkProvider = {
    id: "vidlink",
    name: "VidLink",
    supports(category) {
        return category === "movie" || category === "tv";
    },
    getPlaybackUrl({ category, id, season, episode }) {
        if (!id) return "";
        if (category === "movie") {
            return "https://" + "vidlink.pro/movie/" + id;
        }
        if (category === "tv") {
            const s = season ?? 1;
            const e = episode ?? 1;
            return "https://" + "vidlink.pro/tv/" + id + "/" + s + "/" + e;
        }
        return "";
    }
};
export default vidlinkProvider;
