import vidriftProvider from "../providers/vidrift.js";
import vidcoreProvider from "../providers/vidcore.js";
import vidsrcProvider from "../providers/vidsrc.js";
import vidlinkProvider from "../providers/vidlink.js";
import cinesrcProvider from "../providers/cinesrc.js";
import vidsrctoProvider from "../providers/vidsrcto.js";
import yapgridProvider from "../providers/yapgrid.js";
import embedwaveProvider from "../providers/embedwave.js";

const providers = new Map();

export function registerPlaybackProvider(provider) {
    if (
        !provider?.id ||
        !provider?.name ||
        typeof provider.getPlaybackUrl !== "function"
    ) {
        throw new Error("Invalid playback provider configuration.");
    }

    providers.set(provider.id, provider);
}

export function getPlaybackProviders(category) {
    return [...providers.values()].filter(
        (provider) => !provider.supports || provider.supports(category)
    );
}

export function getPlaybackProvider(id) {
    return providers.get(id) ?? null;
}

registerPlaybackProvider(vidriftProvider);
registerPlaybackProvider(vidcoreProvider);
registerPlaybackProvider(vidsrcProvider);
registerPlaybackProvider(vidlinkProvider);
registerPlaybackProvider(cinesrcProvider);
registerPlaybackProvider(vidsrctoProvider);
registerPlaybackProvider(yapgridProvider);
registerPlaybackProvider(embedwaveProvider);
