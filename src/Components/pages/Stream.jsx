import { useState } from "react";
import useFullScreen from "../../hooks/useFullScreen";
import { useNavigate, useParams } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { captureEvent } from "../../analytics/posthog.js";
import { getStreamProvider } from "../../utils/streamProvider";
import {
      getPlaybackProviders,
      getPlaybackProvider
} from "../../utils/playbackProviders";

const Stream = ({ category }) => {
      useFullScreen();

      const { id, season, seasonID } = useParams();
      const navigate = useNavigate();

      const availableProviders = getPlaybackProviders(category);

      const [provider, setProvider] = useState(() => {
            const defaultProvider = getStreamProvider();

            return availableProviders.some((item) => item.id === defaultProvider)
                  ? defaultProvider
                  : availableProviders[0]?.id;
      });

      const selectedProvider = getPlaybackProvider(provider);

      const url = selectedProvider?.getPlaybackUrl({
            category,
            id,
            season,
            episode: seasonID
      });

      return (
            <section
                  style={{
                        backgroundImage: "radial-gradient(transparent 1px, #08090d 1px)",
                        backgroundSize: "3px 3px",
                        backdropFilter: "brightness(1) blur(10px)",
                  }}
                  className="w-full fixed no-scroll inset-0 z-50 h-[92dvh] md:h-screen flex justify-center items-center"
            >
                  <div className="stream-server-list fixed top-3 left-3 z-20 flex items-center gap-2" role="group" aria-label="Choose playback server">
                        {/* Modified loop: Added index tracking to dynamically number the servers */}
                        {availableProviders.map((item, index) => (
                              <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                          if (provider === item.id) return;
                                          setProvider(item.id);
                                          captureEvent("player_provider_selected", {
                                                player_provider: item.id,
                                                content_type: category,
                                                content_id: String(id),
                                                ...(category === "tv" && {
                                                      season_number: Number(season),
                                                      episode_number: Number(seasonID),
                                                }),
                                          });
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize backdrop-blur transition-colors ${
                                          provider === item.id
                                                ? "bg-white text-black"
                                                : "bg-white/20 text-white hover:bg-white/40"
                                    }`}
                              >
                                    Server {index + 1}
                              </button>
                        ))}
                  </div>

                  <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Close player"
                        className="fixed cursor-pointer z-20 bg-white/30 backdrop-blur rounded-full p-2 top-3 right-3"
                  >
                        <MdClose size="1.5rem" color="black" />
                  </button>

                  {url && (
                        <iframe
                              key={`${provider}-${url}`}
                              referrerPolicy="origin"
                              title="Movie Player"
                              src={url}
                              width="95%"
                              height="95%"
                              allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                        />
                  )}
            </section>
      );
};

export default Stream;
