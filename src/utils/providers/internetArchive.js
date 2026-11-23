const SEARCH_API = "https://archive.org/advancedsearch.php";
const API_BASE = "https://archive.org/metadata/";

const ALLOWED_LICENSES = [
    /creativecommons\.org\/licenses\/by\//i,
    /creativecommons\.org\/licenses\/by-sa\//i,
    /creativecommons\.org\/publicdomain\/zero\//i,
    /creativecommons\.org\/publicdomain\/mark\//i,
];

function hasDeclaredOpenLicense(url = "") {
    return ALLOWED_LICENSES.some((license) => license.test(url));
}

export async function searchInternetArchive(title) {
    if (!title?.trim()) {
        throw new Error("A movie title is required.");
    }

    const safeTitle = title.trim().replace(/["\\]/g, "\\$&");
    const params = new URLSearchParams({
        q: `title:"${safeTitle}" AND mediatype:movies`,
        rows: "10",
        page: "1",
        output: "json",
    });

    ["identifier", "title", "year", "licenseurl"].forEach((field) => {
        params.append("fl[]", field);
    });

    const response = await fetch(`${SEARCH_API}?${params}`);

    if (!response.ok) {
        throw new Error("Internet Archive search failed.");
    }

    const result = await response.json();

    return (result.response?.docs ?? [])
        .filter((item) => hasDeclaredOpenLicense(item.licenseurl))
        .map((item) => ({
            identifier: item.identifier,
            title: item.title,
            year: item.year ?? null,
            licenseUrl: item.licenseurl,
        }));
}

export async function getInternetArchivePlayback(identifier) {
    if (!identifier) {
        throw new Error("An Internet Archive item identifier is required.");
    }

    const response = await fetch(
        `${API_BASE}${encodeURIComponent(identifier)}`
    );

    if (!response.ok) {
        throw new Error("Could not retrieve Internet Archive metadata.");
    }

    const result = await response.json();
    const metadata = result.metadata ?? {};
    const licenseUrl = metadata.licenseurl ?? "";

    if (!hasDeclaredOpenLicense(licenseUrl)) {
        throw new Error("This item does not declare one of our accepted open licences.");
    }

    const files = result.files ?? [];
    const video = files.find(
        (file) =>
            file.name?.toLowerCase().endsWith(".mp4") &&
            !file.name.toLowerCase().includes("_thumb")
    );

    if (!video) {
        throw new Error("No compatible MP4 video file was found.");
    }

    return {
        url: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(video.name)}`,
        title: metadata.title ?? identifier,
        licenseUrl,
        type: "video/mp4",
    };
}
