const vidsrctoProvider = {
    id: "vidsrcto",
    name: "VidSrc.to",
    supports(category) {
        return category === "movie" || category === "tv";
    },
    getPlaybackUrl({ category, id, season, episode }) {
        if (!id) return "";
        if (category === "movie") {
            return "https://" + "vidsrc.to/embed/movie/" + id;
        }
        if (category === "tv") {
            const s = season ?? 1;
            const e = episode ?? 1;
            return "https://" + "vidsrc.to/embed/tv/" + id + "/" + s + "/" + e;
        }
        return "";
    }
};
export default vidsrctoProvider;
